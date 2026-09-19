from typing import List, Optional
import re
from services.document_processor.base import DocumentChunk


class ChunkingService:
    """Service for intelligently chunking documents"""

    def __init__(self,
                 chunk_size: int = 500,
                 overlap: int = 50,
                 min_chunk_size: int = 100):
        """
        Initialize the chunking service

        Args:
            chunk_size: Target size for each chunk in characters
            overlap: Number of characters to overlap between chunks
            min_chunk_size: Minimum size for a chunk to be valid
        """
        self.chunk_size = chunk_size
        self.overlap = overlap
        self.min_chunk_size = min_chunk_size

    def chunk_text(self,
                   text: str,
                   page_number: Optional[int] = None,
                   section_title: Optional[str] = None) -> List[DocumentChunk]:
        """
        Split text into semantic chunks

        Args:
            text: The text to chunk
            page_number: Optional page number for the chunks
            section_title: Optional section title for the chunks

        Returns:
            List of DocumentChunk objects
        """
        # First, try to split by paragraphs
        paragraphs = self._split_into_paragraphs(text)

        chunks = []
        current_chunk = []
        current_size = 0
        chunk_index = 0

        for para in paragraphs:
            para_size = len(para)

            # If a single paragraph is too large, split it further
            if para_size > self.chunk_size:
                # Save current chunk if it exists
                if current_chunk:
                    chunk_text = "\n\n".join(current_chunk)
                    chunks.append(self._create_chunk(
                        chunk_text, chunk_index, page_number, section_title
                    ))
                    chunk_index += 1
                    current_chunk = []
                    current_size = 0

                # Split large paragraph by sentences
                para_chunks = self._split_large_paragraph(para)
                for para_chunk in para_chunks:
                    chunks.append(self._create_chunk(
                        para_chunk, chunk_index, page_number, section_title
                    ))
                    chunk_index += 1

            # If adding this paragraph would exceed chunk_size
            elif current_size + para_size > self.chunk_size:
                if current_chunk:
                    chunk_text = "\n\n".join(current_chunk)
                    chunks.append(self._create_chunk(
                        chunk_text, chunk_index, page_number, section_title
                    ))
                    chunk_index += 1

                # Start new chunk with overlap
                if self.overlap > 0 and current_chunk:
                    # Include last paragraph from previous chunk
                    current_chunk = [current_chunk[-1], para]
                    current_size = len(current_chunk[-2]) + para_size
                else:
                    current_chunk = [para]
                    current_size = para_size
            else:
                current_chunk.append(para)
                current_size += para_size

        # Add remaining chunk
        if current_chunk:
            chunk_text = "\n\n".join(current_chunk)
            if len(chunk_text) >= self.min_chunk_size:
                chunks.append(self._create_chunk(
                    chunk_text, chunk_index, page_number, section_title
                ))

        return chunks

    def _split_into_paragraphs(self, text: str) -> List[str]:
        """Split text into paragraphs"""
        # Split by double newlines or more
        paragraphs = re.split(r'\n\s*\n', text)
        # Filter out empty paragraphs
        return [p.strip() for p in paragraphs if p.strip()]

    def _split_large_paragraph(self, paragraph: str) -> List[str]:
        """Split a large paragraph into smaller chunks by sentences"""
        # Split by sentence boundaries
        sentences = re.split(r'(?<=[.!?])\s+', paragraph)

        chunks = []
        current_chunk = []
        current_size = 0

        for sentence in sentences:
            sentence_size = len(sentence)

            if current_size + sentence_size > self.chunk_size:
                if current_chunk:
                    chunks.append(" ".join(current_chunk))

                current_chunk = [sentence]
                current_size = sentence_size
            else:
                current_chunk.append(sentence)
                current_size += sentence_size

        if current_chunk:
            chunks.append(" ".join(current_chunk))

        return chunks

    def _create_chunk(self,
                     text: str,
                     chunk_index: int,
                     page_number: Optional[int] = None,
                     section_title: Optional[str] = None) -> DocumentChunk:
        """Create a DocumentChunk object"""
        return DocumentChunk(
            text=text,
            chunk_index=chunk_index,
            page_number=page_number,
            section_title=section_title,
            chunk_type="text",
            metadata={
                "char_count": len(text),
                "word_count": len(text.split())
            }
        )

    def chunk_by_slides(self,
                       slides: List[dict],
                       combine_small_slides: bool = True) -> List[DocumentChunk]:
        """
        Chunk slides, optionally combining small consecutive slides

        Args:
            slides: List of slide dictionaries with 'text' and 'slide_number'
            combine_small_slides: Whether to combine small consecutive slides

        Returns:
            List of DocumentChunk objects
        """
        chunks = []
        chunk_index = 0

        if not combine_small_slides:
            # Each slide is its own chunk
            for slide in slides:
                chunk = self._create_chunk(
                    text=slide.get('text', ''),
                    chunk_index=chunk_index,
                    page_number=slide.get('slide_number'),
                    section_title=slide.get('title', '')
                )
                chunk.chunk_type = "slide"
                chunks.append(chunk)
                chunk_index += 1
        else:
            # Combine small slides
            current_slides = []
            current_size = 0

            for slide in slides:
                slide_text = slide.get('text', '')
                slide_size = len(slide_text)

                if current_size + slide_size > self.chunk_size and current_slides:
                    # Create chunk from accumulated slides
                    combined_text = "\n\n---\n\n".join([s.get('text', '') for s in current_slides])
                    first_slide_num = current_slides[0].get('slide_number')

                    chunk = self._create_chunk(
                        text=combined_text,
                        chunk_index=chunk_index,
                        page_number=first_slide_num,
                        section_title=current_slides[0].get('title', '')
                    )
                    chunk.chunk_type = "slide"
                    chunk.metadata['slide_range'] = (
                        current_slides[0].get('slide_number'),
                        current_slides[-1].get('slide_number')
                    )
                    chunks.append(chunk)
                    chunk_index += 1

                    current_slides = [slide]
                    current_size = slide_size
                else:
                    current_slides.append(slide)
                    current_size += slide_size

            # Add remaining slides
            if current_slides:
                combined_text = "\n\n---\n\n".join([s.get('text', '') for s in current_slides])
                first_slide_num = current_slides[0].get('slide_number')

                chunk = self._create_chunk(
                    text=combined_text,
                    chunk_index=chunk_index,
                    page_number=first_slide_num,
                    section_title=current_slides[0].get('title', '')
                )
                chunk.chunk_type = "slide"
                if len(current_slides) > 1:
                    chunk.metadata['slide_range'] = (
                        current_slides[0].get('slide_number'),
                        current_slides[-1].get('slide_number')
                    )
                chunks.append(chunk)

        return chunks

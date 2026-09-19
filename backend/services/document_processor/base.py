from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from pathlib import Path


@dataclass
class ProcessedDocument:
    """Represents a processed document with extracted content"""
    text: str
    metadata: Dict[str, Any]
    pages: Optional[List[Dict[str, Any]]] = None
    images: Optional[List[bytes]] = None


@dataclass
class DocumentChunk:
    """Represents a chunk of text from a document"""
    text: str
    chunk_index: int
    page_number: Optional[int] = None
    section_title: Optional[str] = None
    chunk_type: str = "text"  # text, code, table, image_caption
    metadata: Optional[Dict[str, Any]] = None


class BaseDocumentProcessor(ABC):
    """Base class for all document processors"""

    def __init__(self):
        self.supported_extensions: List[str] = []

    @abstractmethod
    def process(self, file_path: Path) -> ProcessedDocument:
        """
        Process a document and extract its content

        Args:
            file_path: Path to the document file

        Returns:
            ProcessedDocument with extracted text and metadata
        """
        pass

    @abstractmethod
    def validate_file(self, file_path: Path) -> bool:
        """
        Validate if the file can be processed

        Args:
            file_path: Path to the document file

        Returns:
            True if file is valid and can be processed
        """
        pass

    def chunk_document(self,
                      text: str,
                      chunk_size: int = 500,
                      overlap: int = 50) -> List[DocumentChunk]:
        """
        Split document text into chunks with overlap

        Args:
            text: The text to chunk
            chunk_size: Maximum size of each chunk in characters
            overlap: Number of characters to overlap between chunks

        Returns:
            List of DocumentChunk objects
        """
        chunks = []
        start = 0
        chunk_index = 0

        while start < len(text):
            end = start + chunk_size
            chunk_text = text[start:end]

            # Try to break at sentence boundary
            if end < len(text):
                # Look for sentence ending punctuation
                last_period = chunk_text.rfind('.')
                last_question = chunk_text.rfind('?')
                last_exclaim = chunk_text.rfind('!')

                last_sentence = max(last_period, last_question, last_exclaim)

                if last_sentence > chunk_size * 0.5:  # Only break if we're past halfway
                    end = start + last_sentence + 1
                    chunk_text = text[start:end]

            chunks.append(DocumentChunk(
                text=chunk_text.strip(),
                chunk_index=chunk_index,
                metadata={"start": start, "end": end}
            ))

            chunk_index += 1
            start = end - overlap

        return chunks

    def extract_metadata(self, file_path: Path) -> Dict[str, Any]:
        """
        Extract basic metadata from file

        Args:
            file_path: Path to the file

        Returns:
            Dictionary containing file metadata
        """
        stat = file_path.stat()
        return {
            "filename": file_path.name,
            "file_size": stat.st_size,
            "file_extension": file_path.suffix,
            "created_at": stat.st_ctime,
            "modified_at": stat.st_mtime,
        }

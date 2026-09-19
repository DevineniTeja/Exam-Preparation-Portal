from pathlib import Path
from typing import List, Dict, Any
from docx import Document
from .base import BaseDocumentProcessor, ProcessedDocument


class DOCXProcessor(BaseDocumentProcessor):
    """Processor for Word (DOCX) documents"""

    def __init__(self):
        super().__init__()
        self.supported_extensions = ['.docx']

    def validate_file(self, file_path: Path) -> bool:
        """Validate if the DOCX file can be processed"""
        if not file_path.exists():
            return False

        if file_path.suffix.lower() not in self.supported_extensions:
            return False

        try:
            Document(file_path)
            return True
        except Exception:
            return False

    def process(self, file_path: Path) -> ProcessedDocument:
        """
        Process a Word document and extract its content

        Args:
            file_path: Path to the DOCX file

        Returns:
            ProcessedDocument with extracted text and metadata
        """
        if not self.validate_file(file_path):
            raise ValueError(f"Invalid DOCX file: {file_path}")

        doc = Document(file_path)

        # Extract metadata
        metadata = self.extract_metadata(file_path)
        core_props = doc.core_properties

        metadata.update({
            "title": core_props.title or "",
            "author": core_props.author or "",
            "subject": core_props.subject or "",
            "keywords": core_props.keywords or "",
            "comments": core_props.comments or "",
            "num_paragraphs": len(doc.paragraphs),
            "num_sections": len(doc.sections),
        })

        # Extract text structure
        sections = self._extract_sections(doc)
        all_text = []

        for section in sections:
            if section['title']:
                all_text.append(f"{section['title']}\n{section['content']}")
            else:
                all_text.append(section['content'])

        combined_text = "\n\n".join(all_text)

        return ProcessedDocument(
            text=combined_text,
            metadata=metadata,
            pages=sections
        )

    def _extract_sections(self, doc: Document) -> List[Dict[str, Any]]:
        """
        Extract sections from the document based on heading styles

        Args:
            doc: Document object

        Returns:
            List of dictionaries containing section information
        """
        sections = []
        current_section = {"title": "", "content": [], "level": 0}
        section_num = 1

        for para in doc.paragraphs:
            text = para.text.strip()

            if not text:
                continue

            # Check if paragraph is a heading
            if para.style.name.startswith('Heading'):
                # Save previous section if it has content
                if current_section['content']:
                    sections.append({
                        "section_number": section_num,
                        "title": current_section['title'],
                        "content": "\n".join(current_section['content']),
                        "char_count": sum(len(p) for p in current_section['content'])
                    })
                    section_num += 1

                # Start new section
                heading_level = int(para.style.name.replace('Heading ', ''))
                current_section = {
                    "title": text,
                    "content": [],
                    "level": heading_level
                }
            else:
                # Add to current section content
                current_section['content'].append(text)

        # Add the last section
        if current_section['content'] or current_section['title']:
            sections.append({
                "section_number": section_num,
                "title": current_section['title'],
                "content": "\n".join(current_section['content']),
                "char_count": sum(len(p) for p in current_section['content'])
            })

        # If no sections were created (no headings), create one default section
        if not sections:
            all_content = [para.text.strip() for para in doc.paragraphs if para.text.strip()]
            sections.append({
                "section_number": 1,
                "title": "",
                "content": "\n".join(all_content),
                "char_count": sum(len(p) for p in all_content)
            })

        return sections

    def extract_tables(self, file_path: Path) -> List[List[List[str]]]:
        """
        Extract tables from the document

        Args:
            file_path: Path to the DOCX file

        Returns:
            List of tables, where each table is a list of rows,
            and each row is a list of cell values
        """
        if not self.validate_file(file_path):
            raise ValueError(f"Invalid DOCX file: {file_path}")

        doc = Document(file_path)
        tables_data = []

        for table in doc.tables:
            table_data = []
            for row in table.rows:
                row_data = [cell.text.strip() for cell in row.cells]
                table_data.append(row_data)
            tables_data.append(table_data)

        return tables_data

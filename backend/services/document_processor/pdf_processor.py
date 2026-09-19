from pathlib import Path
from typing import List, Dict, Any
import PyPDF2
from .base import BaseDocumentProcessor, ProcessedDocument


class PDFProcessor(BaseDocumentProcessor):
    """Processor for PDF documents"""

    def __init__(self):
        super().__init__()
        self.supported_extensions = ['.pdf']

    def validate_file(self, file_path: Path) -> bool:
        """Validate if the PDF file can be processed"""
        if not file_path.exists():
            return False

        if file_path.suffix.lower() not in self.supported_extensions:
            return False

        # Try to open the PDF to verify it's valid
        try:
            with open(file_path, 'rb') as file:
                PyPDF2.PdfReader(file)
            return True
        except Exception:
            return False

    def process(self, file_path: Path) -> ProcessedDocument:
        """
        Process a PDF document and extract its content

        Args:
            file_path: Path to the PDF file

        Returns:
            ProcessedDocument with extracted text and metadata
        """
        if not self.validate_file(file_path):
            raise ValueError(f"Invalid PDF file: {file_path}")

        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)

            # Extract metadata
            metadata = self.extract_metadata(file_path)
            pdf_info = pdf_reader.metadata

            if pdf_info:
                metadata.update({
                    "title": pdf_info.get('/Title', ''),
                    "author": pdf_info.get('/Author', ''),
                    "subject": pdf_info.get('/Subject', ''),
                    "creator": pdf_info.get('/Creator', ''),
                    "producer": pdf_info.get('/Producer', ''),
                })

            metadata['num_pages'] = len(pdf_reader.pages)

            # Extract text from all pages
            pages = []
            all_text = []

            for page_num, page in enumerate(pdf_reader.pages, start=1):
                try:
                    page_text = page.extract_text()
                    if page_text:
                        pages.append({
                            "page_number": page_num,
                            "text": page_text,
                            "char_count": len(page_text)
                        })
                        all_text.append(page_text)
                except Exception as e:
                    # If a page fails, continue with others
                    print(f"Error extracting text from page {page_num}: {e}")
                    pages.append({
                        "page_number": page_num,
                        "text": "",
                        "error": str(e)
                    })

            combined_text = "\n\n".join(all_text)

            return ProcessedDocument(
                text=combined_text,
                metadata=metadata,
                pages=pages
            )

    def extract_text_by_page(self, file_path: Path) -> List[str]:
        """
        Extract text from PDF, one page at a time

        Args:
            file_path: Path to the PDF file

        Returns:
            List of text strings, one per page
        """
        if not self.validate_file(file_path):
            raise ValueError(f"Invalid PDF file: {file_path}")

        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            pages_text = []

            for page in pdf_reader.pages:
                try:
                    text = page.extract_text()
                    pages_text.append(text if text else "")
                except Exception:
                    pages_text.append("")

            return pages_text

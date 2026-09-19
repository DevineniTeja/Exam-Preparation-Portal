from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from typing import List
from pathlib import Path
import shutil
import os
from datetime import datetime

from database.db import get_db
from models.user import User
from models.slide import Slide
from models.chunk import Chunk
from utils.auth import get_current_user
from services.document_processor import PDFProcessor, PPTXProcessor, DOCXProcessor
from services.chunking_service import ChunkingService
from services.embedding_service import EmbeddingService

router = APIRouter(prefix="/api/slides", tags=["Slides"])

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Initialize processors
pdf_processor = PDFProcessor()
pptx_processor = PPTXProcessor()
docx_processor = DOCXProcessor()
chunking_service = ChunkingService(chunk_size=500, overlap=50)
embedding_service = EmbeddingService()

# Supported file extensions
SUPPORTED_EXTENSIONS = {'.pdf', '.pptx', '.docx'}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB


@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload and process a document (PDF, PPTX, or DOCX)
    """
    # Validate file extension
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type. Supported types: {', '.join(SUPPORTED_EXTENSIONS)}"
        )

    # Create user-specific upload directory
    user_upload_dir = UPLOAD_DIR / str(current_user.id)
    user_upload_dir.mkdir(exist_ok=True)

    # Generate unique filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_filename = f"{timestamp}_{file.filename}"
    file_path = user_upload_dir / safe_filename

    try:
        # Save uploaded file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Check file size
        if file_path.stat().st_size > MAX_FILE_SIZE:
            file_path.unlink()  # Delete file
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File size exceeds maximum allowed size of {MAX_FILE_SIZE // (1024*1024)} MB"
            )

        # Process document based on file type
        if file_ext == '.pdf':
            processor = pdf_processor
        elif file_ext == '.pptx':
            processor = pptx_processor
        elif file_ext == '.docx':
            processor = docx_processor
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unsupported file type"
            )

        # Extract content
        processed_doc = processor.process(file_path)

        # Get file size
        file_size = file_path.stat().st_size

        # Determine file type enum
        file_type_map = {'.pdf': 'pdf', '.pptx': 'pptx', '.docx': 'docx'}
        file_type_enum = file_type_map.get(file_ext, 'pdf')

        # Get total pages
        total_pages = processed_doc.metadata.get('num_pages',
                                                  processed_doc.metadata.get('num_slides',
                                                                            processed_doc.metadata.get('num_sections', 0)))

        # Create slide record
        slide = Slide(
            user_id=current_user.id,
            title=processed_doc.metadata.get('title', file.filename),
            filename=file.filename,
            file_path=str(file_path),
            file_type=file_type_enum,
            file_size=file_size,
            total_pages=total_pages,
            processing_status='completed'
        )

        db.add(slide)
        db.flush()  # Get the slide ID

        # Create chunks
        if processed_doc.pages:
            # Chunk by slides/pages
            chunks = chunking_service.chunk_by_slides(processed_doc.pages, combine_small_slides=True)
        else:
            # Chunk by text
            chunks = chunking_service.chunk_text(processed_doc.text)

        # Generate embeddings and save chunks
        for doc_chunk in chunks:
            # Generate embedding
            embedding = embedding_service.generate_embedding(doc_chunk.text)
            embedding_bytes = embedding_service.serialize_embedding(embedding)

            # Create chunk record
            chunk = Chunk(
                slide_id=slide.id,
                chunk_text=doc_chunk.text,
                chunk_index=doc_chunk.chunk_index,
                page_number=doc_chunk.page_number,
                section_title=doc_chunk.section_title,
                chunk_type=doc_chunk.chunk_type,
                embedding=embedding_bytes,
                meta_data=doc_chunk.metadata
            )
            db.add(chunk)

        db.commit()
        db.refresh(slide)

        return {
            "id": slide.id,
            "title": slide.title,
            "file_name": slide.filename,
            "file_type": slide.file_type,
            "num_pages": slide.total_pages,
            "num_chunks": len(chunks),
            "created_at": slide.created_at,
            "message": "Document uploaded and processed successfully"
        }

    except HTTPException:
        # Re-raise HTTP exceptions
        if file_path.exists():
            file_path.unlink()
        raise
    except Exception as e:
        # Clean up file on error
        if file_path.exists():
            file_path.unlink()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing document: {str(e)}"
        )


@router.get("/")
async def get_user_slides(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all slides for the current user"""
    slides = db.query(Slide).filter(Slide.user_id == current_user.id).order_by(Slide.created_at.desc()).all()

    return [{
        "id": slide.id,
        "title": slide.title,
        "file_name": slide.filename,
        "file_type": slide.file_type,
        "num_pages": slide.total_pages,
        "created_at": slide.created_at,
    } for slide in slides]


@router.get("/{slide_id}")
async def get_slide(
    slide_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific slide with its chunks"""
    slide = db.query(Slide).filter(
        Slide.id == slide_id,
        Slide.user_id == current_user.id
    ).first()

    if not slide:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Slide not found"
        )

    # Get chunks
    chunks = db.query(Chunk).filter(Chunk.slide_id == slide_id).order_by(Chunk.chunk_index).all()

    return {
        "id": slide.id,
        "title": slide.title,
        "file_name": slide.filename,
        "file_type": slide.file_type,
        "num_pages": slide.total_pages,
        "created_at": slide.created_at,
        "chunks": [{
            "id": chunk.id,
            "text": chunk.chunk_text[:200] + "..." if len(chunk.chunk_text) > 200 else chunk.chunk_text,
            "chunk_index": chunk.chunk_index,
            "page_number": chunk.page_number,
            "section_title": chunk.section_title,
        } for chunk in chunks]
    }


@router.delete("/{slide_id}")
async def delete_slide(
    slide_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a slide and its associated chunks"""
    slide = db.query(Slide).filter(
        Slide.id == slide_id,
        Slide.user_id == current_user.id
    ).first()

    if not slide:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Slide not found"
        )

    # Delete file from disk
    if slide.file_path and Path(slide.file_path).exists():
        try:
            Path(slide.file_path).unlink()
        except Exception as e:
            print(f"Error deleting file: {e}")

    # Delete from database (chunks will be cascade deleted)
    db.delete(slide)
    db.commit()

    return {"message": "Slide deleted successfully"}

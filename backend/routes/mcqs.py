from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from database.db import get_db
from models.user import User
from models.slide import Slide
from models.mcq import MCQ
from models.chunk import Chunk
from utils.auth import get_current_user
from services.mcq_service import MCQService

router = APIRouter(prefix="/api/mcqs", tags=["MCQs"])

# Initialize MCQ service
mcq_service = MCQService()


class MCQGenerateRequest(BaseModel):
    slide_id: int
    num_questions: int = 10
    difficulty: str = "medium"


class MCQResponse(BaseModel):
    id: int
    slide_id: int
    question: str
    options: dict  # {"A": "...", "B": "...", "C": "...", "D": "..."}
    correct_answer: str
    explanation: str
    difficulty: str

    class Config:
        from_attributes = True


@router.post("/generate", status_code=status.HTTP_201_CREATED)
async def generate_mcqs(
    request: MCQGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate MCQs from a slide's content using Claude API
    """
    # Verify slide belongs to user
    slide = db.query(Slide).filter(
        Slide.id == request.slide_id,
        Slide.user_id == current_user.id
    ).first()

    if not slide:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Slide not found"
        )

    # Get chunks for this slide
    chunks = db.query(Chunk).filter(Chunk.slide_id == request.slide_id).all()

    if not chunks:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No content found for this slide"
        )

    # Extract chunk texts
    chunk_texts = [chunk.chunk_text for chunk in chunks]

    try:
        # Generate MCQs using Claude
        generated_mcqs = mcq_service.generate_mcqs_from_chunks(
            chunks=chunk_texts,
            num_questions=request.num_questions,
            difficulty=request.difficulty
        )

        # Save MCQs to database
        created_mcqs = []
        for mcq_data in generated_mcqs:
            # Validate MCQ structure
            if not mcq_service.validate_mcq(mcq_data):
                print(f"Invalid MCQ structure: {mcq_data}")
                continue

            mcq = MCQ(
                slide_id=request.slide_id,
                question=mcq_data['question'],
                options=mcq_data['options'],  # Store as JSON
                correct_answer=mcq_data['correct_answer'],
                explanation=mcq_data['explanation'],
                difficulty=request.difficulty
            )
            db.add(mcq)
            created_mcqs.append(mcq)

        db.commit()

        # Refresh all MCQs to get their IDs
        for mcq in created_mcqs:
            db.refresh(mcq)

        return {
            "message": f"Generated {len(created_mcqs)} MCQs successfully",
            "num_generated": len(created_mcqs),
            "mcqs": [MCQResponse.from_orm(mcq) for mcq in created_mcqs]
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating MCQs: {str(e)}"
        )


@router.get("/slide/{slide_id}")
async def get_slide_mcqs(
    slide_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all MCQs for a specific slide"""
    # Verify slide belongs to user
    slide = db.query(Slide).filter(
        Slide.id == slide_id,
        Slide.user_id == current_user.id
    ).first()

    if not slide:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Slide not found"
        )

    mcqs = db.query(MCQ).filter(MCQ.slide_id == slide_id).all()

    return [MCQResponse.from_orm(mcq) for mcq in mcqs]


@router.get("/{mcq_id}")
async def get_mcq(
    mcq_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific MCQ"""
    # Join with Slide to check ownership
    mcq = db.query(MCQ).join(Slide).filter(
        MCQ.id == mcq_id,
        Slide.user_id == current_user.id
    ).first()

    if not mcq:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="MCQ not found"
        )

    return MCQResponse.from_orm(mcq)


@router.delete("/{mcq_id}")
async def delete_mcq(
    mcq_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an MCQ"""
    # Join with Slide to check ownership
    mcq = db.query(MCQ).join(Slide).filter(
        MCQ.id == mcq_id,
        Slide.user_id == current_user.id
    ).first()

    if not mcq:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="MCQ not found"
        )

    db.delete(mcq)
    db.commit()

    return {"message": "MCQ deleted successfully"}


@router.get("/")
async def get_user_mcqs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all MCQs for the current user"""
    # Join with Slide to filter by user ownership
    mcqs = db.query(MCQ).join(Slide).filter(Slide.user_id == current_user.id).all()

    return [MCQResponse.from_orm(mcq) for mcq in mcqs]

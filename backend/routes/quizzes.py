from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import random

from database.db import get_db
from models.user import User
from models.slide import Slide
from models.mcq import MCQ
from models.quiz import Quiz, QuizQuestion
from utils.auth import get_current_user

router = APIRouter(prefix="/api/quizzes", tags=["Quizzes"])


# Pydantic models
class QuizCreateRequest(BaseModel):
    title: str
    slide_id: Optional[int] = None
    num_questions: int = 10
    time_limit: Optional[int] = None  # in minutes


class QuizQuestionResponse(BaseModel):
    id: int
    mcq_id: int
    question_order: int
    question: str
    options: dict
    user_answer: Optional[str] = None
    is_correct: Optional[bool] = None

    class Config:
        from_attributes = True


class QuizResponse(BaseModel):
    id: int
    title: str
    slide_id: Optional[int]
    total_questions: int
    time_limit: Optional[int]
    is_completed: bool
    score: Optional[float]
    time_taken: Optional[int]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class QuizDetailResponse(QuizResponse):
    questions: List[QuizQuestionResponse]


class SubmitAnswerRequest(BaseModel):
    question_id: int
    answer: str  # A, B, C, or D


class CompleteQuizRequest(BaseModel):
    time_taken: int  # in seconds


@router.post("/create", status_code=status.HTTP_201_CREATED)
async def create_quiz(
    request: QuizCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new quiz from available MCQs"""

    # Get MCQs for the quiz
    if request.slide_id:
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

        # Get MCQs from this slide
        mcqs = db.query(MCQ).filter(MCQ.slide_id == request.slide_id).all()
    else:
        # Get all user's MCQs (join through Slide)
        mcqs = db.query(MCQ).join(Slide).filter(Slide.user_id == current_user.id).all()

    if not mcqs:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No MCQs available for this quiz"
        )

    # Randomly select MCQs if there are more than requested
    if len(mcqs) > request.num_questions:
        selected_mcqs = random.sample(mcqs, request.num_questions)
    else:
        selected_mcqs = mcqs

    # Create quiz
    quiz = Quiz(
        user_id=current_user.id,
        title=request.title,
        slide_id=request.slide_id,
        total_questions=len(selected_mcqs),
        time_limit=request.time_limit * 60 if request.time_limit else None  # Convert to seconds
    )

    db.add(quiz)
    db.flush()  # Get quiz ID

    # Add questions to quiz
    for idx, mcq in enumerate(selected_mcqs):
        quiz_question = QuizQuestion(
            quiz_id=quiz.id,
            mcq_id=mcq.id,
            question_order=idx + 1
        )
        db.add(quiz_question)

    db.commit()
    db.refresh(quiz)

    return QuizResponse.from_orm(quiz)


@router.post("/{quiz_id}/start")
async def start_quiz(
    quiz_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Start a quiz (mark start time)"""
    quiz = db.query(Quiz).filter(
        Quiz.id == quiz_id,
        Quiz.user_id == current_user.id
    ).first()

    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found"
        )

    if quiz.started_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quiz already started"
        )

    quiz.started_at = datetime.utcnow()
    db.commit()
    db.refresh(quiz)

    return QuizResponse.from_orm(quiz)


@router.get("/{quiz_id}")
async def get_quiz(
    quiz_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get quiz details with questions"""
    quiz = db.query(Quiz).filter(
        Quiz.id == quiz_id,
        Quiz.user_id == current_user.id
    ).first()

    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found"
        )

    # Get questions with MCQ data
    questions = []
    for qq in sorted(quiz.questions, key=lambda x: x.question_order):
        questions.append(QuizQuestionResponse(
            id=qq.id,
            mcq_id=qq.mcq_id,
            question_order=qq.question_order,
            question=qq.mcq.question,
            options=qq.mcq.options,
            user_answer=qq.user_answer if quiz.is_completed else None,
            is_correct=qq.is_correct if quiz.is_completed else None
        ))

    response_data = QuizResponse.from_orm(quiz).dict()
    response_data['questions'] = questions

    return QuizDetailResponse(**response_data)


@router.post("/{quiz_id}/submit-answer")
async def submit_answer(
    quiz_id: int,
    request: SubmitAnswerRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit an answer for a quiz question"""
    quiz = db.query(Quiz).filter(
        Quiz.id == quiz_id,
        Quiz.user_id == current_user.id
    ).first()

    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found"
        )

    if quiz.is_completed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quiz already completed"
        )

    # Get quiz question
    quiz_question = db.query(QuizQuestion).filter(
        QuizQuestion.id == request.question_id,
        QuizQuestion.quiz_id == quiz_id
    ).first()

    if not quiz_question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )

    # Check if answer is correct
    is_correct = quiz_question.mcq.correct_answer == request.answer

    # Save answer
    quiz_question.user_answer = request.answer
    quiz_question.is_correct = is_correct

    db.commit()

    return {"is_correct": is_correct}


@router.post("/{quiz_id}/complete")
async def complete_quiz(
    quiz_id: int,
    request: CompleteQuizRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Complete quiz and calculate score"""
    quiz = db.query(Quiz).filter(
        Quiz.id == quiz_id,
        Quiz.user_id == current_user.id
    ).first()

    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found"
        )

    if quiz.is_completed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quiz already completed"
        )

    # Calculate score
    correct_answers = sum(1 for q in quiz.questions if q.is_correct)
    total_questions = len(quiz.questions)
    score = (correct_answers / total_questions * 100) if total_questions > 0 else 0

    # Update quiz
    quiz.is_completed = True
    quiz.score = score
    quiz.time_taken = request.time_taken
    quiz.completed_at = datetime.utcnow()

    db.commit()
    db.refresh(quiz)

    return {
        "score": score,
        "correct_answers": correct_answers,
        "total_questions": total_questions,
        "time_taken": request.time_taken
    }


@router.get("/")
async def get_user_quizzes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all quizzes for current user"""
    quizzes = db.query(Quiz).filter(Quiz.user_id == current_user.id).order_by(Quiz.created_at.desc()).all()

    return [QuizResponse.from_orm(quiz) for quiz in quizzes]


@router.delete("/{quiz_id}")
async def delete_quiz(
    quiz_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a quiz"""
    quiz = db.query(Quiz).filter(
        Quiz.id == quiz_id,
        Quiz.user_id == current_user.id
    ).first()

    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found"
        )

    db.delete(quiz)
    db.commit()

    return {"message": "Quiz deleted successfully"}

from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Boolean, Float, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from database.db import Base


class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    slide_id = Column(Integer, ForeignKey("slides.id", ondelete="SET NULL"), nullable=True)
    total_questions = Column(Integer, nullable=False)
    time_limit = Column(Integer, nullable=True)  # in seconds
    is_completed = Column(Boolean, default=False)
    score = Column(Float, nullable=True)  # percentage
    time_taken = Column(Integer, nullable=True)  # in seconds
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="quizzes")
    slide = relationship("Slide", back_populates="quizzes")
    questions = relationship("QuizQuestion", back_populates="quiz", cascade="all, delete-orphan")


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    mcq_id = Column(Integer, ForeignKey("mcqs.id", ondelete="CASCADE"), nullable=False)
    question_order = Column(Integer, nullable=False)
    user_answer = Column(String(10), nullable=True)  # A, B, C, or D
    is_correct = Column(Boolean, nullable=True)
    time_spent = Column(Integer, nullable=True)  # in seconds

    # Relationships
    quiz = relationship("Quiz", back_populates="questions")
    mcq = relationship("MCQ", back_populates="quiz_questions")

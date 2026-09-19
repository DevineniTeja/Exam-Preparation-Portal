from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, JSON, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
from database.db import Base
import enum


class DifficultyLevel(str, enum.Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class MCQ(Base):
    __tablename__ = "mcqs"

    id = Column(Integer, primary_key=True, index=True)
    slide_id = Column(Integer, ForeignKey("slides.id", ondelete="CASCADE"), nullable=True)
    question = Column(Text, nullable=False)
    options = Column(JSON, nullable=False)  # {"A": "...", "B": "...", "C": "...", "D": "..."}
    correct_answer = Column(String(10), nullable=False)  # A, B, C, or D
    explanation = Column(Text, nullable=True)
    difficulty = Column(Enum(DifficultyLevel), default=DifficultyLevel.MEDIUM)
    topic = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    slide = relationship("Slide", back_populates="mcqs")
    quiz_questions = relationship("QuizQuestion", back_populates="mcq", cascade="all, delete-orphan")

from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
from database.db import Base
import enum


class FileType(str, enum.Enum):
    PDF = "pdf"
    PPTX = "pptx"
    DOCX = "docx"
    IMAGE = "image"


class Slide(Base):
    __tablename__ = "slides"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_type = Column(Enum(FileType), nullable=False)
    file_size = Column(Integer, nullable=False)  # in bytes
    summary = Column(Text, nullable=True)
    key_points = Column(Text, nullable=True)  # JSON string
    total_pages = Column(Integer, default=0)
    processing_status = Column(String(50), default="pending")  # pending, processing, completed, failed
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="slides")
    chunks = relationship("Chunk", back_populates="slide", cascade="all, delete-orphan")
    mcqs = relationship("MCQ", back_populates="slide", cascade="all, delete-orphan")
    quizzes = relationship("Quiz", back_populates="slide", cascade="all, delete-orphan")

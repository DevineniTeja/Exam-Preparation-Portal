from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, JSON, PickleType
from sqlalchemy.orm import relationship
from datetime import datetime
from database.db import Base


class Chunk(Base):
    __tablename__ = "chunks"

    id = Column(Integer, primary_key=True, index=True)
    slide_id = Column(Integer, ForeignKey("slides.id", ondelete="CASCADE"), nullable=False)
    chunk_text = Column(Text, nullable=False)
    chunk_index = Column(Integer, nullable=False)
    page_number = Column(Integer, nullable=True)
    section_title = Column(String(255), nullable=True)
    chunk_type = Column(String(50), default="text")  # slide, paragraph, section
    embedding = Column(PickleType, nullable=True)  # Store embedding as pickle (for SQLite)
    meta_data = Column(JSON, nullable=True)  # Additional metadata as JSON
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    slide = relationship("Slide", back_populates="chunks")

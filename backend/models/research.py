from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from database.db import Base


class Research(Base):
    __tablename__ = "research"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    url = Column(String(500), nullable=False)
    title = Column(String(255), nullable=True)
    content = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="research_sessions")
    chunks = relationship("ResearchChunk", back_populates="research", cascade="all, delete-orphan")


class ResearchChunk(Base):
    __tablename__ = "research_chunks"

    id = Column(Integer, primary_key=True, index=True)
    research_id = Column(Integer, ForeignKey("research.id", ondelete="CASCADE"), nullable=False)
    chunk_text = Column(Text, nullable=False)
    chunk_index = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    research = relationship("Research", back_populates="chunks")

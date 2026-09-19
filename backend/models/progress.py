from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Float, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from database.db import Base


class Progress(Base):
    __tablename__ = "progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    slide_id = Column(Integer, ForeignKey("slides.id", ondelete="SET NULL"), nullable=True)
    topic = Column(String(255), nullable=True)
    activity_type = Column(String(50), nullable=False)  # quiz, study, mcq_practice, conversation
    score = Column(Float, nullable=True)  # percentage for quizzes
    time_spent = Column(Integer, nullable=True)  # in seconds
    date = Column(DateTime, default=datetime.utcnow)
    meta_data = Column(JSON, nullable=True)  # Additional activity-specific data

    # Relationships
    user = relationship("User", back_populates="progress")

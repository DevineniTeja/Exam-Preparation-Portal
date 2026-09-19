from sqlalchemy import text
from database.db import engine, Base
from models import (
    User, Slide, Chunk, MCQ, Conversation, Message,
    Quiz, QuizQuestion, Progress, Research, ResearchChunk
)


def init_database():
    """Initialize database with all tables"""
    # Create all tables
    Base.metadata.create_all(bind=engine)
    print("[OK] All tables created")

    # Create indexes for performance (SQLite compatible)
    with engine.connect() as conn:
        # Foreign key indexes
        try:
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_slides_user_id ON slides(user_id)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_chunks_slide_id ON chunks(slide_id)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_mcqs_slide_id ON mcqs(slide_id)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_quizzes_user_id ON quizzes(user_id)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_id ON quiz_questions(quiz_id)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_progress_user_id ON progress(user_id)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_progress_date ON progress(date)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS idx_research_user_id ON research(user_id)"))
            conn.commit()
            print("[OK] All indexes created")
        except Exception as e:
            print(f"[WARNING] Some indexes may already exist: {e}")

    print("\n[SUCCESS] Database initialization completed successfully!")


if __name__ == "__main__":
    init_database()

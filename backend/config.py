from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # App Info
    APP_NAME: str = "University Exam Assistant"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = ""

    # JWT Auth
    JWT_SECRET_KEY: str = "your-secret-key"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # GROQ API (REPLACES OPENAI/GEMINI)
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama3-8b-8192"

    # Embeddings
    EMBEDDING_MODEL: str = "simple-hash"
    EMBEDDING_DIMENSION: int = 384

    # File Upload
    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE: int = 50 * 1024 * 1024
    ALLOWED_EXTENSIONS: set = {".pdf", ".pptx", ".docx", ".png", ".jpg", ".jpeg"}

    # Chunking
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 100

    # RAG
    TOP_K_CHUNKS: int = 5

    # Rate limiting
    RATE_LIMIT_PER_MINUTE: int = 10

    # CORS
    CORS_ORIGINS: list = ["*"]
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7


    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()

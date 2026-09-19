from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import get_settings
from routes import auth, slides, mcqs, quizzes
from database.db import Base, engine
import os

settings = get_settings()

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-powered University Exam Preparation & Study Assistant"
)

# Create database tables on startup
@app.on_event("startup")
def startup_event():
    Base.metadata.create_all(bind=engine)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create upload directory if it doesn't exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

# Include routers
app.include_router(auth.router)
app.include_router(slides.router)
app.include_router(mcqs.router)
app.include_router(quizzes.router)


# Root endpoint
@app.get("/")
def root():
    return {
        "message": "Welcome to University Exam Assistant API",
        "version": settings.APP_VERSION,
        "docs": "/docs"
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)

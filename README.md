# Exam Preparation Portal

Exam Preparation Portal is an AI-powered university exam preparation and study assistant designed to help students convert their study materials into structured practice resources.

The platform allows authenticated users to upload PDF, PowerPoint, and Word documents, process their content, generate AI-assisted multiple-choice questions, create interactive quizzes, and track quiz performance.

The application is implemented as a full-stack system with a React and TypeScript frontend, a FastAPI backend, PostgreSQL for persistent storage, and pgvector-supported data infrastructure. AI-powered MCQ generation is implemented using the Groq API with the Llama 3.1 8B Instant model.

## Features

### User Authentication

- User registration and login
- Password hashing and verification
- JWT-based authentication
- Access and refresh tokens
- Token refresh support
- Authenticated user profile
- Active/inactive account handling
- Admin user support

The authentication API provides registration, login, token refresh, and current-user endpoints.

### Study Material Upload

Users can upload study materials in the following formats:

- PDF
- PPTX
- DOCX

Uploaded documents are stored per user and processed automatically. The system extracts document content, metadata, page or slide information, and creates structured content chunks for further processing. The maximum supported upload size is 50 MB.

### Document Processing

The backend includes dedicated processors for:

- PDF documents
- PowerPoint presentations
- Word documents

PDF processing extracts text page by page and also extracts available document metadata such as title, author, subject, creator, and producer.

### Content Chunking

Processed documents are divided into smaller chunks to make the content suitable for downstream processing and AI-based question generation.

The configured chunking service uses a chunk size of 500 with an overlap of 50 characters.

### AI-Based MCQ Generation

The system can generate multiple-choice questions from uploaded study content.

Generated questions contain:

- Question
- Four answer options
- Correct answer
- Explanation
- Difficulty level

The current implementation uses the Groq API with the `llama-3.1-8b-instant` model for MCQ generation.

### Quiz Creation

Users can create quizzes from their available MCQs.

Quiz configuration includes:

- Quiz title
- Number of questions
- Optional source document
- Optional time limit

Questions can be randomly selected from the available MCQ collection.

### Interactive Quiz System

The quiz API supports:

- Starting a quiz
- Retrieving quiz questions
- Submitting individual answers
- Automatic answer validation
- Completing quizzes
- Score calculation
- Time tracking
- Quiz history
- Quiz deletion

The backend calculates the final percentage score based on the number of correct answers.

### Embedding and Similarity Infrastructure

The project includes an embedding service that generates deterministic 384-dimensional hash-based embeddings.

The service supports:

- Embedding generation
- Batch embedding generation
- Cosine similarity
- Similarity-based ranking
- Embedding serialization and deserialization

The lightweight implementation avoids loading large transformer models and is designed to keep deployment requirements relatively small.

### Frontend Dashboard

The React dashboard provides access to:

- Uploaded study materials
- Document management
- MCQ practice
- Quiz creation
- User information
- Study statistics
- Planned AI study features

The frontend uses React Query for server-state management and Zustand for authentication state.

## Technology Stack

### Frontend

- React 18
- TypeScript
- Vite
- React Router
- Axios
- TanStack React Query
- Zustand
- Tailwind CSS
- React Dropzone
- Recharts
- React Hot Toast

The frontend dependencies and development configuration are defined in `frontend/package.json`.

### Backend

- Python
- FastAPI
- Uvicorn
- Pydantic
- SQLAlchemy
- Alembic
- Python-JOSE
- Passlib
- Python-dotenv

The backend exposes REST APIs for authentication, document management, MCQs, and quizzes.

### Database

- PostgreSQL
- pgvector
- SQLAlchemy
- Psycopg2
- Alembic

The Docker configuration uses the `ankane/pgvector` PostgreSQL image and persists database data using a Docker volume.

### AI and Document Processing

- Groq API
- Llama 3.1 8B Instant
- Google Generative AI packages
- PyTorch
- NumPy
- PyPDF2
- python-pptx
- python-docx
- Pillow
- pytesseract
- BeautifulSoup
- Trafilatura

The backend dependency configuration includes the AI, document-processing, OCR, and web-processing libraries used by the application.

### DevOps and Deployment

- Docker
- Docker Compose
- Nginx
- Terraform
- AWS EC2 deployment configuration

The repository includes Dockerfiles for the frontend and backend, multiple Docker Compose configurations, a build-and-push script, and Terraform infrastructure files.

## System Architecture

```text
                         Exam Preparation Portal
                                  |
                 +----------------+----------------+
                 |                                 |
                 v                                 v
          React Frontend                    FastAPI Backend
          TypeScript + Vite                       |
                 |                                 |
                 | HTTP REST API                   |
                 +------------------------------->|
                                                   |
                              +--------------------+--------------------+
                              |                    |                    |
                              v                    v                    v
                         PostgreSQL          Document Processing     AI Services
                         + pgvector          PDF / PPTX / DOCX      Groq / Llama
                              |                    |                    |
                              +--------------------+--------------------+
                                                   |
                                                   v
                                           Quiz & MCQ System
```

The FastAPI application exposes separate routers for authentication, documents/slides, MCQs, and quizzes.

## Project Structure

```text
Exam-Preparation-Portal/
│
├── backend/
│   ├── database/
│   │   ├── db.py
│   │   └── init_db.py
│   │
│   ├── models/
│   │   ├── chunk.py
│   │   ├── conversation.py
│   │   ├── mcq.py
│   │   ├── message.py
│   │   ├── progress.py
│   │   ├── quiz.py
│   │   ├── research.py
│   │   ├── slide.py
│   │   └── user.py
│   │
│   ├── routes/
│   │   ├── auth.py
│   │   ├── mcqs.py
│   │   ├── quizzes.py
│   │   └── slides.py
│   │
│   ├── services/
│   │   ├── document_processor/
│   │   ├── chunking_service.py
│   │   ├── embedding_service.py
│   │   └── mcq_service.py
│   │
│   ├── utils/
│   │   └── auth.py
│   │
│   ├── app.py
│   ├── config.py
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── store/
│   │   ├── types/
│   │   ├── App.tsx
│   │   └── main.tsx
│   │
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── nginx.conf
│   └── Dockerfile
│
├── terraform/
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   └── terraform.tfvars.example
│
├── docs/
│   └── images/
│
├── docker-compose.yml
├── docker-compose.ec2.yml
├── docker-compose.ec2-prebuilt.yml
├── build-and-push.bat
├── .env.example
├── .gitignore
└── README.md
```

## API Structure

The backend currently exposes the following major API groups:

```text
/api/auth
/api/slides
/api/mcqs
/api/quizzes
```

FastAPI also exposes automatic API documentation through:

```text
http://localhost:8000/docs
```

The application includes a health endpoint:

```text
GET /health
```

which returns the current API health status.

## Requirements

Before running the application locally, install:

- Python 3.10+
- Node.js 18+
- npm
- PostgreSQL
- Git

For containerized deployment:

- Docker
- Docker Compose

## Environment Configuration

Create a `.env` file based on the provided `.env.example`.

Typical backend configuration includes:

```env
DATABASE_URL=postgresql+psycopg2://username:password@localhost:5432/exam_assistant

JWT_SECRET_KEY=your_secret_key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.1-8b-instant

APP_NAME=University Exam Assistant
APP_VERSION=1.0.0

UPLOAD_DIR=./uploads
```

Do not commit the actual `.env` file or API credentials to GitHub.

## Running the Backend

Navigate to the backend directory:

```bash
cd backend
```

Create and activate a virtual environment:

```bash
python -m venv venv
```

Windows:

```bash
venv\Scripts\activate
```

Linux/macOS:

```bash
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start the FastAPI server:

```bash
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:

```text
http://localhost:8000
```

Interactive API documentation:

```text
http://localhost:8000/docs
```

## Running the Frontend

Navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The Vite development server will display the local URL in the terminal.

## Running with Docker

The repository includes Docker Compose configuration for the database, backend, and frontend services.

From the project root:

```bash
docker compose up --build
```

The default service configuration includes:

```text
Frontend:  http://localhost
Backend:   http://localhost:8000
Database:  localhost:5432
```

The Docker configuration creates separate services for PostgreSQL/pgvector, the FastAPI backend, and the frontend.

To stop the services:

```bash
docker compose down
```

To stop the services and remove persisted volumes:

```bash
docker compose down -v
```

Use the volume-removal command carefully because it deletes persisted database data.

## Database

The application uses PostgreSQL with pgvector support.

The Docker setup uses:

```text
Database: exam_assistant
User: admin
Port: 5432
```

For production deployments, use secure credentials and environment variables rather than committing database credentials to source control.

## Development Workflow

The main application workflow is:

```text
User Registration/Login
        |
        v
Upload Study Material
        |
        v
Document Processing
        |
        v
Text Extraction
        |
        v
Content Chunking
        |
        v
Embedding Generation
        |
        v
AI-Assisted MCQ Generation
        |
        v
Quiz Creation
        |
        v
Interactive Quiz
        |
        v
Answer Evaluation
        |
        v
Score and Performance Tracking
```

## Current Scope

The implemented core functionality focuses on:

- Authentication
- Study-material upload
- Document processing
- Content extraction
- Content chunking
- MCQ generation
- Quiz creation
- Quiz execution
- Answer evaluation
- Score calculation
- Study-material management

The frontend dashboard also contains planned areas for additional capabilities such as document conversations, analytics, and research assistance. These areas are currently presented as future/coming-soon functionality in the interface.

## Security

The application uses JWT-based authentication and password hashing for user authentication.

For production deployment:

- Use a strong JWT secret
- Store credentials in environment variables
- Do not commit `.env` files
- Use secure PostgreSQL credentials
- Restrict CORS origins
- Use HTTPS
- Rotate API credentials when necessary
- Configure appropriate database access controls

## Deployment

The repository includes infrastructure and deployment configuration for containerized environments.

Available deployment-related files include:

```text
Dockerfile
docker-compose.yml
docker-compose.ec2.yml
docker-compose.ec2-prebuilt.yml
build-and-push.bat
terraform/main.tf
terraform/variables.tf
terraform/outputs.tf
```

The Terraform directory provides infrastructure configuration intended for deployment environments, while Docker Compose provides service orchestration for the application components.

## Future Enhancements

Potential extensions to the platform include:

- AI-powered document conversations
- Study progress analytics
- Personalized study recommendations
- Improved semantic document search
- Automated study-plan generation
- Advanced quiz analytics
- Research assistance
- Additional AI models
- Real-time collaboration
- Production-grade cloud deployment
- Improved vector search infrastructure

## Repository

GitHub:

https://github.com/DevineniTeja/Exam-Preparation-Portal

## Author

### Devineni Teja

GitHub:

https://github.com/DevineniTeja

## License

This project is currently intended for educational and development purposes.

If the project is intended for public distribution or open-source use, add an appropriate license to the repository.

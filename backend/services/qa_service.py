from groq import Groq
from config import get_settings
from services.embedding_service import EmbeddingService
from database.vector_store import VectorStore

settings = get_settings()

class QAService:
    """Full RAG Question Answering: Retrieves chunks + answers using Groq."""

    def __init__(self):
        self.client = Groq(api_key=settings.GROQ_API_KEY)
        self.model = "llama-3.3-70b-versatile"
        self.embedder = EmbeddingService()
        self.vector_store = VectorStore()   # already exists in your project

    def answer_question(self, question: str, document_id: int):
        # 1. Embed the question
        q_emb = self.embedder.generate_embedding(question)

        # 2. Retrieve top chunks
        matches = self.vector_store.search(document_id, q_emb, top_k=5)

        context = "\n\n".join([m["text"] for m in matches])

        prompt = f"""
Answer the following question ONLY using this document context.

CONTEXT:
{context}

QUESTION:
{question}

Your answer:
"""

        # 3. Generate answer
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=500,
            temperature=0.4
        )

        return response.choices[0].message.content.strip()

from typing import List
import hashlib
import pickle


class EmbeddingService:
    """
    Lightweight embedding service using simple hash embeddings.
    This avoids heavy ML libraries like sentence-transformers, torchvision, scipy, sklearn.
    Perfect for Docker / hackathon deployment.
    """

    def __init__(self, model_name: str = "simple-hash"):
        self.model_name = model_name
        self.embedding_dim = 384  # Keep same dimension as original system

    def generate_embedding(self, text: str) -> List[float]:
        """Generate a hash-based embedding for a single text."""
        if not text or not text.strip():
            return [0.0] * self.embedding_dim

        return self._simple_hash_embedding(text)

    def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for multiple text chunks."""
        return [self.generate_embedding(t) for t in texts]

    def _simple_hash_embedding(self, text: str) -> List[float]:
        """
        Fast lightweight embedding generator using repeated SHA-256 hashing.
        Produces stable deterministic embeddings.
        """
        text = text.lower().strip()
        embeddings = []

        for i in range(self.embedding_dim // 8):
            hash_input = f"{text}_{i}".encode("utf-8")
            hash_bytes = hashlib.sha256(hash_input).digest()

            # Convert first 8 bytes of hash into numbers between -1 and 1
            for b in hash_bytes[:8]:
                embeddings.append((b / 255.0) * 2 - 1)

        return embeddings[:self.embedding_dim]

    def cosine_similarity(self, v1: List[float], v2: List[float]) -> float:
        """Compute cosine similarity between two vectors."""
        if len(v1) != len(v2):
            return 0.0

        dot = sum(a * b for a, b in zip(v1, v2))
        mag1 = sum(a * a for a in v1) ** 0.5
        mag2 = sum(b * b for b in v2) ** 0.5

        if mag1 == 0 or mag2 == 0:
            return 0.0

        return dot / (mag1 * mag2)

    def find_most_similar(self, query_emb: List[float], candidates: List[List[float]], top_k: int = 5):
        """Return the most similar embeddings."""
        scored = []

        for idx, emb in enumerate(candidates):
            score = self.cosine_similarity(query_emb, emb)
            scored.append((idx, score))

        scored.sort(key=lambda x: x[1], reverse=True)
        return scored[:top_k]

    def serialize_embedding(self, emb: List[float]) -> bytes:
        return pickle.dumps(emb)

    def deserialize_embedding(self, data: bytes) -> List[float]:
        return pickle.loads(data)


# ------------------------------------------------------------
# Disabled transformer class (keeps project structure clean)
# ------------------------------------------------------------
class SentenceTransformerEmbeddingService(EmbeddingService):
    """
    Placeholder class. Does NOT load heavy models.
    Safe for Docker + fast builds.
    """
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        super().__init__(model_name)
        self.model = None

    def generate_embedding(self, text: str) -> List[float]:
        return super().generate_embedding(text)

    def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        return super().generate_embeddings(texts)

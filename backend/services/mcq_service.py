from typing import List, Dict
from groq import Groq
from config import get_settings
import json
import re

settings = get_settings()

class MCQService:
    """MCQ generator using FREE Groq Llama 3 API."""

    def __init__(self):
        self.client = Groq(api_key=settings.GROQ_API_KEY)
        self.model = "llama-3.1-8b-instant"   # stable free model

    def generate_mcqs(self, content: str, num_questions: int = 5, difficulty: str = "medium") -> List[Dict]:
        prompt = f"""
Generate {num_questions} MCQs (difficulty: {difficulty}) from the following content.

Return ONLY a JSON array like:

[
  {{
    "question": "...",
    "options": {{
      "A": "...",
      "B": "...",
      "C": "...",
      "D": "..."
    }},
    "correct_answer": "A",
    "explanation": "..."
  }}
]

CONTENT:
{content}
"""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.4,
                max_tokens=2048
            )

            reply = response.choices[0].message.content.strip()

            # Remove ``` fences
            if reply.startswith("```"):
                reply = "\n".join(reply.split("\n")[1:-1]).strip()

            # ---- JSON EXTRACTION FIX ----
            match = re.search(r"\[\s*{.*}\s*\]", reply, flags=re.DOTALL)
            if not match:
                print("\nRaw model reply:\n", reply)
                raise ValueError("Could not extract JSON array from model output.")

            json_text = match.group(0)
            return json.loads(json_text)

        except Exception as e:
            print("Error generating MCQs:", e)
            raise

    def generate_mcqs_from_chunks(self, chunks: List[str], num_questions: int = 10, difficulty: str = "medium") -> List[Dict]:
        combined = "\n\n---\n\n".join(chunks)
        combined = combined[:15000]
        return self.generate_mcqs(combined, num_questions, difficulty)

    def validate_mcq(self, mcq: Dict) -> bool:
        required = ["question", "options", "correct_answer", "explanation"]
        if not all(r in mcq for r in required):
            return False
        return all(o in mcq["options"] for o in ["A", "B", "C", "D"])

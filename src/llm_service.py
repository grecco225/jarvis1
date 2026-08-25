import time
import re
from groq import Groq
from config import GROQ_API_KEY, GROQ_MODEL


class LLMService:
    def __init__(self):
        self.client = Groq(api_key=GROQ_API_KEY)

    def generate(self, messages):
        for attempt in range(3):
            try:
                response = self.client.chat.completions.create(
                    model=GROQ_MODEL,
                    messages=messages,
                    temperature=0.4,
                    max_tokens=160,
                )
                text = (response.choices[0].message.content or "").strip()

                # Limpiar bloques <think>...</think> si el modelo los genera
                text = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL).strip()

                if not text:
                    raise RuntimeError("El LLM devolvió una respuesta vacía")

                return text
            except Exception as e:
                err_str = str(e)
                if ("429" in err_str or "rate_limit" in err_str.lower()) and attempt < 2:
                    print("[AVISO] Límite de solicitudes alcanzado. Reintentando en 5 segundos...")
                    time.sleep(5)
                else:
                    raise e
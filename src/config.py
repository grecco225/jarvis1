import os
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
WHISPER_MODEL = os.getenv("WHISPER_MODEL", "tiny")
RECORD_SECONDS = int(os.getenv("RECORD_SECONDS", "5"))
SAMPLE_RATE = int(os.getenv("SAMPLE_RATE", "16000"))
MAX_TURNS = int(os.getenv("MAX_TURNS", "3"))

if not GROQ_API_KEY:
    raise RuntimeError("Falta GROQ_API_KEY en el archivo .env")
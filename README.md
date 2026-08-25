# Mini-JARVIS 🤖

Asistente virtual de voz en tiempo real desarrollado con Python, Flask, Groq (LPU), Faster-Whisper (STT) y pyttsx3 (TTS).

## Estratificación del Proyecto

```text
mini-jarvis/
├── src/
│   ├── __init__.py
│   ├── app.py
│   ├── config.py
│   ├── stt_service.py
│   ├── llm_service.py
│   ├── tts_service.py
│   └── conversation.py
├── templates/
│   └── index.html
├── static/
│   ├── style.css
│   └── app.js
├── uploads/
├── requirements.txt
├── .env.example
├── .gitignore
└── README.md
```

## Requisitos de Instalación

1. Crear e iniciar el entorno virtual de Python:
   ```powershell
   python -m venv .venv
   .\.venv\Scripts\activate
   ```

2. Instalar dependencias:
   ```powershell
   pip install -r requirements.txt
   ```

3. Configurar variables de entorno:
   Copiar `.env.example` a `.env` y colocar tu `GROQ_API_KEY`.

## Ejecución del Servidor Web

Para iniciar el servidor Flask con la interfaz futurista:

```powershell
$env:PYTHONPATH="src"; .\.venv\Scripts\python src/app.py
```

Luego abre tu navegador e ingresa a: **`http://127.0.0.1:5000`**

import os
from gtts import gTTS


class TTSService:
    def __init__(self, lang="es"):
        self.lang = lang

    def speak(self, text):
        try:
            tts = gTTS(text=text, lang=self.lang, slow=False)
            tts.save("output_temp.mp3")
            # Para la consola local si fuera necesario
        except Exception as e:
            print(f"[ERROR TTS] {e}")

    def save_to_file(self, text, output_filepath):
        try:
            tts = gTTS(text=text, lang=self.lang, slow=False)
            tts.save(output_filepath)
        except Exception as e:
            print(f"[ERROR TTS SAVE] {e}")
from pathlib import Path

from conversation import Conversation
from llm_service import LLMService
from stt_service import STTService
from tts_service import TTSService


def main():
    print("Inicializando Mini-JARVIS...")
    print("El primer inicio puede tardar mientras se descarga Whisper.")

    conversation = Conversation()
    stt = STTService()
    llm = LLMService()
    tts = TTSService()

    print("Mini-JARVIS listo. Di 'salir' para terminar.")

    while True:
        try:
            audio_path = stt.record()
            user_text = stt.transcribe(audio_path)
            
            # Filtro para ignorar capturas sin voz
            if not user_text or len(user_text.strip()) < 2:
                continue

            print(f"[USUARIO] {user_text}")

            if user_text.lower().strip() in {"salir", "terminar", "cerrar", "salir."}:
                print("Jarvis: Hasta luego.")
                tts.speak("Hasta luego")
                break

            conversation.add_user(user_text)
            print("[PENSANDO]")
            response = llm.generate(conversation.messages)
            conversation.add_assistant(response)

            print(f"[HABLANDO] {response}")
            tts.speak(response)

        except KeyboardInterrupt:
            print("\nJarvis finalizado por el usuario.")
            break
        except Exception as error:
            print(f"[ERROR] {error}")
            print("El sistema continuará esperando otra interacción.")

    Path("input.wav").unlink(missing_ok=True)


if __name__ == "__main__":
    main()
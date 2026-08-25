import sounddevice as sd
from scipy.io.wavfile import write
from faster_whisper import WhisperModel
from config import WHISPER_MODEL, RECORD_SECONDS, SAMPLE_RATE


class STTService:
    def __init__(self, sample_rate=SAMPLE_RATE, duration=RECORD_SECONDS):
        self.sample_rate = sample_rate
        self.duration = duration
        self.model = WhisperModel(WHISPER_MODEL, device="cpu", compute_type="int8")

    def record(self, filename="input.wav"):
        print("Escuchando (habla ahora)...")
        audio_data = sd.rec(
            int(self.duration * self.sample_rate),
            samplerate=self.sample_rate,
            channels=1,
            dtype="int16",
        )
        sd.wait()
        write(filename, self.sample_rate, audio_data)
        return filename

    def transcribe(self, audio_path):
        segments, _ = self.model.transcribe(
            audio_path,
            language="es",
            beam_size=5,
            vad_filter=True
        )
        text = " ".join([segment.text for segment in segments]).strip()
        return text

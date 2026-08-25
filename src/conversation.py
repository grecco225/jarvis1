from dataclasses import dataclass, field


SYSTEM_PROMPT = """
Eres Mini-JARVIS, un asistente virtual de voz para un proyecto de Redes Neuronales.
Responde directamente en español, de forma muy breve, fluida y sin incluir pensamientos o razonamiento interno.
Tus respuestas serán leídas por un sintetizador de voz.
""".strip()


@dataclass
class Conversation:
    max_turns: int = 3
    messages: list[dict] = field(default_factory=list)

    def __post_init__(self):
        self.messages = [
            {"role": "system", "content": SYSTEM_PROMPT}
        ]

    def add_user(self, text):
        self.messages.append({"role": "user", "content": text})
        self._limit_history()

    def add_assistant(self, text):
        self.messages.append({"role": "assistant", "content": text})
        self._limit_history()

    def _limit_history(self):
        system_message = self.messages[0]
        history = self.messages[1:]
        history = history[-self.max_turns * 2:]
        self.messages = [system_message, *history]
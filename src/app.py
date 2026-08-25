import os
from pathlib import Path
from flask import Flask, render_template, request, jsonify, send_file
from werkzeug.utils import secure_filename

from conversation import Conversation
from llm_service import LLMService
from stt_service import STTService
from tts_service import TTSService

app = Flask(__name__, template_folder='../templates', static_folder='../static')

UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Instancias globales
conversation = Conversation()
stt = STTService()
llm = LLMService()
tts = TTSService(lang='es')


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        user_text = ""
        audio_file = request.files.get('audio')

        if audio_file:
            filename = secure_filename('input_audio.wav')
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            audio_file.save(filepath)
            user_text = stt.transcribe(filepath)
        else:
            data = request.get_json() or {}
            user_text = data.get('text', '').strip()

        if not user_text:
            return jsonify({'error': 'No se detectó ningún texto de voz'}), 400

        conversation.add_user(user_text)
        response_text = llm.generate(conversation.messages)
        conversation.add_assistant(response_text)

        # Generar audio TTS natural con gTTS
        response_audio_path = os.path.join(app.config['UPLOAD_FOLDER'], 'response.mp3')
        tts.save_to_file(response_text, response_audio_path)

        return jsonify({
            'user_text': user_text,
            'response_text': response_text,
            'audio_url': '/api/audio'
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/audio')
def get_audio():
    audio_path = os.path.join(app.config['UPLOAD_FOLDER'], 'response.mp3')
    if os.path.exists(audio_path):
        return send_file(audio_path, mimetype='audio/mpeg')
    return jsonify({'error': 'Audio no encontrado'}), 404


@app.route('/api/reset', methods=['POST'])
def reset_conversation():
    global conversation
    conversation = Conversation()
    return jsonify({'status': 'Conversación reiniciada'})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

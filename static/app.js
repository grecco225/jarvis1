// Variables de Estado y Dom
let mediaRecorder;
let audioChunks = [];
let isRecording = false;
let currentMode = 'chat'; // 'chat' | 'live'
let currentState = 'idle'; // 'idle' | 'listening' | 'thinking' | 'speaking'
let speechRecognition;
let silenceTimer = null;
let maxRecordingTimer = null;

const jarvisContainer = document.getElementById('jarvisContainer');
const recordBtn = document.getElementById('recordBtn');
const sendBtn = document.getElementById('sendBtn');
const resetBtn = document.getElementById('resetBtn');
const modeToggleBtn = document.getElementById('modeToggleBtn');
const exitLiveBtn = document.getElementById('exitLiveBtn');
const textInput = document.getElementById('textInput');
const chatContainer = document.getElementById('chatContainer');
const arcReactor = document.getElementById('arcReactor');
const statusText = document.getElementById('statusText');
const interactivePrompt = document.getElementById('interactivePrompt');
const liveTranscript = document.getElementById('liveTranscript');

// Inicializar Web Speech API con detección inteligente de silencio
function initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
        speechRecognition = new SpeechRecognition();
        speechRecognition.continuous = true;
        speechRecognition.interimResults = true;
        speechRecognition.lang = 'es-ES';

        speechRecognition.onresult = (event) => {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
            }

            if (transcript.trim().length > 0) {
                if (currentMode === 'live') {
                    liveTranscript.textContent = transcript;
                }

                // Reiniciar temporizador de silencio: apenas el usuario haga una pausa de 1.2s, procesa automáticamente la respuesta
                clearTimeout(silenceTimer);
                silenceTimer = setTimeout(() => {
                    if (isRecording) {
                        console.log("[LIVE AUTO-RESPONSE] Pausa/silencio detectado. Enviando audio...");
                        stopRecording();
                    }
                }, 1200); // 1.2 segundos de silencio tras hablar
            }
        };

        speechRecognition.onerror = (err) => {
            console.log("Speech Recognition Info:", err.error);
        };
    }
}

initSpeechRecognition();

// Cambiar de Estado (idle, listening, thinking, speaking)
function setState(newState) {
    currentState = newState;
    arcReactor.classList.remove('listening', 'thinking', 'speaking');
    jarvisContainer.classList.remove('listening', 'thinking', 'speaking');

    if (newState !== 'idle') {
        arcReactor.classList.add(newState);
        jarvisContainer.classList.add(newState);
    }

    switch (newState) {
        case 'idle':
            statusText.textContent = "EN ESPERA";
            interactivePrompt.textContent = currentMode === 'live' ? "ESCUCHANDO..." : "Presiona el micrófono para hablar";
            break;
        case 'listening':
            statusText.textContent = "ESCUCHANDO...";
            interactivePrompt.textContent = "Escuchando tu voz...";
            break;
        case 'thinking':
            statusText.textContent = "PENSANDO...";
            interactivePrompt.textContent = "Procesando respuesta...";
            break;
        case 'speaking':
            statusText.textContent = "HABLANDO...";
            interactivePrompt.textContent = "JARVIS está respondiendo...";
            break;
    }
}

// Transición entre MODO CHAT y MODO LIVE
function setMode(mode) {
    currentMode = mode;
    if (mode === 'live') {
        jarvisContainer.classList.add('live-mode');
        modeToggleBtn.querySelector('.mode-label').textContent = "MODO CHAT";
        startLiveSession();
    } else {
        jarvisContainer.classList.remove('live-mode');
        modeToggleBtn.querySelector('.mode-label').textContent = "MODO LIVE";
        stopLiveSession();
    }
}

modeToggleBtn.addEventListener('click', () => {
    setMode(currentMode === 'chat' ? 'live' : 'chat');
});

recordBtn.addEventListener('click', () => {
    if (currentMode === 'chat') {
        setMode('live');
    } else {
        if (!isRecording) {
            startRecording();
        } else {
            stopRecording();
        }
    }
});

exitLiveBtn.addEventListener('click', () => {
    setMode('chat');
});

// Controladores de Sesión Live
async function startLiveSession() {
    liveTranscript.textContent = "";
    await startRecording();
}

function stopLiveSession() {
    clearTimeout(silenceTimer);
    clearTimeout(maxRecordingTimer);
    if (isRecording) {
        stopRecording();
    }
    setState('idle');
    liveTranscript.textContent = "";
}

// Grabación de Audio mediante MediaRecorder con ventana inteligente de 5 a 10s
async function startRecording() {
    try {
        clearTimeout(silenceTimer);
        clearTimeout(maxRecordingTimer);

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            sendAudioToBackend(audioBlob);
        };

        mediaRecorder.start();
        isRecording = true;
        recordBtn.classList.add('recording');
        setState('listening');

        if (speechRecognition) {
            try { speechRecognition.start(); } catch (e) {}
        }

        // Límite máximo de seguridad entre 5 y 10 segundos por turno si el usuario habla sin detenerse
        maxRecordingTimer = setTimeout(() => {
            if (isRecording) {
                console.log("[LIVE MAX TIMER] Límite máximo alcanzado. Procesando...");
                stopRecording();
            }
        }, 8000); // 8 segundos exactos

    } catch (err) {
        alert("No se pudo acceder al micrófono: " + err.message);
        setMode('chat');
    }
}

function stopRecording() {
    clearTimeout(silenceTimer);
    clearTimeout(maxRecordingTimer);

    if (mediaRecorder && isRecording) {
        isRecording = false;
        try { mediaRecorder.stop(); } catch(e) {}
        recordBtn.classList.remove('recording');
        setState('thinking');

        if (speechRecognition) {
            try { speechRecognition.stop(); } catch (e) {}
        }
    }
}

// Enviar Mensajes Escritos (Modo Chat)
sendBtn.addEventListener('click', () => {
    const text = textInput.value.trim();
    if (text) {
        sendTextToBackend(text);
        textInput.value = '';
    }
});

textInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        sendBtn.click();
    }
});

// Resetear Conversación
resetBtn.addEventListener('click', async () => {
    await fetch('/api/reset', { method: 'POST' });
    chatContainer.innerHTML = `
        <div class="message assistant">
            <div class="message-content">
                <p>Conversación reiniciada. ¿En qué puedo ayudarte hoy?</p>
            </div>
        </div>
    `;
    liveTranscript.textContent = "";
});

// Comunicación con Backend API
async function sendAudioToBackend(audioBlob) {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'input.wav');

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        handleResponse(data, true);
    } catch (err) {
        handleError(err.message);
    }
}

async function sendTextToBackend(text) {
    appendMessage(text, 'user');
    setState('thinking');

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });
        const data = await response.json();
        handleResponse(data, false);
    } catch (err) {
        handleError(err.message);
    }
}

function handleResponse(data, appendUser = true) {
    if (data.error) {
        setState('idle');
        if (currentMode === 'live') {
            // Si no detectó audio o hubo un silencio largo, reanuda la escucha sin mostrar alerta fea
            setTimeout(() => { startLiveSession(); }, 1000);
        } else {
            appendMessage("Error: " + data.error, 'assistant');
        }
        return;
    }

    if (appendUser && data.user_text) {
        appendMessage(data.user_text, 'user');
        liveTranscript.textContent = `"${data.user_text}"`;
    }

    appendMessage(data.response_text, 'assistant');

    // Reproducir Audio y manejar estado 'speaking'
    if (data.audio_url) {
        setState('speaking');
        const audio = new Audio(data.audio_url + '?t=' + new Date().getTime());
        
        audio.onended = () => {
            if (currentMode === 'live') {
                // Reanudar inmediatamente el flujo de escucha al terminar de hablar
                startLiveSession();
            } else {
                setState('idle');
            }
        };

        audio.onerror = () => {
            if (currentMode === 'live') {
                startLiveSession();
            } else {
                setState('idle');
            }
        };

        audio.play().catch(e => {
            console.log("Reproducción bloqueada:", e);
            if (currentMode === 'live') {
                startLiveSession();
            } else {
                setState('idle');
            }
        });
    } else {
        if (currentMode === 'live') {
            startLiveSession();
        } else {
            setState('idle');
        }
    }
}

function handleError(errorMsg) {
    setState('idle');
    appendMessage("Error de conexión: " + errorMsg, 'assistant');
}

function appendMessage(text, sender) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${sender}`;
    msgDiv.innerHTML = `
        <div class="message-content">
            <p>${escapeHtml(text)}</p>
        </div>
    `;
    chatContainer.appendChild(msgDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function escapeHtml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

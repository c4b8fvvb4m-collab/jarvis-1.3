// ============================================================
// JARVIS — UI shell
// This file wires up the panel, chat log, mic button and orb
// animation states. The actual "brain" (Grok call) and voice
// (fish.audio) plug into the two functions marked below.
// ============================================================

const panelToggle = document.getElementById('panelToggle');
const sidePanel   = document.getElementById('sidePanel');
const chatLog     = document.getElementById('chatLog');
const textForm    = document.getElementById('textForm');
const textInput   = document.getElementById('textInput');
const micBtn      = document.getElementById('micBtn');
const orb         = document.getElementById('orb');
const statusLine  = document.getElementById('statusLine');

// ---------- Panel open/close ----------

panelToggle.addEventListener('click', () => {
  sidePanel.classList.toggle('closed');
});

// ---------- Chat log rendering ----------

function addMessage(text, who) {
  // who is 'jarvis' or 'user'
  const bubble = document.createElement('div');
  bubble.className = `msg ${who}`;
  bubble.textContent = text;
  chatLog.appendChild(bubble);
  chatLog.scrollTop = chatLog.scrollHeight;
}

// ---------- Orb state helpers ----------

function setStatus(text) {
  statusLine.textContent = text;
}

function setOrbState(state) {
  // state: 'idle' | 'listening' | 'talking'
  orb.classList.remove('listening', 'talking');
  if (state === 'listening') orb.classList.add('listening');
  if (state === 'talking') orb.classList.add('talking');
}

// ---------- Text input fallback ----------

textForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = textInput.value.trim();
  if (!text) return;
  addMessage(text, 'user');
  textInput.value = '';
  handleUserInput(text);
});

// ---------- Voice input (browser speech recognition) ----------

let recognition = null;
let listening = false;

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'en-US';

  recognition.onstart = () => {
    listening = true;
    micBtn.classList.add('active');
    setOrbState('listening');
    setStatus('Listening…');
  };

  recognition.onend = () => {
    listening = false;
    micBtn.classList.remove('active');
    setOrbState('idle');
    setStatus('Standing by');
  };

  recognition.onerror = (e) => {
    setStatus('Mic error: ' + e.error);
  };

  recognition.onresult = (e) => {
    const transcript = e.results[0][0].transcript;
    addMessage(transcript, 'user');
    handleUserInput(transcript);
  };
} else {
  micBtn.disabled = true;
  micBtn.title = 'Speech recognition not supported in this browser';
}

micBtn.addEventListener('click', () => {
  if (!recognition) return;
  if (listening) {
    recognition.stop();
  } else {
    recognition.start();
  }
});

// ============================================================
// PLUG-IN POINTS
// ============================================================

// 1. Send the user's message to the AI brain (Groq) and get a reply.
//    This calls our own backend (server.js), which holds the real API key.
async function getJarvisReply(userText) {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userText })
    });
    const data = await response.json();
    return data.reply;
  } catch (err) {
    return 'Sorry, I could not reach the server: ' + err.message;
  }
}

// 2. Speak Jarvis's reply out loud.
//    Replace the body of this function with your fish.audio call.
//    For now it falls back to the browser's built-in voice so you
//    can hear something while you wire up fish.audio.
function speakReply(text) {
  setOrbState('talking');
  setStatus('Speaking…');

  const utter = new SpeechSynthesisUtterance(text);
  utter.onend = () => {
    setOrbState('idle');
    setStatus('Standing by');
  };
  window.speechSynthesis.speak(utter);
}

// ---------- Orchestration ----------

async function handleUserInput(text) {
  setStatus('Thinking…');
  const reply = await getJarvisReply(text);
  addMessage(reply, 'jarvis');
  speakReply(reply);
}

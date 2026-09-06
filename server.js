// server.js
// A tiny backend that keeps your Groq API key secret and
// forwards chat messages to Groq on Jarvis's behalf.

const express = require('express');
const app = express();
app.use(express.json());
app.use(express.static('.')); // serves index.html, style.css, script.js from this folder

const GROQ_API_KEY = 'YOUR_GROQ_API_KEY'; // <-- paste your key here, never in script.js

app.post('/api/chat', async (req, res) => {
  const userMessage = req.body.message;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are Jarvis, a helpful, calm AI assistant.' },
          { role: 'user', content: userMessage }
        ]
      })
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'Sorry, I had trouble replying.';
    res.json({ reply });
  } catch (err) {
    res.status(500).json({ reply: 'Error talking to Groq: ' + err.message });
  }
});

app.listen(3000, () => console.log('Jarvis backend running on http://localhost:3000'));

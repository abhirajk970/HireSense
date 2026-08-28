const express = require("express");
const axios = require("axios");
const router = express.Router();

router.post("/transcribe", async (req, res) => {
  try {
    const { audio, mimeType } = req.body;
    if (!audio) {
      return res.status(400).json({ error: "Missing audio payload" });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "OpenAI API key not configured on backend" });
    }

    // Decode base64 to binary buffer
    const buffer = Buffer.from(audio, "base64");

    // Construct form data using global Node.js FormData and Blob
    const formData = new FormData();
    const audioBlob = new Blob([buffer], { type: mimeType || "audio/webm" });
    
    formData.append("file", audioBlob, "audio.webm");
    formData.append("model", "whisper-1");
    formData.append("language", "en"); // restrict/hint english to speed up transcription

    console.log("[Whisper Proxy] Submitting audio payload to OpenAI Whisper...");
    
    const whisperRes = await axios.post(
      "https://api.openai.com/v1/audio/transcriptions",
      formData,
      {
        headers: {
          "Authorization": `Bearer ${apiKey}`
        }
      }
    );

    const transcription = whisperRes.data?.text || "";
    console.log(`[Whisper Proxy] Transcribed: "${transcription}"`);
    res.json({ text: transcription });

  } catch (err) {
    console.error("[Whisper Proxy] Transcription error:", err.response?.data || err.message);
    res.status(500).json({ 
      error: "Transcription failed", 
      details: err.response?.data || err.message 
    });
  }
});

module.exports = router;

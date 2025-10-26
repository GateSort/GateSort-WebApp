// /pages/api/elevenlabs/speak.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Missing text" });

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "No API key" });

    // ElevenLabs endpoint (Text-to-Speech)
    const voiceId = "EXAVITQu4vr4xnSDxMaL"; // Usa tu voz configurada
    const apiUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.6, similarity_boost: 0.8 },
      }),
    });

    if (!response.ok) throw new Error(`ElevenLabs API error: ${response.statusText}`);

    const audioBuffer = await response.arrayBuffer();
    res.setHeader("Content-Type", "audio/mpeg");
    res.send(Buffer.from(audioBuffer));
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

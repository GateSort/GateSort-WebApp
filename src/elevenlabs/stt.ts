import fetch from "node-fetch";
import { ELEVENLABS_API_KEY, BASE_URL } from "./client";

export interface ElevenLabsSTTResponse {
  text: string;
}

export async function convertVoiceToText(audioBuffer: Buffer): Promise<string> {
  const response = await fetch(`${BASE_URL}/speech-to-text`, {
    method: "POST",
    headers: {
      "xi-api-key": ELEVENLABS_API_KEY,
      "Content-Type": "audio/mpeg", // o "audio/wav"
    },
    body: audioBuffer,
  });

  if (!response.ok) {
    throw new Error(`STT failed: ${response.statusText}`);
  }

  const data = (await response.json()) as ElevenLabsSTTResponse;

  if (!data.text) {
    throw new Error("STT returned invalid response");
  }

  return data.text;
}

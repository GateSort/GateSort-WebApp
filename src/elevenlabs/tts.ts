import fetch from "node-fetch";
import { ELEVENLABS_API_KEY, ELEVENLABS_AGENT_ID } from "./client";
import fs from "fs";

export async function speakWithElevenLabs(text: string, outputFile: string) {
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_AGENT_ID}`, {
    method: "POST",
    headers: {
      "xi-api-key": ELEVENLABS_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    throw new Error(`TTS failed: ${response.statusText}`);
  }

  const audioBuffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(outputFile, audioBuffer);
  console.log(`✅ Audio saved to ${outputFile}`);
}

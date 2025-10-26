// /lib/elevenlabsClient.ts
export async function speakWithElevenLabs(text: string) {
  try {
    const res = await fetch("/api/elevenlabs/speak", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error("Error al generar voz");

    const audioBlob = await res.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    audio.play();
  } catch (err) {
    console.error("[ElevenLabs speak] Error:", err);
  }
}

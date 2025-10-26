import { convertVoiceToText } from "../elevenlabs/stt";
import { getAirlineByName } from "../elevenlabs/GateSort";

async function askAirlineAndFlight(audioBufferAirline: Buffer, flightNumber: string) {
  const airlineName = await convertVoiceToText(audioBufferAirline); // opcional si usas voz
  const airline = await getAirlineByName(airlineName);
  return { airline, flightNumber };
}


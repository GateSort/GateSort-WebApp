import { convertVoiceToText } from "../elevenlabs/stt";
import { getAirlineByName } from "../elevenlabs/GateSort";

async function askAirlineAndFlight(audioBufferAirline: Buffer, flightNumber: string) {
  // Convertimos la voz del usuario a texto
  const airlineName = await convertVoiceToText(audioBufferAirline);

  // Obtenemos la aerolínea de la DB
  const airline = await getAirlineByName(airlineName);

  console.log("Usuario viaja en:", airline.name, "vuelo:", flightNumber);

  return { airline, flightNumber };
}

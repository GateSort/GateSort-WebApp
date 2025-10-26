import { db } from "../db/client";
import { airlines } from "../db/schema";
import { eq } from "drizzle-orm";
import { speakWithElevenLabs } from "../lib/elevenlabsClient";

//lee las aerolineas disponibles
export async function getAllAirlines() {
  const airlinesList = await db.select().from(airlines);
  return airlinesList; // Array of { id, name }
}

// Obtiene aerolínea por su nombre

export async function getAirlineByName(airlineName: string) {
  const airline = await db.query.airlines.findFirst({
    where: (a) => eq(a.name, airlineName),
  });

  if (!airline) throw new Error("Airline not found");
  const handleTest = async () => {
    // mensaje despues de recibir la aerolinea
    await speakWithElevenLabs("Oh thats great! You selected " + airline.name + " such a wonderful airline to travel!");
  };
  return airline; // { id, name }
}

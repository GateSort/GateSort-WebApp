import { db } from "../db/client";
import { airlines } from "../db/schema";
import { eq } from "drizzle-orm";

// Obtiene aerolínea por su nombre
export async function getAirlineByName(airlineName: string) {
  const airline = await db.query.airlines.findFirst({
    where: (a) => eq(a.name, airlineName),
  });

  if (!airline) throw new Error("Aerolinea no encontrada");

  return airline; // { id, name }
}

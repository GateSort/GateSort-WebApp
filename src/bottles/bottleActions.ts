import { db } from "../db/client";
import { eq } from "drizzle-orm";
import { getAirlineByName } from "../elevenlabs/GateSort"; // ajusta la ruta según tu estructura

export interface BottleAction {
  filename: string;
  prediction: "empty" | "medium" | "full";
  action: string;
  vuelo: string;
  aerolinea: string;
}

export async function generateBottleAction(
  filename: string,
  prediction: "empty" | "medium" | "full",
  flightNumber: string,
  airlineName: string
): Promise<BottleAction> {
  // Obtenemos la aerolínea por nombre
  const airline = await getAirlineByName(airlineName);

  // Obtenemos las reglas de la aerolínea
  const rule = await db.query.bottle_rules.findFirst({
    where: (r, { eq }) => eq(r.airline_id, airline.id),
  });

  if (!rule) throw new Error("Regla de botella no encontrada");

  let action = "";
  switch (prediction) {
    case "empty":
      action = rule.empty;
      break;
    case "medium":
      action = rule.partial;
      break;
    case "full":
      action = rule.full;
      break;
  }

  return {
    filename,
    prediction,
    action,
    vuelo: flightNumber,
    aerolinea: airline.name,
  };
}

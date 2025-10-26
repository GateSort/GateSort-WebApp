import { db } from "@/db/client";
import { bottle_rules, airlines } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function generateBottleAction(prediction: "empty" | "medium" | "full", airlineName: string) {
  const airline = await db.select().from(airlines).where(eq(airlines.name, airlineName)).limit(1);
  if (!airline.length) throw new Error("Aerolinea no encontrada");

  const rules = await db.select().from(bottle_rules).where(eq(bottle_rules.airline_id, airline[0].id)).limit(1);
  if (!rules.length) throw new Error("Reglas no encontradas");

  const rule = rules[0];
  return rule[prediction === "medium" ? "partial" : prediction];
}

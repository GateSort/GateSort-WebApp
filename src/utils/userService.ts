import { db } from "../db/db-index";
import { users, airlines } from "../db/schema";
import { getAirlineFromFlightCode } from "./getAirlineFromFlightCode";
import bcrypt from "bcrypt";

export async function registerUser({
  name,
  email,
  password,
  flightCode,
}: {
  name: string;
  email: string;
  password: string;
  flightCode?: string;
}) {
  const hash = await bcrypt.hash(password, 10);

  const airlineInfo = getAirlineFromFlightCode(flightCode);
  if (airlineInfo) {
    // Inserta la aerolínea si no existe
    await db
      .insert(airlines)
      .values({
        abreviation: airlineInfo.code,
        name: airlineInfo.name,
      })
      .onConflictDoNothing()
      .returning({
        abreviation: airlines.abreviation,
        name: airlines.name,
      });
  }

  const [user] = await db
    .insert(users)
    .values({
      name,
      email,
      password_hash: hash, // coincide con tu tabla
      flightcode: flightCode, // coincide con tu tabla
    })
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      flightcode: users.flightcode,
    });

  return user;
}

import express from "express";
import * as bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "../db/db-index";
import { users, airlines } from "../db/schema";
import { getAirlineFromFlightCode } from "../utils/getAirlineFromFlightCode";
import { eq } from "drizzle-orm";

const router = express.Router();

// Registro
router.post("/register", async (req, res) => {
  const { name, email, password, flightcode } = req.body;
  const hash = await bcrypt.hash(password, 10);

  const airlineInfo = getAirlineFromFlightCode(flightcode);
  if (airlineInfo) {
    await db.insert(airlines)
      .values({ abreviation: airlineInfo.code, name: airlineInfo.name })
      .onConflictDoNothing();
  }

  const [user] = await db.insert(users)
    .values({ name, email, password_hash: hash, flightcode })
    .returning({ id: users.id, name: users.name, email: users.email, flightcode: users.flightcode });

  res.json(user);
});

// Login
router.post("/login", async (req,res) => {
  const { email, password } = req.body;
  const [user] = await db.select().from(users).where(eq(users.email, email));

  if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: "Contraseña incorrecta" });

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: "12h" });
  res.json({ token, user });
});

export default router;

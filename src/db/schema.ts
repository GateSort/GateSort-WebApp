import { pgTable, serial, text, varchar, integer, date } from "drizzle-orm/pg-core";

export const airlines = pgTable("airlines", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
});

export const flights = pgTable("flights", {
  id: serial("id").primaryKey(),
  airline_id: integer("airline_id").notNull().references(() => airlines.id),
  flight_number: varchar("flight_number", { length: 10 }).notNull(),
});

export const bottle_rules = pgTable("bottle_rules", {
  id: serial("id").primaryKey(),
  airline_id: integer("airline_id").notNull().references(() => airlines.id),
  empty: text("empty").notNull(),
  partial: text("partial").notNull(),
  full: text("full").notNull(),
});

export const stickers = pgTable("stickers", {
  id: serial("id").primaryKey(),
  shape: text("shape").notNull(),
  color: text("color").notNull(),
  caducity_date: date("caducity_date").notNull(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  expiration_date: date("expiration_date").notNull(),
  type: text("type").notNull(),
  sticker_id: integer("sticker_id").notNull().references(() => stickers.id),
});

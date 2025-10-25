import { pgTable, serial, text, varchar, integer, decimal, date, uuid, timestamp} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";


export const airlines = pgTable("airlines", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  abreviation: varchar("abreviation", { length : 2}).notNull(),
  rules_version: integer("rules_version"),
});

export const bottletypes = pgTable("bottletype", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  alcohol_content: decimal("alcohol_content", { precision: 5, scale: 2 }).notNull(),
});


export const bottle_rules = pgTable("bottle_rules", {
  id: serial("id").primaryKey(),
  airline_id: integer("airline_id").notNull().references(() => airlines.id),
  bottle_type_id: integer("bottle_type_id").notNull().references(() => bottletypes.id),
  action_if_empty: text("action_if_empty").notNull(),
  action_if_partial: text("action_if_partial").notNull(),
  action_if_full: text("action_if_full").notNull(),
  action: text("action").notNull(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  expiration_date: date().notNull(),
  type: text("type").notNull(),
  sticker_shape: text("sticker_shape").notNull(),
  sticker_color: text("sticker_color").notNull(),
});

export const cartlayout = pgTable("cartlayout", {
  id: serial("id").primaryKey(),
  airline_id: serial("airline_id").notNull().references(() => airlines.id),
  position: text("position").notNull(),
  expected_product_id: serial("expected_product_id").notNull().references(() => products.id)
});

export const users = pgTable("users", {
  id: serial("id").primaryKey().notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password_hash: text("password_hash").notNull(),
  flightcode: varchar("flightcode", { length: 10}),
});
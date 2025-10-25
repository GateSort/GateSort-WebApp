import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql", // or "sqlite"
  dbCredentials: {
    url: process.env.DB_URL!,
  },
});
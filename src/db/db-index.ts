// ESM style
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sslCertPath = path.join(__dirname, "../certs/prod-ca-2021.crt");
const sslCert = fs.readFileSync(sslCertPath).toString();
// Local DB (PGAdmin)
export const localPool = new Pool({
  connectionString: process.env.DB_URL, // tu localhost
});
export const localDb = drizzle(localPool);

// Supabase DB
export const supabasePool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: {
    rejectUnauthorized: false, // ignora certificados self-signed
  },
});
export const supabaseDb = drizzle(supabasePool);

import { client } from "./src/db/client";

async function dropTables() {
  try {
    await client`DROP TABLE IF EXISTS products CASCADE`;
    await client`DROP TABLE IF EXISTS stickers CASCADE`;
    await client`DROP TABLE IF EXISTS flights CASCADE`;
    await client`DROP TABLE IF EXISTS bottle_rules CASCADE`;
    await client`DROP TABLE IF EXISTS cartlayout CASCADE`;
    await client`DROP TABLE IF EXISTS airlines CASCADE`;
    await client`DROP TABLE IF EXISTS users CASCADE`;
    await client`DROP TABLE IF EXISTS drizzle.__drizzle_migrations CASCADE`;
    await client`DROP SCHEMA IF EXISTS drizzle CASCADE`;
    
    console.log("✅ All tables and migrations dropped successfully!");
  } catch (err) {
    console.error("❌ Error dropping tables:", err);
  } finally {
    await client.end();
  }
}

dropTables();

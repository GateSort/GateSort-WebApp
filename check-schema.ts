import { client } from "./src/db/client";

async function checkSchema() {
  try {
    const tables = await client`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    console.log("All tables:");
    console.log(tables);
    
    const productsColumns = await client`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'products'
      ORDER BY ordinal_position;
    `;
    console.log("\nProducts columns:");
    console.log(productsColumns);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

checkSchema();

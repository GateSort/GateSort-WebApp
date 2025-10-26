import { db } from "./src/db/client";
import { airlines, flights, bottle_rules, stickers, products } from "./src/db/schema";
import { client } from "./src/db/client";

async function checkData() {
  try {
    const airlinesData = await db.select().from(airlines);
    console.log("Airlines:", airlinesData);
    
    const flightsData = await db.select().from(flights);
    console.log("\nFlights:", flightsData);
    
    const bottleRulesData = await db.select().from(bottle_rules);
    console.log("\nBottle Rules:", bottleRulesData);
    
    const stickersData = await db.select().from(stickers);
    console.log("\nStickers:", stickersData);
    
    const productsData = await db.select().from(products);
    console.log("\nProducts:", productsData);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

checkData();

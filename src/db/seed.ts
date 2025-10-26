import { db } from "./client"
import { airlines, flights, bottle_rules, products, stickers } from "./schema"

async function seed() {
  try {
    // Seed Airlines
    const airlinesData = await db.insert(airlines).values([
      { name: "Aeroméxico" },
      { name: "Volaris" },
      { name: "VivaAerobus" },
      { name: "American Airlines" }
    ]).returning();

    // Seed bottle rules
    await db.insert(bottle_rules).values([
      { airline_id: airlinesData[0].id, empty: "Discard", partial: "Keep", full: "Keep" },
      { airline_id: airlinesData[1].id, empty: "Discard", partial: "Discard", full: "Keep" },
      { airline_id: airlinesData[2].id, empty: "Discard", partial: "Keep", full: "Keep" },
      { airline_id: airlinesData[3].id, empty: "Discard", partial: "Discard", full: "Keep" },
    ]);

    // Seed flights
    await db.insert(flights).values([
      { airline_id: airlinesData[0].id, flight_number: "AM123" },
      { airline_id: airlinesData[0].id, flight_number: "AM234" },
      { airline_id: airlinesData[1].id, flight_number: "VR123" },
      { airline_id: airlinesData[1].id, flight_number: "VR234" },
      { airline_id: airlinesData[2].id, flight_number: "VA123" },
      { airline_id: airlinesData[2].id, flight_number: "VA456" },
      { airline_id: airlinesData[3].id, flight_number: "AA123" },
      { airline_id: airlinesData[3].id, flight_number: "AA456" },
    ]);

    // Stickers
    await db.insert(stickers).values([
      { shape: "circle", color: "red", caducity_date: "2025-01-01" },
      { shape: "circle", color: "green", caducity_date: "2025-04-01" },
      { shape: "circle", color: "yellow", caducity_date: "2025-07-01" },
      { shape: "circle", color: "blue", caducity_date: "2025-10-01" },  
      { shape: "square", color: "red", caducity_date: "2024-01-01" },
      { shape: "square", color: "green", caducity_date: "2024-04-01" },
      { shape: "square", color: "yellow", caducity_date: "2024-07-01" },
      { shape: "square", color: "blue", caducity_date: "2024-10-01" },
      { shape: "triangle", color: "red", caducity_date: "2026-01-01" },
      { shape: "triangle", color: "green", caducity_date: "2026-04-01" },
      { shape: "triangle", color: "yellow", caducity_date: "2026-07-01" },
      { shape: "triangle", color: "blue", caducity_date: "2026-10-01" },
      { shape: "hexagon", color: "red", caducity_date: "2027-01-01" },
      { shape: "hexagon", color: "green", caducity_date: "2027-04-01" },
      { shape: "hexagon", color: "yellow", caducity_date: "2027-07-01" },
      { shape: "hexagon", color: "blue", caducity_date: "2027-10-01" },
    ]);

    // Productos
    await db.insert(products).values([
      { name: "Chocolate", expiration_date: "2025-12-31", type: "Snack",  sticker_id: 1},
      { name: "Agua 500ml", expiration_date: "2026-01-15", type: "Drink", sticker_id: 2 },
      { name: "Galletas", expiration_date: "2025-11-30", type: "Snack", sticker_id: 3 },
      { name: "Jugo 250ml", expiration_date: "2025-10-31", type: "Drink", sticker_id: 4 },
    ]);


    console.log("✅ Dummy data inserted successfully!");
  } catch (err) {
    console.error("❌ Error inserting dummy data:", err);
  } finally {
    process.exit();
  }
}

seed();

const { supabaseDb } = require("./db/db-index");
const { airlines, bottletypes, bottle_rules, products, cartlayout, users } = require("./db/schema");
const bcrypt = require("bcrypt");

const db = supabaseDb;
async function seed() {
  try {
    // Aerolíneas
    await db.insert(airlines).values([
      { name: "Aeroméxico", abreviation: "AM", rules_version: 1 },
      { name: "Volaris", abreviation: "Y4", rules_version: 1 },
      { name: "VivaAerobus", abreviation: "VB", rules_version: 1 },
      { name: "American Airlines", abreviation: "AA", rules_version: 1 },
      { name: "Delta Airlines", abreviation: "DL", rules_version: 1 },
      { name: "United Airlines", abreviation: "UA", rules_version: 1 },
    ]);

    // Tipos de botellas
    await db.insert(bottletypes).values([
      { name: "Whisky 700ml", alcohol_content: 40.0 },
      { name: "Vodka 500ml", alcohol_content: 37.5 },
      { name: "Tequila 700ml", alcohol_content: 38.0 },
      { name: "Ron 750ml", alcohol_content: 35.0 },
      { name: "Ginebra 700ml", alcohol_content: 39.0 },
    ]);

    // Productos
    await db.insert(products).values([
      { name: "Chocolate", expiration_date: "2025-12-31", type: "Snack", sticker_shape: "triangle", sticker_color: "prueba" },
      { name: "Agua 500ml", expiration_date: "2026-01-15", type: "Bebida", sticker_shape: "triangle", sticker_color: "prueba" },
      { name: "Galletas", expiration_date: "2025-11-30", type: "Snack", sticker_shape: "triangle", sticker_color: "prueba" },
      { name: "Jugo 250ml", expiration_date: "2025-10-31", type: "Bebida", sticker_shape: "triangle", sticker_color: "prueba"},
    ]);

    // --------------------------
    // Reglas de botellas
    // --------------------------
    await db.insert(bottle_rules).values([
      // Aeroméxico
      { airline_id: 1, bottle_type_id: 1, action_if_empty: "Desechar", action_if_partial: "Reusar si permitido", action_if_full: "Reusar", action: "Verificar etiqueta" },
      { airline_id: 1, bottle_type_id: 2, action_if_empty: "Desechar", action_if_partial: "Reusar con supervisión", action_if_full: "Siempre etiquetar", action: "Confirmar origen" },
      { airline_id: 1, bottle_type_id: 3, action_if_empty: "Desechar si está abierto", action_if_partial: "Reusar", action_if_full: "Reusar", action: "Verificar sello" },
      { airline_id: 1, bottle_type_id: 4, action_if_empty: "Revisar y desechar", action_if_partial: "Reusar si permitido", action_if_full: "Reusar", action: "Etiqueta visible" },
      { airline_id: 1, bottle_type_id: 5, action_if_empty: "Desechar", action_if_partial: "Reusar con supervisión", action_if_full: "Siempre etiquetar", action: "Confirmar origen" },

      // Volaris
      { airline_id: 2, bottle_type_id: 1, action_if_empty: "Desechar", action_if_partial: "Reusar", action_if_full: "Reusar", action: "Verificar etiqueta" },
      { airline_id: 2, bottle_type_id: 2, action_if_empty: "Desechar", action_if_partial: "Reusar si permitido", action_if_full: "Siempre etiquetar", action: "Confirmar origen" },
      { airline_id: 2, bottle_type_id: 3, action_if_empty: "Desechar si está abierto", action_if_partial: "Reusar con supervisión", action_if_full: "Reusar", action: "Verificar sello" },
      { airline_id: 2, bottle_type_id: 4, action_if_empty: "Revisar y desechar", action_if_partial: "Reusar", action_if_full: "Reusar", action: "Etiqueta visible" },
      { airline_id: 2, bottle_type_id: 5, action_if_empty: "Desechar", action_if_partial: "Reusar si permitido", action_if_full: "Siempre etiquetar", action: "Confirmar origen" },

      // VivaAerobus
      { airline_id: 3, bottle_type_id: 1, action_if_empty: "Desechar", action_if_partial: "Reusar con supervisión", action_if_full: "Reusar", action: "Verificar etiqueta" },
      { airline_id: 3, bottle_type_id: 2, action_if_empty: "Desechar si está abierto", action_if_partial: "Reusar", action_if_full: "Siempre etiquetar", action: "Confirmar origen" },
      { airline_id: 3, bottle_type_id: 3, action_if_empty: "Desechar", action_if_partial: "Reusar si permitido", action_if_full: "Reusar", action: "Verificar sello" },
      { airline_id: 3, bottle_type_id: 4, action_if_empty: "Revisar y desechar", action_if_partial: "Reusar con supervisión", action_if_full: "Reusar", action: "Etiqueta visible" },
      { airline_id: 3, bottle_type_id: 5, action_if_empty: "Desechar", action_if_partial: "Reusar", action_if_full: "Siempre etiquetar", action: "Confirmar origen" },

      // American Airlines
      { airline_id: 4, bottle_type_id: 1, action_if_empty: "Desechar", action_if_partial: "Reusar si permitido", action_if_full: "Reusar", action: "Verificar etiqueta" },
      { airline_id: 4, bottle_type_id: 2, action_if_empty: "Desechar", action_if_partial: "Reusar con supervisión", action_if_full: "Siempre etiquetar", action: "Confirmar origen" },
      { airline_id: 4, bottle_type_id: 3, action_if_empty: "Desechar si está abierto", action_if_partial: "Reusar", action_if_full: "Reusar", action: "Verificar sello" },
      { airline_id: 4, bottle_type_id: 4, action_if_empty: "Revisar y desechar", action_if_partial: "Reusar si permitido", action_if_full: "Reusar", action: "Etiqueta visible" },
      { airline_id: 4, bottle_type_id: 5, action_if_empty: "Desechar", action_if_partial: "Reusar con supervisión", action_if_full: "Siempre etiquetar", action: "Confirmar origen" },

      // Delta Airlines
      { airline_id: 5, bottle_type_id: 1, action_if_empty: "Desechar", action_if_partial: "Reusar", action_if_full: "Reusar", action: "Verificar etiqueta" },
      { airline_id: 5, bottle_type_id: 2, action_if_empty: "Desechar", action_if_partial: "Reusar si permitido", action_if_full: "Siempre etiquetar", action: "Confirmar origen" },
      { airline_id: 5, bottle_type_id: 3, action_if_empty: "Desechar si está abierto", action_if_partial: "Reusar con supervisión", action_if_full: "Reusar", action: "Verificar sello" },
      { airline_id: 5, bottle_type_id: 4, action_if_empty: "Revisar y desechar", action_if_partial: "Reusar", action_if_full: "Reusar", action: "Etiqueta visible" },
      { airline_id: 5, bottle_type_id: 5, action_if_empty: "Desechar", action_if_partial: "Reusar si permitido", action_if_full: "Siempre etiquetar", action: "Confirmar origen" },

      // United Airlines
      { airline_id: 6, bottle_type_id: 1, action_if_empty: "Desechar", action_if_partial: "Reusar con supervisión", action_if_full: "Reusar", action: "Verificar etiqueta" },
      { airline_id: 6, bottle_type_id: 2, action_if_empty: "Desechar si está abierto", action_if_partial: "Reusar", action_if_full: "Siempre etiquetar", action: "Confirmar origen" },
      { airline_id: 6, bottle_type_id: 3, action_if_empty: "Desechar", action_if_partial: "Reusar si permitido", action_if_full: "Reusar", action: "Verificar sello" },
      { airline_id: 6, bottle_type_id: 4, action_if_empty: "Revisar y desechar", action_if_partial: "Reusar con supervisión", action_if_full: "Reusar", action: "Etiqueta visible" },
      { airline_id: 6, bottle_type_id: 5, action_if_empty: "Desechar", action_if_partial: "Reusar", action_if_full: "Siempre etiquetar", action: "Confirmar origen" },
    ]);


    // Layout de carrito
    await db.insert(cartlayout).values([
      { airline_id: 1, position: "A1", expected_product_id: 1 },
      { airline_id: 1, position: "A2", expected_product_id: 2 },
      { airline_id: 2, position: "B1", expected_product_id: 3 },
      { airline_id: 3, position: "C1", expected_product_id: 4 },
    ]);

    // Usuarios
    const hash = await bcrypt.hash("password123", 10);
    await db.insert(users).values([
      { name: "Ana Pérez", email: "ana@example.com", password_hash: hash, flightcode: "AM123" },
      { name: "Luis Gómez", email: "luis@example.com", password_hash: hash, flightcode: "Y4123" },
      { name: "Carla Ruiz", email: "carla@example.com", password_hash: hash, flightcode: "VB456" },
    ]);

    console.log("✅ Dummy data inserted successfully!");
  } catch (err) {
    console.error("❌ Error inserting dummy data:", err);
  } finally {
    process.exit();
  }
}

seed();

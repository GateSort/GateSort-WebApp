import { db } from "@/db/client";
import { airlines, bottle_rules } from "@/db/schema";
import { eq } from "drizzle-orm";

// Normaliza distintas formas de respuesta del backend hacia { results: BottlePrediction[] }
type PredictionLabel = "full" | "medium" | "empty";
type ActionLabel = "keep" | "discard";

type RawPrediction = {
  confidence: number;
  file_name: string;
  predicted_class: PredictionLabel;
};

// (parseServerJson removed) We now handle the API raw shape directly (raw.predictions)

// Load all chats
export async function getPredictionAction(items: { blob: string; id: number }[], airlineName: string) {
  try {
    const form = new FormData();

    // Convert base64 strings back to blobs
    await Promise.all(items.map(async (item) => {
      const response = await fetch(`data:image/jpeg;base64,${item.blob}`);
      const blob = await response.blob();
      form.append("images", blob, `bottle-${item.id}.jpg`); // debe coincidir con Flask
    }));

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/predict`, { method: "POST", body: form });
    if (!res.ok) throw new Error(await res.text().catch(() => `HTTP ${res.status}`));

    
    const raw = (await res.json().catch(() => null)) as
      | { predictions?: RawPrediction[] }
      | null;

    const airline = await db.select().from(airlines).where(eq(airlines.name, airlineName)).limit(1);
    const bottleRules = await db.select().from(bottle_rules)
        .leftJoin(airlines, eq(bottle_rules.airline_id, airlines.id))
        .where(eq(airlines.id, airline[0].id));
    const rule = bottleRules[0].bottle_rules;
    console.log(bottleRules);

    // Extract predictions from the raw response (new shape)
    const predictions: RawPrediction[] = raw && Array.isArray(raw.predictions) ? (raw.predictions as RawPrediction[]) : [];

    // Mapear las predicciones con las reglas de botella
    const actions = predictions.map((prediction: RawPrediction) => {
        let action: ActionLabel = "discard";
        console.log(rule)
        if (prediction.predicted_class === "full") {
            action = rule.full as ActionLabel;
        } else if (prediction.predicted_class === "medium") {
            action = rule.partial as ActionLabel;
        } else if (prediction.predicted_class === "empty") {
            action = rule.empty as ActionLabel;
        }

        return {
            filename: prediction.file_name,
            prediction: prediction.predicted_class as PredictionLabel,
            action,
        };
    });
    
    const result = {
        success: true,
        airline: airlineName,
        actions,
    }
    console.log("result:", result);
    return result;
  } catch (error) {
    return { success: false, error, message: "Error building predictions" };
  }
};
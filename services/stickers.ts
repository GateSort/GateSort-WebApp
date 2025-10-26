import { db } from "@/db/client";
import { stickers } from "@/db/schema";

// Normaliza distintas formas de respuesta del backend hacia { results: BottlePrediction[] }
type Color = "green" | "blue" | "yellow" | "red";
type Shape = "circle" | "triangle" | "square" | "hexagon";

type RawAnalysis = {
  total: number;
  counts: Counts;
};

type Counts = {
    color: Color;
    shape: Shape;
    count: number;
}[];

type StickerCount = {
  shape: Shape;
  color: Color;
  count: number;
};

type StickerAnalysis = {
  total: number;
  details: StickerCount[];
};

type StickerResponse = {
  expired: StickerAnalysis;
  not_expired: StickerAnalysis;
} | {
  success: false;
  error: unknown;
  message: string;
};

// Load all chats
export async function getStickerPrediction(image: { blob: string; id: number }) {
try {
    const form = new FormData();

    // Convert base64 strings back to blobs
    const response = await fetch(`data:image/jpeg;base64,${image.blob}`);
    const blob = await response.blob();
    form.append("image", blob, `bottle-${image.id}.jpg`);
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stickers`, { method: "POST", body: form });
    if (!res.ok) throw new Error(await res.text().catch(() => `HTTP ${res.status}`));
    
    // Get API response with detected stickers
    const raw = (await res.json().catch(() => null)) as
      | { counts: Counts, total: number }
      | null;

    if (!raw?.counts) {
      throw new Error("No sticker predictions received from API");
    }

    // Get all stickers from database for reference
    const stickersData = await db.select().from(stickers);
    const currentDate = new Date();

    // Process each detected sticker from the image
    const { expired, notExpired } = raw.counts.reduce((acc, detectedSticker) => {
      // Find matching sticker in database by shape and color
      const matchingStickers = stickersData.filter(dbSticker => 
        dbSticker.shape === detectedSticker.shape && 
        dbSticker.color === detectedSticker.color
      );

      // For each matching sticker found in image
      for (let i = 0; i < detectedSticker.count; i++) {
        const dbSticker = matchingStickers[0]; // Use first matching sticker type
        if (dbSticker?.caducity_date) {
          const caducityDate = new Date(dbSticker.caducity_date);
          if (caducityDate < currentDate) {
            acc.expired.push({ ...detectedSticker, count: 1 });
          } else {
            acc.notExpired.push({ ...detectedSticker, count: 1 });
          }
        } else {
          // If no matching sticker in DB or no caducity date, count as not expired
          acc.notExpired.push({ ...detectedSticker, count: 1 });
        }
      }
      return acc;
    }, { expired: [] as StickerCount[], notExpired: [] as StickerCount[] });

    // Aggregate counts by shape and color
    const expiredCounts = expired.reduce((acc, sticker) => {
      const key = `${sticker.shape}-${sticker.color}`;
      if (!acc[key]) {
        acc[key] = {
          shape: sticker.shape,
          color: sticker.color,
          count: 0
        };
      }
      acc[key].count += 1; // Add 1 for each instance
      return acc;
    }, {} as Record<string, StickerCount>);

    const notExpiredCounts = notExpired.reduce((acc, sticker) => {
      const key = `${sticker.shape}-${sticker.color}`;
      if (!acc[key]) {
        acc[key] = {
          shape: sticker.shape,
          color: sticker.color,
          count: 0
        };
      }
      acc[key].count += 1; // Add 1 for each instance
      return acc;
    }, {} as Record<string, StickerCount>);

    // Calculate totals and format response
    const stickercount: StickerResponse = {
      expired: {
        total: expired.length,
        details: Object.values(expiredCounts)
      },
      not_expired: {
        total: notExpired.length,
        details: Object.values(notExpiredCounts)
      }
    }
    const result = {
        success: true,
        ...stickercount
    }
    return result;
  } catch (error) {
    return { success: false, error, message: "Error building predictions" };
  }
};
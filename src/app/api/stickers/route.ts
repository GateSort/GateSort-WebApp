import { getStickerPrediction } from "../../../../services/stickers";

export async function POST(request: Request) {
  const { image } = await request.json();
  if (!image) return Response.json({ success: false, message: "Image is required" }, { status: 400 });
  const result = await getStickerPrediction(image);
  return Response.json(result, { status: result.success ? 200 : 400 });
}
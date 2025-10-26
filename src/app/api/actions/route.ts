import { getPredictionAction } from "../../../../services/actions";

export async function POST(request: Request) {
  const { items, airlineName } = await request.json();
  if (!airlineName) return Response.json({ success: false, message: "Airline name is required" }, { status: 400 });
  if (!items || items.length === 0) return Response.json({ success: false, message: "Items are required" }, { status: 400 });
  const result = await getPredictionAction(items, airlineName);
  return Response.json(result, { status: result.success ? 200 : 400 });
}
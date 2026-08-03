import { NextRequest } from "next/server";
import { getWeatherOverview } from "@/lib/weather";
import { ok, notFound } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  const stationId = req.nextUrl.searchParams.get("stationId") ?? "ws_01";
  const overview = await getWeatherOverview(stationId);
  if (!overview) return notFound(`Stasiun ${stationId} tidak ditemukan`);
  return ok(overview);
}

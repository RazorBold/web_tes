import { listWeatherStations } from "@/lib/weather";
import { ok } from "@/lib/api-response";

export async function GET() {
  const stations = await listWeatherStations();
  return ok(stations, { page: 1, pageSize: stations.length, total: stations.length });
}

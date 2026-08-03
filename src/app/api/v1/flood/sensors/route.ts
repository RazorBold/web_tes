import { listFloodSensors } from "@/lib/flood";
import { ok } from "@/lib/api-response";

export async function GET() {
  const sensors = await listFloodSensors();
  return ok(sensors, { page: 1, pageSize: sensors.length, total: sensors.length });
}

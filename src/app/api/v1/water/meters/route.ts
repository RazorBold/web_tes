import { listWaterMeters } from "@/lib/water";
import { ok } from "@/lib/api-response";

export async function GET() {
  const meters = await listWaterMeters();
  return ok(meters, { page: 1, pageSize: meters.length, total: meters.length });
}

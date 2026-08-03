import { listPowerMeters } from "@/lib/power";
import { ok } from "@/lib/api-response";

export async function GET() {
  const meters = await listPowerMeters();
  return ok(meters, { page: 1, pageSize: meters.length, total: meters.length });
}

import { listFleetVehicles } from "@/lib/fleet";
import { ok } from "@/lib/api-response";

export async function GET() {
  const vehicles = await listFleetVehicles();
  return ok(vehicles, { page: 1, pageSize: vehicles.length, total: vehicles.length });
}

import { listWaterZones } from "@/lib/water";
import { ok } from "@/lib/api-response";

export async function GET() {
  return ok(await listWaterZones());
}

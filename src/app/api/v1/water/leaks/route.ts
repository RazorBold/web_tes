import { listLeakingZones } from "@/lib/water";
import { ok } from "@/lib/api-response";

export async function GET() {
  return ok(await listLeakingZones());
}

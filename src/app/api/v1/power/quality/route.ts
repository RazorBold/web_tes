import { getPowerQuality } from "@/lib/power";
import { ok } from "@/lib/api-response";

export async function GET() {
  return ok(await getPowerQuality());
}

import { getFleetOverview } from "@/lib/fleet";
import { ok } from "@/lib/api-response";

export async function GET() {
  return ok(await getFleetOverview());
}

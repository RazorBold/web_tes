import { getFloodOverview } from "@/lib/flood";
import { ok } from "@/lib/api-response";

export async function GET() {
  return ok(await getFloodOverview());
}

import { getTempHumOverview } from "@/lib/temphum";
import { ok } from "@/lib/api-response";

export async function GET() {
  return ok(await getTempHumOverview());
}

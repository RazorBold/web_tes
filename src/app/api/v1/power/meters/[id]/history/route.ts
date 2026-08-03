import { getPowerMeterHistory } from "@/lib/power";
import { ok } from "@/lib/api-response";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return ok(await getPowerMeterHistory(id));
}

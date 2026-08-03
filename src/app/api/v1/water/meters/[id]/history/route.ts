import { getWaterMeterHistory } from "@/lib/water";
import { ok } from "@/lib/api-response";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const history = await getWaterMeterHistory(id);
  return ok(history);
}

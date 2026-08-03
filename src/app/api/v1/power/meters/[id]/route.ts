import { getPowerMeter } from "@/lib/power";
import { ok, notFound } from "@/lib/api-response";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const meter = await getPowerMeter(id);
  if (!meter) return notFound(`Meter ${id} tidak ditemukan`);
  return ok(meter);
}

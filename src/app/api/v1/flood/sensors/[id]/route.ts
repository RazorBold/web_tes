import { getFloodSensor } from "@/lib/flood";
import { ok, notFound } from "@/lib/api-response";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sensor = await getFloodSensor(id);
  if (!sensor) return notFound(`Sensor ${id} tidak ditemukan`);
  return ok(sensor);
}

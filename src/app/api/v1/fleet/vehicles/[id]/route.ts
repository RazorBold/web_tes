import { getFleetVehicle } from "@/lib/fleet";
import { ok, notFound } from "@/lib/api-response";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const vehicle = await getFleetVehicle(id);
  if (!vehicle) return notFound(`Kendaraan ${id} tidak ditemukan`);
  return ok(vehicle);
}

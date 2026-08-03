import { listDevices } from "@/lib/devices";
import { ok } from "@/lib/api-response";

export async function GET() {
  const devices = await listDevices();
  return ok(devices, { page: 1, pageSize: devices.length, total: devices.length });
}

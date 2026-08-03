import { listRoomTypes } from "@/lib/temphum";
import { ok } from "@/lib/api-response";

export async function GET() {
  const roomTypes = await listRoomTypes();
  return ok(roomTypes, { page: 1, pageSize: roomTypes.length, total: roomTypes.length });
}

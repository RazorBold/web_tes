import { listRoomsWithStatus } from "@/lib/temphum";
import { ok } from "@/lib/api-response";

export async function GET() {
  const rooms = await listRoomsWithStatus();
  return ok(rooms, { page: 1, pageSize: rooms.length, total: rooms.length });
}

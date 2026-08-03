import { listNvrCameras } from "@/lib/cctv-nvr";
import { ok } from "@/lib/api-response";

export const runtime = "nodejs";

/**
 * GET /api/v1/cctv/cameras
 *
 * Daftar kamera NVR yang bisa di-stream. Sengaja hanya `id` & `name` — GUID
 * tetap di server supaya tidak pernah muncul di Network tab browser.
 */
export async function GET() {
  const cameras = listNvrCameras();
  return ok(cameras, { page: 1, pageSize: cameras.length, total: cameras.length });
}

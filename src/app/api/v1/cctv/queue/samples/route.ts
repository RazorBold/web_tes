import { getQueueSamplesWithImages } from "@/lib/cctv-queue";
import { ok, fail } from "@/lib/api-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_LIMIT = 100;

/**
 * GET /api/v1/cctv/queue/samples?limit=40
 *
 * Sampel terbaru yang memuat orang, beserta path gambar buktinya. Sampel
 * berzona kosong disaring di lapisan lib — separuh lebih sampel harian berisi
 * nol orang dan hanya akan memenuhi panel dengan foto ruangan kosong.
 */
export async function GET(request: Request) {
  const limit = Math.min(
    Math.max(Number(new URL(request.url).searchParams.get("limit")) || 40, 1),
    MAX_LIMIT
  );
  try {
    return ok(await getQueueSamplesWithImages(limit));
  } catch (err) {
    return fail("DB_ERROR", err instanceof Error ? err.message : "Gagal membaca sampel", 500);
  }
}

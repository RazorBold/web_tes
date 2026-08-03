import { listHeatmapFrames, processHeatmapQueue } from "@/lib/cctv-heatmap";
import { ok, fail } from "@/lib/api-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/v1/cctv/heatmap/frames?limit=12
 *
 * Daftar frame heatmap YANG SUDAH JADI — hanya membaca database, jadi balasannya
 * cepat berapa pun beban render di belakang.
 *
 * Putaran render dipicu di latar tanpa ditunggu (`void`). Merendernya di sini
 * akan membuat kartu menunggu 2–8 detik hanya karena kebetulan dialah yang
 * pertama membuka; hasilnya menyusul di polling berikutnya. Penjadwal memanggil
 * endpoint yang sama, sehingga antrean tetap jalan walau tak ada yang menonton.
 */
export async function GET(request: Request) {
  const limit = Math.min(
    Math.max(Number(new URL(request.url).searchParams.get("limit")) || 12, 1),
    48
  );

  try {
    const frames = await listHeatmapFrames(limit);
    void processHeatmapQueue().catch(() => undefined);
    return ok(frames);
  } catch (err) {
    return fail("DB_ERROR", err instanceof Error ? err.message : "Gagal membaca frame", 500);
  }
}

import { ensureFresh, getVisitorOverview, getVisitorHistory } from "@/lib/cctv-visitor";
import { HistoryApiError } from "@/lib/cctv-history";
import { ok, fail } from "@/lib/api-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/v1/cctv/visitor/overview
 *
 * Ringkasan Visitor Counting hari ini + riwayat harian.
 *
 * Route ini juga yang MENJAGA KESEGARAN data: bila penarikan terakhir sudah
 * lewat dua menit, ia menarik ulang dari NVR sebelum menjawab. Dengan begitu
 * tidak perlu endpoint tulis terpisah yang terbuka tanpa autentikasi, dan
 * kebenaran datanya tidak bergantung pada ada-tidaknya proses penjadwal.
 *
 * Kegagalan menarik dari NVR sengaja TIDAK menggagalkan permintaan: angka yang
 * sudah tersimpan tetap disajikan, hanya `lastSyncAt`-nya yang tertinggal.
 * Dashboard yang menampilkan angka basi jauh lebih berguna daripada kartu error.
 */
export async function GET() {
  let syncWarning: string | null = null;
  try {
    await ensureFresh();
  } catch (err) {
    syncWarning =
      err instanceof HistoryApiError || err instanceof Error
        ? err.message
        : "Gagal menarik data terbaru dari NVR";
  }

  try {
    const [overview, history] = await Promise.all([getVisitorOverview(), getVisitorHistory(7)]);
    return ok({ ...overview, history, syncWarning });
  } catch (err) {
    return fail("DB_ERROR", err instanceof Error ? err.message : "Gagal membaca data visitor", 500);
  }
}

import { ensureQueueFresh, getQueueOverview } from "@/lib/cctv-queue";
import { HistoryApiError } from "@/lib/cctv-history";
import { ok, fail } from "@/lib/api-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/v1/cctv/queue/overview
 *
 * Akumulasi People Crowded hari ini. Seperti endpoint visitor, route ini juga
 * yang menjaga kesegaran data; kegagalan menarik dari NVR tidak menggagalkan
 * permintaan — angka tersimpan tetap disajikan dengan `syncWarning`.
 */
export async function GET() {
  let syncWarning: string | null = null;
  try {
    await ensureQueueFresh();
  } catch (err) {
    syncWarning = err instanceof Error ? err.message : "Gagal menarik data terbaru dari NVR";
  }

  try {
    return ok({ ...(await getQueueOverview()), syncWarning });
  } catch (err) {
    if (err instanceof HistoryApiError) return fail("NVR_ERROR", err.message, err.status);
    return fail("DB_ERROR", err instanceof Error ? err.message : "Gagal membaca data antrean", 500);
  }
}

import { getRecentHits } from "@/lib/cctv-visitor";
import { HistoryApiError } from "@/lib/cctv-history";
import { ok, fail } from "@/lib/api-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Cukup untuk meminta "sehari penuh".
 *
 * Dinaikkan dari 180 menit karena batas itu membuat kartu bukti kosong hampir
 * sepanjang hari: terukur, garis hitung dilewati 104 kali hari ini tapi NOL kali
 * dalam tiga jam terakhir. Kartu yang menampilkan "belum ada" padahal ada 104
 * kejadian bukan kartu yang berguna.
 *
 * Aman dilebarkan karena channel lintasan isinya teks saja — tidak seperti
 * channel deteksi heatmap yang memuat potongan JPEG base64 dan pernah membuat
 * layanan 8989 tumbang. `limit` di bawah yang menjaga jumlah baris yang dikirim
 * ke klien, dan penarikan seharian ini sudah rutin dilakukan sinkronisasi
 * harian.
 */
const MAX_MINUTES = 1440;
const MAX_LIMIT = 100;

/**
 * GET /api/v1/cctv/visitor/hits?minutes=60&limit=40
 *
 * Lintasan terbaru beserta cuplikan gambarnya, untuk panel pemantauan.
 * Diambil langsung dari NVR (bukan MySQL) supaya benar-benar mengikuti keadaan
 * terkini — lihat catatan pada getRecentHits().
 */
export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams;

  // Dibatasi supaya satu permintaan tidak bisa menyuruh NVR menyapu rentang
  // waktu yang lebar-lebar.
  const minutes = Math.min(Math.max(Number(sp.get("minutes")) || 60, 1), MAX_MINUTES);
  const limit = Math.min(Math.max(Number(sp.get("limit")) || 40, 1), MAX_LIMIT);

  try {
    return ok(await getRecentHits(minutes, limit));
  } catch (err) {
    if (err instanceof HistoryApiError) return fail("NVR_ERROR", err.message, err.status);
    return fail("NVR_ERROR", err instanceof Error ? err.message : "Gagal mengambil lintasan", 502);
  }
}

import { NVR_CAMERAS } from "@/lib/cctv-nvr";
import { fetchSnapshot, HistoryApiError } from "@/lib/cctv-history";
import { fail, notFound } from "@/lib/api-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Bentuk path yang sah dari NVR, mis. `2026073115/74289/max_image/152847813.jpg`:
 *   <YYYYMMDDHH>/<channel>/<jenis>/<nama>.jpg
 *
 * Dicocokkan ketat, bukan sekadar menolak "..", karena path ini ditempelkan ke
 * URL permintaan ke NVR — pola longgar membuka jalan menyusun path ke berkas
 * lain di server itu.
 */
const PATH_PATTERN = /^\d{10}\/\d+\/[a-z_]+\/[\w-]+\.jpg$/i;

/**
 * GET /api/v1/cctv/cameras/:id/snapshot?path=<imgpath>
 *
 * Meneruskan satu gambar bukti dari NVR untuk kamera mana pun. Harus lewat
 * server karena gambarnya dilindungi header Authorization, sementara tag <img>
 * tidak bisa mengirim header — dan menaruh secret di URL berarti membocorkannya
 * ke setiap penonton.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const camera = NVR_CAMERAS[id];
  if (!camera) return notFound(`Kamera "${id}" tidak terdaftar`);

  const path = new URL(request.url).searchParams.get("path") ?? "";
  if (!PATH_PATTERN.test(path)) return fail("BAD_REQUEST", "Path gambar tidak sah", 400);

  try {
    const buf = await fetchSnapshot(camera.guid, path);
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Length": String(buf.length),
        // Nama berkas sudah memuat waktu, jadi isinya tidak pernah berubah.
        "Cache-Control": "private, max-age=3600, immutable",
      },
    });
  } catch (err) {
    if (err instanceof HistoryApiError) return fail("NVR_ERROR", err.message, err.status);
    return fail("NVR_ERROR", err instanceof Error ? err.message : "Gagal mengambil gambar", 502);
  }
}

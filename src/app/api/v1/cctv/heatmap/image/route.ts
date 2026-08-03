import { readFile } from "node:fs/promises";
import { getFrameFile } from "@/lib/cctv-heatmap";
import { fail, notFound } from "@/lib/api-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/v1/cctv/heatmap/image?id=<frame>&size=thumb|full
 *
 * Menyajikan berkas hasil render dari disk. Berkasnya sengaja TIDAK ditaruh di
 * public/ supaya penyajiannya lewat satu pintu yang bisa memvalidasi id dan
 * mengatur cache.
 */
export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams;
  const id = Number(sp.get("id"));
  const size = sp.get("size") === "full" ? "full" : "thumb";

  if (!Number.isInteger(id) || id <= 0) return fail("BAD_REQUEST", "id frame tidak sah", 400);

  try {
    const file = await getFrameFile(id, size);
    if (!file) return notFound("Frame heatmap tidak ditemukan");

    const buf = await readFile(file);
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Length": String(buf.length),
        // Hasil render tidak pernah berubah setelah ditulis.
        "Cache-Control": "private, max-age=86400, immutable",
      },
    });
  } catch {
    return notFound("Berkas heatmap tidak ada di disk");
  }
}

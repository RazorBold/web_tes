import { getStreamUrl, NvrError } from "@/lib/cctv-nvr";
import { ok, fail } from "@/lib/api-response";
import { DEFAULT_STREAM_PROFILE, isValidProfile } from "@/config/cctv-stream";

// Butuh `node:https` (sertifikat NVR self-signed), jadi tidak bisa di Edge.
// 'nodejs' memang default, ditulis eksplisit supaya alasannya ikut terbaca.
export const runtime = "nodejs";

/**
 * GET /api/v1/cctv/cameras/:id/stream-url?profile=Streaming%202
 *
 * Mengembalikan URL MPEG-TS berumur pendek untuk satu kamera. Yang ditangani
 * route ini HANYA pengambilan URL-nya — byte videonya sendiri diambil browser
 * langsung dari NVR (stream-nya ber-CORS `*`), begitu pula WebSocket anotasi AI.
 * Artinya browser yang membuka dashboard harus satu jaringan dengan NVR.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Profil yang tidak dikenal jatuh ke default, bukan diteruskan mentah ke NVR.
  const requested = new URL(request.url).searchParams.get("profile");
  const profile = requested && isValidProfile(requested) ? requested : DEFAULT_STREAM_PROFILE;

  try {
    return ok(await getStreamUrl(id, profile));
  } catch (err) {
    if (err instanceof NvrError) {
      return fail(err.status === 404 ? "CAMERA_NOT_FOUND" : "NVR_ERROR", err.message, err.status);
    }
    return fail("NVR_ERROR", err instanceof Error ? err.message : "Gagal mengambil URL stream", 502);
  }
}

import { openCameraStream, NvrError } from "@/lib/cctv-nvr";
import { fail } from "@/lib/api-response";
import { DEFAULT_STREAM_PROFILE, isValidProfile } from "@/config/cctv-stream";

export const runtime = "nodejs";
// Jangan sampai disentuh optimasi statis — ini aliran tak berujung, bukan dokumen.
export const dynamic = "force-dynamic";

/**
 * GET /api/v1/cctv/cameras/:id/stream?profile=Streaming%202
 *
 * Menyalurkan MPEG-TS kamera lewat server (Opsi B), bukan menyuruh browser
 * menghubungi NVR sendiri. Dua masalah yang dibereskannya sekaligus:
 *
 *  1. NVR hanya mengizinkan satu token stream aktif per akun. Kalau browser yang
 *     menyambung, ada jeda antara "URL terbit" dan "koneksi dibuka" yang bisa
 *     disela permintaan kamera lain. Di sini kedua langkah itu terjadi di server
 *     dalam satu antrean (lihat openCameraStream), jadi jedanya hilang.
 *  2. Sertifikat NVR sah untuk *.icode.id tapi diakses lewat IP, sehingga browser
 *     menolaknya. Server tidak terikat aturan itu.
 */
/**
 * Batas menunggu byte pertama. Terukur: aliran yang sehat mengirim byte pertama
 * dalam 21–151 ms, paling lambat 1,7 detik saat menunggu keyframe. 6 detik jauh
 * di atas itu, dan tetap di bawah timeout koneksi 8 detik di cctv-nvr.ts.
 */
const FIRST_BYTE_TIMEOUT_MS = 6_000;

/**
 * Tunggu sampai NVR benar-benar mengirim isi.
 *
 * Perlu karena NVR menjawab **HTTP 200 lalu menutup koneksi tanpa satu byte pun**
 * untuk profil yang tidak dimiliki kamera. Kalau 200 kosong itu diteruskan apa
 * adanya, mpegts.js tidak punya apa pun untuk di-demux DAN tidak menganggapnya
 * galat — pemutar menggantung di "Menyambung" selamanya, tanpa pesan, tanpa
 * mencoba ulang. Menahannya di sini mengubah kegagalan diam menjadi HTTP 502
 * yang memicu penanganan galat yang sudah ada di klien.
 *
 * Mengembalikan potongan pertama (untuk dikirim ulang di bawah, supaya tidak ada
 * byte yang hilang), atau alasan kegagalan.
 */
function tungguBytePertama(
  upstream: import("node:http").IncomingMessage
): Promise<{ chunk: Buffer } | { gagal: "kosong" | "timeout" }> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => selesai({ gagal: "timeout" }), FIRST_BYTE_TIMEOUT_MS);

    const onData = (chunk: Buffer) => {
      // Jeda dulu: aliran baru dilanjutkan setelah ReadableStream siap menerima,
      // supaya tidak ada potongan yang terbuang di antara keduanya.
      upstream.pause();
      selesai({ chunk });
    };
    const onEnd = () => selesai({ gagal: "kosong" });
    const onError = () => selesai({ gagal: "kosong" });

    function selesai(hasil: { chunk: Buffer } | { gagal: "kosong" | "timeout" }) {
      clearTimeout(timer);
      upstream.off("data", onData);
      upstream.off("end", onEnd);
      upstream.off("error", onError);
      resolve(hasil);
    }

    upstream.on("data", onData);
    upstream.on("end", onEnd);
    upstream.on("error", onError);
  });
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const requested = new URL(request.url).searchParams.get("profile");
  const profile = requested && isValidProfile(requested) ? requested : DEFAULT_STREAM_PROFILE;

  let upstream;
  try {
    upstream = await openCameraStream(id, profile);
  } catch (err) {
    if (err instanceof NvrError) {
      return fail(err.status === 404 ? "CAMERA_NOT_FOUND" : "NVR_ERROR", err.message, err.status);
    }
    return fail("NVR_ERROR", err instanceof Error ? err.message : "Gagal membuka stream", 502);
  }

  // Browser menutup tab / pindah halaman → koneksi ke NVR ikut ditutup. Tanpa
  // ini, tiap penonton yang pergi meninggalkan koneksi menganggur di NVR.
  request.signal.addEventListener("abort", () => upstream.destroy());

  const awal = await tungguBytePertama(upstream);
  if ("gagal" in awal) {
    upstream.destroy();
    return fail(
      "NVR_EMPTY_STREAM",
      awal.gagal === "kosong"
        ? `NVR menerima permintaan tapi tidak mengirim video untuk profil "${profile}" — kemungkinan besar kamera ini tidak menyediakan profil tersebut`
        : `NVR tidak mengirim video dalam ${FIRST_BYTE_TIMEOUT_MS / 1000} detik`,
      502
    );
  }

  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new Uint8Array(awal.chunk));

      upstream.on("data", (chunk: Buffer) => {
        controller.enqueue(new Uint8Array(chunk));
        // Penonton lambat tidak boleh membuat byte menumpuk di memori server.
        if ((controller.desiredSize ?? 0) <= 0) upstream.pause();
      });
      upstream.on("end", () => {
        try {
          controller.close();
        } catch {
          /* sudah ditutup oleh cancel() */
        }
      });
      upstream.on("error", (err) => controller.error(err));
    },
    pull() {
      upstream.resume();
    },
    cancel() {
      upstream.destroy();
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "video/MP2T",
      "Cache-Control": "no-store, no-transform",
      Connection: "keep-alive",
    },
  });
}

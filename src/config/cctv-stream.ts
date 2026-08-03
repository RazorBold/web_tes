// Profil stream NVR. Aman dipakai di klien maupun server — tidak memuat
// kredensial maupun GUID kamera (keduanya hanya ada di src/lib/cctv-nvr.ts).

export interface StreamProfile {
  /** Nilai yang dikirim ke NVR sebagai query `profile=`. */
  id: string;
  label: string;
  detail: string;
}

/**
 * HANYA `Streaming 2` yang benar-benar mengeluarkan video di kamera-kamera ini.
 *
 * Proyek contoh mencatat `Streaming 1 → 1920x1080`, tapi itu hasil probe di
 * kamera lain (ISD-SC-001-A). Diukur langsung pada kamera yang dipakai dashboard
 * ini (ISD-SC-001-B), tiap profil dibuka 5 detik:
 *
 *   Streaming 1 → HTTP 200, 0 byte, koneksi ditutup NVR dalam 0,2 detik
 *   Streaming 2 → HTTP 200, ±380 KB / 5 detik, byte pertama 21–37 ms
 *   Streaming 3 → HTTP 200, 0 byte, ditutup seketika
 *   tanpa param → HTTP 200, ±365 KB / 5 detik
 *
 * Resolusi aslinya dibaca dari SPS HEVC di dalam MPEG-TS: `Streaming 2` DAN
 * tanpa-parameter dua-duanya **640x360** (coded 640x384, dipotong lewat
 * conformance window) — tidak ada aliran 1080p untuk diminta.
 *
 * Karena itu `Streaming 1` DIHAPUS dari daftar, bukan sekadar tidak dipakai:
 * `isValidProfile()` yang menjaga query `?profile=` kini menolaknya dan jatuh ke
 * default, jadi klien lama yang masih memintanya tetap dapat video. Jangan
 * ditambahkan lagi tanpa mengukur ulang — meminta profil kosong membuat pemutar
 * menggantung di "Menyambung" tanpa pesan galat (NVR menjawab 200, hanya tanpa
 * isi), dan itulah bug yang membuat tampilan penuh tidak pernah menyala.
 */
export const STREAM_PROFILES: StreamProfile[] = [
  { id: "Streaming 2", label: "640x360", detail: "Satu-satunya profil berisi" },
];

export const DEFAULT_STREAM_PROFILE = STREAM_PROFILES[0].id;

export function isValidProfile(profile: string): boolean {
  return STREAM_PROFILES.some((p) => p.id === profile);
}

/**
 * Tambahkan / ganti parameter `profile` pada url_stream dari NVR.
 * URL dari API berakhir dengan '?' (mis. ".../<token>?"), jadi tinggal ditambah.
 */
export function withProfile(streamUrl: string, profile: string): string {
  try {
    const url = new URL(streamUrl);
    url.searchParams.set("profile", profile);
    return url.toString();
  } catch {
    // Fallback bila URL tidak bisa diparse.
    const sep = streamUrl.includes("?") ? (streamUrl.endsWith("?") ? "" : "&") : "?";
    return `${streamUrl}${sep}profile=${encodeURIComponent(profile)}`;
  }
}

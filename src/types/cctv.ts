/** Kamera NVR yang tersedia untuk di-stream (tanpa GUID — itu tinggal di server). */
export interface CctvCamera {
  id: string;
  name: string;
  /**
   * Fungsi AI kanal ini. Ketiganya sama-sama mengirim kotak deteksi — dulu di
   * sini tertulis kanal "heatmap" tidak pernah mengirim apa pun, dan itu keliru
   * (lihat catatan pengukuran di NVR_CAMERAS, src/lib/cctv-nvr.ts).
   */
  mode: "counting" | "queue" | "heatmap";
}

/**
 * Balasan `GET /api/v1/cctv/cameras/:id/stream-url`.
 *
 * `protocol` sengaja "mpegts", bukan "hls" seperti tertulis di docs/API.md:
 * walau path di NVR bernama `streamRTSPnew`, yang keluar adalah HTTP MPEG-TS
 * live (`video/MP2T`) berisi HEVC — bukan RTSP dan bukan HLS.
 */
export interface CctvStreamUrl {
  cameraId: string;
  name: string;
  url: string;
  protocol: "mpegts";
  profile: string;
  /** ISO-8601. Token di dalam `url` mati setelah waktu ini (biasanya ~1 jam). */
  expiresAt: string | null;
}

// ─── Anotasi dari WebSocket AI (wsai) ────────────────────────────────────

/** Satu bounding box, dalam koordinat resolusi referensi (lihat CctvAiRef). */
export interface CctvAiBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label: string;
  id: number | string | null;
}

export interface CctvAiLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/**
 * Resolusi acuan semua koordinat di atas — dikirim NVR sebagai pesan pertama.
 * Ukurannya belum tentu sama dengan resolusi stream yang sedang diputar, jadi
 * overlay wajib menskalakan dari sini, bukan dari ukuran video.
 */
export interface CctvAiRef {
  width: number;
  height: number;
}

/**
 * Zona poligon yang dikonfigurasi di kamera — mis. area antrean yang dihitung
 * hunian dan lama tunggunya. Dikirim NVR pada pesan init dengan bentuk
 * `{ BaseExitsCapture: { idx_0: [[x,y], ...] } }`.
 */
export interface CctvAiZone {
  /** Nama jalur asalnya, mis. "BaseExitsCapture.idx_0" — dipakai sebagai key. */
  id: string;
  points: [number, number][];
}

/**
 * Setelan kamera yang datang di pesan init: resolusi acuan, garis hitung, dan
 * zona. Ketiganya menempel selama sesi — bukan potret per-frame seperti kotak
 * deteksi, jadi digambar terus sejak koneksi terbuka.
 */
export interface CctvAiSetup {
  ref: CctvAiRef;
  lines: CctvAiLine[];
  zones: CctvAiZone[];
}

export type CctvAiStatus = "idle" | "connecting" | "open" | "closed" | "error";

/** Satu objek yang sedang dilacak, beserta lamanya berada di frame (detik). */
export interface CctvAiTrack {
  id: string;
  stayTime: number;
}

/**
 * Satu kiriman anotasi yang sudah dinormalisasi.
 *
 * `boxes` selalu ikut begitu pesan membawa kunci `detect` — termasuk saat kosong,
 * yang justru berarti "tidak ada objek di frame, bersihkan kotak".
 *
 * `inout` dan `tracks` diambil dari blok `realtime`, bagian yang diabaikan proyek
 * contoh padahal justru di situlah nilai produknya: pencacah masuk/keluar untuk
 * Visitor Counting, dan lama berdiam untuk deteksi antrean.
 */
export interface CctvAiAnnotations {
  boxes: CctvAiBox[];
  lines: CctvAiLine[];
  /** Pencacah per garis hitung; bentuk mentahnya [[a,b,c,d], ...]. */
  inout: number[][] | null;
  tracks: CctvAiTrack[];
}

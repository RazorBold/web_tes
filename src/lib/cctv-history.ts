// Klien REST "NVR-History Object & Video" — HANYA UNTUK SERVER.
//
// Layanan ini TERPISAH dari server streaming:
//   • streaming : https://192.168.88.248      (Apache/PHP, login username+password)
//   • history   : http://192.168.88.248:8989  (fasthttp, HTTP biasa)
//
// Autentikasinya pun berbeda. Token hasil login PHP DITOLAK di sini
// ("invalid or expired token"); yang diminta adalah JWT HS256 berpayload kosong
// yang kita tandatangani sendiri dengan secret bersama. Ini bukan tebakan —
// konfigurasinya tertulis di blok `auth` tiap endpoint pada koleksi Postman.

import crypto from "node:crypto";

export class HistoryApiError extends Error {
  constructor(message: string, readonly status: number = 502) {
    super(message);
    this.name = "HistoryApiError";
  }
}

/**
 * Channel AI per kamera di NVR. Satu kamera bisa punya beberapa channel.
 *
 * CHANNEL TERIKAT PADA GUID. Waktu GUID Visitor & Antrian diganti (2026-08-03),
 * channel lamanya ikut mati: 74237 dengan GUID baru membalas `data: null`, dan
 * dengan GUID lama isinya berhenti pukul 10.37 — persis saat NVR diprogram
 * ulang. Gejalanya menipu: kartu tetap menampilkan angka (dibaca dari MySQL
 * hasil sinkron sebelumnya) sementara sumbernya sudah tidak bertambah.
 *
 * Nomor barunya tidak ada di dokumentasi mana pun dan tidak ada endpoint yang
 * mendaftarnya, jadi ditemukan dengan memindai rentang 73800–75400 memakai
 * jendela pendek lalu mencocokkan BENTUK datanya:
 *   74433 → punya `direction`/`position` per orang  = lintasan garis hitung
 *   74338 → punya `max_detection`/`ocupancy`        = sampel zona antrean
 * Kalau GUID diganti lagi, ulangi cara itu — jangan menebak dari selisih nomor.
 */
export const NVR_CHANNELS = {
  visitor: 74433,
  heatmap: 74039,
  antrian: 74338,
  /**
   * Titik deteksi untuk kamera heatmap. Pada NVR ini gambar dan deteksi berada
   * di channel BERBEDA untuk kamera yang sama: 74039 punya gambarnya, 74028
   * punya bounding box orangnya. Keduanya TIDAK ikut berganti karena GUID
   * heatmap memang tidak diganti.
   *
   * HANYA BOLEH DIPANGGIL DENGAN JENDELA SEMPIT (≤ beberapa menit). Isinya
   * memuat potongan JPEG base64 per objek, sehingga satu jam bisa ≈173 MB —
   * permintaan 24 jam pernah membuat layanan 8989 berhenti merespons sekitar
   * semenit. Pada jendela 2 menit ukurannya wajar (terukur 0,5 MB, 0,6 detik).
   */
  heatmapDetect: 74028,
} as const;

function config() {
  const base = process.env.NVR_HISTORY_URL;
  const secret = process.env.NVR_HISTORY_JWT_SECRET;
  if (!base || !secret) {
    throw new HistoryApiError(
      "NVR_HISTORY_URL / NVR_HISTORY_JWT_SECRET belum diisi di .env.local",
      500
    );
  }
  return { base, secret };
}

/**
 * JWT HS256 berpayload kosong.
 *
 * Tanpa klaim `exp`, jadi tidak ada yang perlu disegarkan — token yang sama
 * berlaku terus. Tetap dibuat per panggilan karena biayanya hanya satu HMAC,
 * jauh lebih murah daripada menyimpan state yang harus dijaga kesegarannya.
 */
function signToken(secret: string): string {
  const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const head = b64({ alg: "HS256", typ: "JWT" });
  const body = b64({});
  const sig = crypto.createHmac("sha256", secret).update(`${head}.${body}`).digest("base64url");
  return `${head}.${body}.${sig}`;
}

/** Format waktu yang diminta API: ISO lokal dengan offset +07:00. */
export function toNvrTime(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(
    d.getMinutes()
  )}:${p(d.getSeconds())}+07:00`;
}

/** Satu event lintasan garis dari channel Visitor Counting. */
export interface VisitorEvent {
  id: string;
  direction: "in" | "out";
  name: string;
  time: number;
  position: number[];
  /** Nama berkas tanpa ekstensi — kunci untuk mencocokkan gambar snapshot. */
  file?: string;
}

interface Envelope<T> {
  code: number;
  error: boolean;
  message: string;
  data: T | null;
}

const REQUEST_TIMEOUT_MS = 30_000;
/**
 * Sabuk pengaman ukuran respons. Channel Visitor sehari penuh hanya ~100 KB,
 * jadi 24 MB sudah sangat longgar — tapi tanpa batas, satu channel yang salah
 * panggil bisa memakan memori proses sampai habis.
 */
const MAX_BYTES = 24 * 1024 * 1024;

async function getJson<T>(path: string): Promise<T> {
  const { base, secret } = config();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${base}${path}`, {
      headers: { Authorization: `Bearer ${signToken(secret)}`, Accept: "application/json" },
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new HistoryApiError("NVR history tidak merespons dalam 30 detik", 504);
    }
    throw new HistoryApiError(err instanceof Error ? err.message : "Gagal menghubungi NVR history");
  } finally {
    clearTimeout(timer);
  }

  const raw = await readCapped(res);
  let json: Envelope<T>;
  try {
    json = JSON.parse(raw) as Envelope<T>;
  } catch {
    throw new HistoryApiError(`Balasan NVR bukan JSON (HTTP ${res.status})`);
  }

  if (!res.ok || json.error) {
    throw new HistoryApiError(json.message || `NVR history membalas HTTP ${res.status}`, res.status);
  }
  return (json.data ?? ([] as unknown)) as T;
}

async function readCapped(res: Response): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return res.text();

  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > MAX_BYTES) {
      await reader.cancel();
      throw new HistoryApiError(
        `Balasan NVR melebihi ${MAX_BYTES / 1024 / 1024} MB — rentang waktunya terlalu lebar`,
        502
      );
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString("utf8");
}

/** Daftar berkas gambar snapshot pada satu rentang waktu. */
export async function listSnapshotPaths(
  guid: string,
  channelId: number,
  start: Date,
  end: Date,
  type = "image"
): Promise<string[]> {
  const qs = new URLSearchParams({
    guid,
    id: String(channelId),
    type,
    start: toNvrTime(start),
    end: toNvrTime(end),
  });
  const data = await getJson<{ imgpath?: Record<string, string[]> }>(
    `/history-object/list-image?${qs}`
  );
  return Object.values(data?.imgpath ?? {}).flat();
}

/**
 * Ambil satu berkas gambar.
 *
 * Harus lewat server: gambar dilindungi header Authorization, dan tag <img> di
 * browser tidak bisa mengirim header. Menaruh JWT-nya di query string memang
 * didukung API, tapi berarti membocorkan secret bersama ke setiap penonton.
 */
export async function fetchSnapshot(guid: string, imgpath: string): Promise<Buffer> {
  const { base, secret } = config();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${base}/history-object/image/${guid}/${imgpath}`, {
      headers: { Authorization: `Bearer ${signToken(secret)}`, Accept: "image/jpeg" },
      signal: controller.signal,
    });
    if (!res.ok) throw new HistoryApiError(`Gambar tidak ditemukan (HTTP ${res.status})`, res.status);
    const buf = Buffer.from(await res.arrayBuffer());
    if (!buf.length) throw new HistoryApiError("Gambar kosong — berkasnya kemungkinan sudah dirotasi", 404);
    return buf;
  } catch (err) {
    if (err instanceof HistoryApiError) throw err;
    if (err instanceof Error && err.name === "AbortError") {
      throw new HistoryApiError("NVR tidak merespons saat mengambil gambar", 504);
    }
    throw new HistoryApiError(err instanceof Error ? err.message : "Gagal mengambil gambar");
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Urai waktu dari path gambar NVR.
 * Format: "2026073113/74039/ori_image/135922078.jpg"
 *          YYYYMMDDHH  /channel/tipe    /HHMMSSmmm.jpg
 * Nama berkas adalah jam-menit-detik-milidetik pada zona waktu NVR (+07:00).
 */
export function parseImagePathTime(imgpath: string): Date | null {
  const m = /^(\d{4})(\d{2})(\d{2})(\d{2})\/[^/]+\/[^/]+\/(\d{2})(\d{2})(\d{2})(\d{1,3})?\.jpg$/i.exec(
    imgpath
  );
  if (!m) return null;
  const [, yyyy, mm, dd, , HH, MM, SS, ms] = m;
  // Dibangun sebagai UTC lalu digeser mundur 7 jam — supaya hasilnya instant
  // yang benar, bukan bergantung zona waktu server.
  const asUtc = Date.UTC(+yyyy, +mm - 1, +dd, +HH, +MM, +SS, ms ? +String(ms).padEnd(3, "0") : 0);
  return new Date(asUtc - 7 * 60 * 60_000);
}

export interface DetectionPoint {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label: string;
}

/**
 * Bounding box orang pada satu rentang waktu, dari channel deteksi.
 *
 * Respons upstream memuat potongan JPEG base64 per objek dan bisa besar sekali;
 * di sini hanya kotaknya yang diambil dan sisanya langsung dibuang, supaya
 * memori tidak menumpuk.
 */
export async function getDetectionBoxes(
  guid: string,
  detectChannel: number,
  start: Date,
  end: Date
): Promise<DetectionPoint[]> {
  const qs = new URLSearchParams({
    guid,
    id: String(detectChannel),
    type: "json",
    start: toNvrTime(start),
    end: toNvrTime(end),
  });
  const frames = await getJson<{ detect?: unknown[] }[]>(`/history-object?${qs}`);
  if (!Array.isArray(frames)) return [];

  const out: DetectionPoint[] = [];
  for (const frame of frames) {
    if (!Array.isArray(frame?.detect)) continue;
    for (const d of frame.detect) {
      // Format: [x1, y1, x2, y2, label, trackId]
      if (!Array.isArray(d) || d.length < 4) continue;
      const [x1, y1, x2, y2, label] = d;
      if (![x1, y1, x2, y2].every((n) => typeof n === "number" && Number.isFinite(n))) continue;
      out.push({ x1, y1, x2, y2, label: typeof label === "string" ? label : "" });
    }
  }
  return out;
}

/** Satu sampel keadaan zona dari channel Antrian (~30 detik sekali). */
export interface QueueSampleRaw {
  file?: string;
  time: number;
  /** Orang di zona saat sampel diambil. */
  current?: number;
  /** Puncak orang serentak selama rentang sampel. */
  max_detection?: number;
  /** Hunian rata-rata (pecahan). */
  ocupancy?: number;
  avg_stay?: number;
  max_stay_time?: number;
  /** CATATAN: bukan pencacah harian — nilainya naik-turun antar sampel. */
  in?: number;
  out?: number;
}

/** Sampel zona antrean pada satu rentang waktu. */
export async function getQueueSamples(
  guid: string,
  channelId: number,
  start: Date,
  end: Date
): Promise<QueueSampleRaw[]> {
  const qs = new URLSearchParams({
    guid,
    id: String(channelId),
    type: "json",
    start: toNvrTime(start),
    end: toNvrTime(end),
  });
  const rows = await getJson<QueueSampleRaw[]>(`/history-object?${qs}`);
  return Array.isArray(rows) ? rows : [];
}

/**
 * Event lintasan garis pada satu rentang waktu.
 *
 * Perlu diingat saat memakainya: SATU ORANG bisa menghasilkan puluhan event.
 * Orang yang berdiri di dekat garis membuat titik lacaknya bergetar melintasi
 * garis tiap frame, menghasilkan deret in/out bergantian berjarak <1 detik.
 * Terukur pada data nyata: 73% event harian datang dari 10 orang seperti itu.
 * Karena itu event WAJIB dikelompokkan per `id` sebelum dihitung — lihat
 * scripts/cctv-sync.mjs.
 */
export async function getVisitorEvents(
  guid: string,
  channelId: number,
  start: Date,
  end: Date
): Promise<VisitorEvent[]> {
  const qs = new URLSearchParams({
    guid,
    id: String(channelId),
    type: "json",
    start: toNvrTime(start),
    end: toNvrTime(end),
  });
  const rows = await getJson<VisitorEvent[]>(`/history-object?${qs}`);
  return Array.isArray(rows) ? rows : [];
}

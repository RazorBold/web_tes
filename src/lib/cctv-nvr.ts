// Klien NVR — HANYA UNTUK SERVER. Modul ini memegang password NVR dan GUID
// kamera; jangan pernah diimpor dari komponen klien.
//
// Alur yang dipakai NVR ini (hasil probe di contoh_getdata_cctv):
//   1. POST api/login/index      (username+password) → access_token
//   2. GET  api/camera/get-stream&guid=<guid>        → { url_stream, expired }
//
// Kenapa lewat server, bukan langsung dari browser: endpoint API NVR tidak
// mengirim header CORS sama sekali, jadi browser akan memblokirnya.
//
// Kenapa verifikasi TLS dimatikan: sertifikat NVR sebenarnya SAH (GlobalSign,
// SAN `*.icode.id` + `icode.id`) — bukan self-signed seperti dikira proyek
// contoh. Yang gagal adalah pencocokan nama host, karena kita menghubunginya
// lewat alamat IP yang tidak ada di SAN. Kalau NVR bisa diakses lewat nama di
// bawah *.icode.id, NVR_HOST sebaiknya diisi nama itu dan rejectUnauthorized
// dikembalikan ke true.
//
// Catatan: yang lewat sini hanya URL-nya. Byte videonya sendiri (dan WebSocket
// AI) diambil browser langsung dari NVR — lihat komentar di route stream-url.

import https from "node:https";
import { DEFAULT_STREAM_PROFILE, withProfile } from "@/config/cctv-stream";
import type { CctvCamera, CctvStreamUrl } from "@/types/cctv";

/** Error yang sudah membawa status HTTP yang pantas dikembalikan ke klien. */
export class NvrError extends Error {
  constructor(message: string, readonly status: number = 502) {
    super(message);
    this.name = "NvrError";
  }
}

// ─── Daftar kamera ───────────────────────────────────────────────────────
// GUID sengaja tinggal di server: klien cukup mengirim `id` yang pendek, jadi
// GUID tidak pernah muncul di Network tab browser.

interface NvrCamera {
  guid: string;
  name: string;
  /**
   * Fungsi AI yang dijalankan channel kamera ini. Diukur ulang 2026-08-03 pada
   * GUID baru, ketiga SSE dibuka bersamaan selama 45 detik:
   *   counting → 290 anotasi / 877 kotak, plus satu garis hitung
   *   queue    → 163 anotasi / 489 kotak, plus dua poligon zona
   *   heatmap  → 190 anotasi / 570 kotak
   *
   * Catatan: dulu di sini tertulis kanal heatmap "tidak pernah" mengirim
   * `detect`. Itu keliru — yang sebenarnya terjadi, koneksi wsai-nya kelaparan
   * karena dibuka berbarengan dengan kanal lain (lihat OPEN_STAGGER_MS di
   * cctv-ai-socket.ts). Setelah dijeda, kanal ini mengirim kotak sama rajinnya.
   */
  mode: "counting" | "queue" | "heatmap";
  /**
   * Sembunyikan dari daftar kamera yang bisa ditonton, tapi tetap terdaftar.
   *
   * Dipakai kanal yang GUID-nya masih dibutuhkan untuk menarik data riwayat,
   * sementara aliran langsungnya tidak perlu ditonton sendiri karena sudah
   * diwakili kanal lain pada kamera fisik yang sama.
   */
  historyOnly?: boolean;
}

/**
 * GUID diganti 2026-08-03 atas permintaan pemakai — kanal lama untuk Visitor dan
 * Antrian sudah tidak dilayani NVR (get-stream membalas HTTP 500), yang cocok
 * dengan kanal-kanal itu diganti di sisi NVR.
 *
 * Ketiganya diuji langsung sebelum dipasang, 5 detik per GUID:
 *   visitor  → 436.912 byte, byte pertama 1.674 ms, video 640x360
 *   heatmap  → 387.280 byte, byte pertama    32 ms, video 640x360
 *   antrian  → 502.524 byte, byte pertama 1.630 ms, video 640x360
 * dan kanal AI-nya (30 detik per kanal, satu koneksi pada satu waktu):
 *   visitor  → 224 pesan, acuan 640x360, ada garis hitung
 *   heatmap  → 154 pesan, acuan 1920x1080, tanpa garis/zona
 *   antrian  → 231 pesan, acuan 1920x1080, ada poligon zona antrian
 *
 * Perhatikan acuan AI TIDAK selalu sama dengan resolusi video (heatmap & antrian
 * mengirim koordinat dalam ruang 1920x1080 untuk video 640x360). Overlay menskala
 * memakai `ref` dari pesan init, bukan ukuran video — jangan disederhanakan.
 *
 * `heatmap` dan `antrian` adalah DUA KANAL AI DARI KAMERA FISIK YANG SAMA, jadi
 * gambarnya identik. Sejak 2026-08-03 hanya `antrian` yang ditonton: satu entri
 * di daftar, dengan nama yang menyebut kedua fungsinya. Kanal heatmap tetap
 * terdaftar karena GUID-nya masih dipakai menarik gambar riwayat untuk kartu
 * Heatmap (lihat cctv-heatmap.ts), tapi ditandai `historyOnly` supaya tidak ikut
 * muncul sebagai pilihan tontonan — menonton keduanya berarti dua aliran video
 * dan dua koneksi wsai untuk pemandangan yang sama persis.
 */
export const NVR_CAMERAS: Record<string, NvrCamera> = {
  visitor: { guid: "acd19678a2069693aec0", name: "Kamera 1 — Booth Kamera 1", mode: "counting" },
  antrian: {
    guid: "acd19678a2049693611e",
    name: "Kamera 2 — Booth Kamera 2",
    mode: "queue",
  },
  heatmap: {
    guid: "acd19678a21e969320a6",
    name: "Kamera 2 — Heatmap",
    mode: "heatmap",
    historyOnly: true,
  },
};

/** Kamera yang boleh ditonton. Yang `historyOnly` sengaja tidak ikut. */
export function listNvrCameras(): CctvCamera[] {
  return Object.entries(NVR_CAMERAS)
    .filter(([, cam]) => !cam.historyOnly)
    .map(([id, cam]) => ({ id, name: cam.name, mode: cam.mode }));
}

// ─── Konfigurasi ─────────────────────────────────────────────────────────
// Dibaca di dalam fungsi, bukan di lingkup modul: nilai lingkup modul ikut
// terbaca saat `next build` mengumpulkan route, bukan saat request berjalan.

function nvrConfig() {
  const host = process.env.NVR_HOST;
  const username = process.env.NVR_USERNAME;
  const password = process.env.NVR_PASSWORD;

  if (!host || !username || !password) {
    throw new NvrError(
      "NVR belum dikonfigurasi — isi NVR_HOST, NVR_USERNAME, dan NVR_PASSWORD di .env.local",
      500
    );
  }
  return { host, port: Number(process.env.NVR_PORT ?? 443), username, password };
}

const REQUEST_TIMEOUT_MS = 8_000;

function nvrRequest(
  cfg: { host: string; port: number },
  opts: { path: string; method?: string; headers?: Record<string, string>; body?: string }
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: cfg.host,
        port: cfg.port,
        path: opts.path,
        method: opts.method ?? "GET",
        headers: opts.headers ?? {},
        rejectUnauthorized: false, // sertifikat self-signed, jaringan lokal
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => resolve({ status: res.statusCode ?? 0, body: data }));
      }
    );

    // Tanpa ini, NVR yang tidak menjawab membuat request dashboard menggantung
    // sampai timeout default Node (2 menit).
    req.setTimeout(REQUEST_TIMEOUT_MS, () => {
      req.destroy(new NvrError(`NVR ${cfg.host} tidak merespons dalam ${REQUEST_TIMEOUT_MS / 1000}s`, 504));
    });

    req.on("error", (err) => reject(err instanceof NvrError ? err : new NvrError(err.message)));
    if (opts.body) req.write(opts.body);
    req.end();
  });
}

function parseJson(text: string): Record<string, unknown> | null {
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return null;
  }
}

// ─── Token login ─────────────────────────────────────────────────────────
// Contoh aslinya login ulang setiap kali Play ditekan. Di dashboard ini satu
// halaman bisa memutar beberapa kamera dan tiap token stream mati ~1 jam, jadi
// token disimpan di memori proses supaya tidak login berkali-kali.
//
// TTL login tidak diberitahu NVR, jadi dipakai angka konservatif; kalau ternyata
// token sudah mati lebih dulu, getStreamUrl() akan login ulang sekali (lihat
// mekanisme retry di bawah).

const TOKEN_TTL_MS = 30 * 60_000;

let tokenCache: { token: string; expiresAtMs: number } | null = null;

async function getAccessToken(forceRefresh = false): Promise<string> {
  const cfg = nvrConfig();

  if (!forceRefresh && tokenCache && tokenCache.expiresAtMs > Date.now()) {
    return tokenCache.token;
  }

  const body = new URLSearchParams({ username: cfg.username, password: cfg.password }).toString();
  const { status, body: raw } = await nvrRequest(cfg, {
    path: "/index.php?r=api%2Flogin%2Findex",
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": String(Buffer.byteLength(body)),
    },
    body,
  });

  const json = parseJson(raw);
  const data = json?.data as { access_token?: string } | undefined;
  if (status !== 200 || json?.status !== "success" || !data?.access_token) {
    throw new NvrError(String(json?.message ?? `Login NVR gagal (HTTP ${status})`));
  }

  tokenCache = { token: data.access_token, expiresAtMs: Date.now() + TOKEN_TTL_MS };
  return data.access_token;
}

// ─── URL stream ──────────────────────────────────────────────────────────
//
// BATASAN NVR (hasil probe langsung, bukan dugaan): akun ini hanya boleh punya
// SATU token stream aktif. Setiap panggilan get-stream membatalkan token yang
// diterbitkan sebelumnya — bahkan untuk kamera yang sama, dan bahkan bila
// diminta dari sesi login yang berbeda.
//
// Karena itu URL stream SENGAJA TIDAK di-cache: URL yang disimpan hampir pasti
// sudah mati saat dipakai lagi, dan menyajikannya ulang hanya menghasilkan
// "token not found". Selalu terbitkan yang baru.
//
// Kabar baiknya, token hanya diperiksa SAAT KONEKSI DIBUKA. Koneksi yang sudah
// mengalir tetap hidup walau tokennya dibatalkan — terbukti tiga kamera mengalir
// bersamaan. Syaratnya pemanggil harus membuka koneksinya BERURUTAN: terbitkan
// URL, sambungkan sampai byte mengalir, baru lanjut ke kamera berikutnya.

async function fetchStream(guid: string, token: string) {
  const cfg = nvrConfig();
  const { status, body: raw } = await nvrRequest(cfg, {
    path: `/index.php?r=api%2Fcamera%2Fget-stream&guid=${encodeURIComponent(guid)}`,
    headers: { Authorization: `Bearer ${token}` },
  });

  const json = parseJson(raw);
  const data = json?.data as { url_stream?: string; expired?: number } | undefined;
  if (status !== 200 || json?.status !== "success" || !data?.url_stream) {
    throw new NvrError(String(json?.message ?? `Get-stream gagal (HTTP ${status})`));
  }
  return data;
}

/**
 * Terbitkan URL stream baru untuk satu kamera.
 *
 * Umur pakainya sangat pendek: valid hanya sampai ada get-stream berikutnya
 * (lihat catatan batasan di atas). Pemanggil wajib langsung menyambungkannya,
 * dan menerbitkan ulang bila stream membalas 404 "token not found".
 */
export async function getStreamUrl(cameraId: string, profile = DEFAULT_STREAM_PROFILE): Promise<CctvStreamUrl> {
  const camera = NVR_CAMERAS[cameraId];
  if (!camera) throw new NvrError(`Kamera "${cameraId}" tidak terdaftar`, 404);

  let data;
  try {
    data = await fetchStream(camera.guid, await getAccessToken());
  } catch (err) {
    // Kemungkinan besar token sudah mati lebih cepat dari TTL tebakan kita —
    // login ulang sekali sebelum menyerah.
    if (err instanceof NvrError && err.status === 502) {
      data = await fetchStream(camera.guid, await getAccessToken(true));
    } else {
      throw err;
    }
  }

  // `expired` dari NVR berupa unix detik; dijaga kalau suatu saat jadi milidetik.
  // Catatan: ini batas ATAS (±1 jam). Token biasanya mati jauh lebih cepat, yaitu
  // begitu ada get-stream berikutnya — jadi jangan diperlakukan sebagai jaminan.
  const expiresAtMs = data.expired
    ? data.expired > 1e12
      ? data.expired
      : data.expired * 1000
    : null;

  return toStreamUrl(cameraId, camera.name, data.url_stream!, expiresAtMs, profile);
}

function toStreamUrl(
  cameraId: string,
  name: string,
  baseUrl: string,
  expiresAtMs: number | null,
  profile: string
): CctvStreamUrl {
  return {
    cameraId,
    name,
    url: withProfile(baseUrl, profile),
    protocol: "mpegts",
    profile,
    expiresAt: expiresAtMs ? new Date(expiresAtMs).toISOString() : null,
  };
}

// ─── Membuka stream dari sisi server (proxy) ─────────────────────────────

/**
 * Antrean satu-per-satu untuk pasangan "terbitkan token → buka koneksi".
 *
 * Inilah yang membuat batasan satu-token-aktif tidak lagi jadi masalah: selama
 * kedua langkah itu tidak pernah disela permintaan lain, token selalu masih yang
 * terbaru saat dipakai. Begitu koneksi terbuka, token boleh dibatalkan siapa pun
 * — aliran yang sudah jalan tidak ikut mati.
 */
let openQueue: Promise<unknown> = Promise.resolve();

function serialize<T>(fn: () => Promise<T>): Promise<T> {
  const run = openQueue.then(fn, fn);
  openQueue = run.catch(() => undefined);
  return run;
}

function httpsGet(url: string): Promise<import("node:http").IncomingMessage> {
  const u = new URL(url);
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: u.hostname,
        port: u.port ? Number(u.port) : 443,
        path: u.pathname + u.search,
        rejectUnauthorized: false,
      },
      (res) => {
        if (res.statusCode !== 200) {
          res.resume();
          reject(new NvrError(`Stream membalas HTTP ${res.statusCode}`, 502));
          return;
        }
        resolve(res);
      }
    );
    req.setTimeout(REQUEST_TIMEOUT_MS, () => req.destroy(new NvrError("Stream tidak merespons", 504)));
    req.on("error", (err) => reject(err instanceof NvrError ? err : new NvrError(err.message)));
    req.end();
  });
}

/**
 * Buka aliran MPEG-TS satu kamera dari server. Yang dikembalikan adalah respons
 * mentah dari NVR, siap disalurkan ke browser.
 */
export function openCameraStream(
  cameraId: string,
  profile = DEFAULT_STREAM_PROFILE
): Promise<import("node:http").IncomingMessage> {
  return serialize(async () => {
    const { url } = await getStreamUrl(cameraId, profile);
    return httpsGet(url);
  });
}

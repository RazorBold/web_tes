// Heatmap: menemukan gambar baru dari NVR, merendernya di LATAR, menyimpan
// berkasnya ke disk, lalu menyajikan daftar yang sudah jadi. HANYA UNTUK SERVER.
//
// Kenapa dirender di latar, bukan saat kartu dibuka — ini terukur, bukan selera:
//   ambil titik deteksi : 2.317 ms rata-rata (sampai 7,9 detik saat ramai)
//   ambil gambar asli   :    28 ms
//   render gaussian     :   268 ms
// Yang mahal adalah menunggu NVR mengirim titiknya, dan gambar historis tidak
// pernah berubah. Merender saat dilihat berarti tiap penonton membayar ongkos
// yang sama untuk hasil yang persis sama.
//
// Berkas gambar disimpan di data/heatmap/, bukan di MySQL: satu frame ±253 KB
// × ±320 frame/hari ≈ 81 MB/hari, sementara seluruh database saat ini 82 MB.

import { mkdir, writeFile, unlink, readdir } from "node:fs/promises";
import path from "node:path";
import { query } from "@/lib/db";
import {
  listSnapshotPaths,
  fetchSnapshot,
  getDetectionBoxes,
  parseImagePathTime,
  NVR_CHANNELS,
  HistoryApiError,
} from "@/lib/cctv-history";
import { NVR_CAMERAS } from "@/lib/cctv-nvr";
import { renderHeatmap, boxToFootPoint } from "@/lib/heatmap-render";
import { RETENTION_DAYS } from "@/config/retention";

const CAMERA_ID = "heatmap";
const IMAGE_CHANNEL = NVR_CHANNELS.heatmap;
const DETECT_CHANNEL = NVR_CHANNELS.heatmapDetect;

/** Jendela titik deteksi sebelum jam gambar. */
const WINDOW_SEC = 120;
/** Sekali pelebaran saat jendela sempit tak menemukan siapa pun. */
const WIDEN_FACTOR = 3;
/** Sejauh mana ke belakang gambar baru dicari tiap putaran. */
const SCAN_HOURS = 6;
/** Batas frame yang dirender per putaran, supaya satu panggilan tidak berlarut. */
const RENDER_BATCH = 4;

export const HEATMAP_DIR = path.join(process.cwd(), "data", "heatmap");

export interface HeatmapFrame {
  id: number;
  capturedAt: string;
  status: "pending" | "rendered" | "empty" | "failed";
  points: number;
  windowSec: number;
  widened: boolean;
  bytes: number;
  error: string | null;
}

const pad = (n: number) => String(n).padStart(2, "0");
const sqlDateTime = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}:${pad(d.getSeconds())}`;
const sqlDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// ─── Penemuan frame baru ─────────────────────────────────────────────────

/**
 * Catat gambar yang belum pernah dilihat sebagai frame `pending`.
 * Murah: hanya memanggil list-image (terukur 15 ms) dan menulis baris kecil.
 */
async function discoverFrames(): Promise<number> {
  const camera = NVR_CAMERAS[CAMERA_ID];
  if (!camera) throw new Error(`Kamera "${CAMERA_ID}" tidak terdaftar`);

  const end = new Date();
  const start = new Date(end.getTime() - SCAN_HOURS * 3600_000);
  const paths = await listSnapshotPaths(camera.guid, IMAGE_CHANNEL, start, end, "ori_image");
  if (!paths.length) return 0;

  const values: unknown[] = [];
  const rows: string[] = [];
  const now = sqlDateTime(new Date());

  for (const p of paths) {
    const at = parseImagePathTime(p);
    if (!at) continue;
    values.push(CAMERA_ID, IMAGE_CHANNEL, DETECT_CHANNEL, sqlDate(at), sqlDateTime(at), p, now);
    rows.push("(?,?,?,?,?,?,?)");
  }
  if (!rows.length) return 0;

  // INSERT IGNORE, bukan upsert: baris yang sudah ada mungkin sudah berstatus
  // 'rendered' dan tidak boleh dikembalikan jadi 'pending'.
  await query(
    `INSERT IGNORE INTO cctv_heatmap_frames
       (camera_id, image_channel, detect_channel, day, captured_at, imgpath, updated_at)
     VALUES ${rows.join(",")}`,
    values
  );
  return rows.length;
}

// ─── Render ──────────────────────────────────────────────────────────────

interface PendingRow {
  id: number;
  imgpath: string;
  captured_at: Date;
}

async function renderOne(row: PendingRow): Promise<void> {
  const camera = NVR_CAMERAS[CAMERA_ID];
  if (!camera) throw new Error(`Kamera "${CAMERA_ID}" tidak terdaftar`);

  const t0 = Date.now();
  const end = row.captured_at;

  try {
    // Gambar dan titik diambil paralel — keduanya tidak saling bergantung.
    let windowSec = WINDOW_SEC;
    let widened = false;
    const [baseJpeg, firstBoxes] = await Promise.all([
      fetchSnapshot(camera.guid, row.imgpath),
      getDetectionBoxes(
        camera.guid,
        DETECT_CHANNEL,
        new Date(end.getTime() - windowSec * 1000),
        end
      ),
    ]);

    const orang = (list: typeof firstBoxes) =>
      list.filter((d) => !d.label || /person/i.test(d.label)).map(boxToFootPoint);

    let points = orang(firstBoxes);

    // Jendela sempit sering benar-benar kosong karena ruangan sepi. Sekali
    // dicoba lebih lebar sebelum menyerah — kalau tetap kosong, itu memang
    // tidak ada orang, bukan kegagalan.
    if (!points.length) {
      const wide = windowSec * WIDEN_FACTOR;
      const retry = await getDetectionBoxes(
        camera.guid,
        DETECT_CHANNEL,
        new Date(end.getTime() - wide * 1000),
        end
      );
      const retryPoints = orang(retry);
      if (retryPoints.length) {
        points = retryPoints;
        windowSec = wide;
        widened = true;
      }
    }

    const { full, thumb } = await renderHeatmap(baseJpeg, points);

    await mkdir(HEATMAP_DIR, { recursive: true });
    const namaDasar = `${CAMERA_ID}-${row.id}`;
    const fullFile = `${namaDasar}.jpg`;
    const thumbFile = `${namaDasar}-thumb.jpg`;
    await writeFile(path.join(HEATMAP_DIR, fullFile), full);
    await writeFile(path.join(HEATMAP_DIR, thumbFile), thumb);

    await query(
      `UPDATE cctv_heatmap_frames
       SET status = ?, points = ?, window_sec = ?, widened = ?,
           thumb_file = ?, full_file = ?, bytes = ?, error = NULL,
           render_ms = ?, updated_at = ?
       WHERE id = ?`,
      [
        points.length ? "rendered" : "empty",
        points.length,
        windowSec,
        widened,
        thumbFile,
        fullFile,
        full.length + thumb.length,
        Date.now() - t0,
        sqlDateTime(new Date()),
        row.id,
      ]
    );
  } catch (err) {
    await query(
      `UPDATE cctv_heatmap_frames
       SET status = 'failed', error = ?, render_ms = ?, updated_at = ?
       WHERE id = ?`,
      [
        (err instanceof Error ? err.message : "gagal render").slice(0, 250),
        Date.now() - t0,
        sqlDateTime(new Date()),
        row.id,
      ]
    );
  }
}

/**
 * Satu putaran latar: temukan gambar baru, lalu render sebagian yang tertunda.
 *
 * Dijaga agar hanya satu putaran berjalan pada satu waktu. Tanpa itu, penjadwal
 * dan pembukaan kartu bisa memicu render untuk frame yang sama bersamaan, dan
 * keduanya sama-sama menarik payload deteksi yang berat dari NVR.
 */
let sedangJalan = false;
/** Pemangkasan cukup sekali sejam; menjalankannya tiap putaran hanya membebani
 *  disk dengan pemeriksaan yang hampir selalu tidak menemukan apa-apa. */
let pangkasTerakhir = 0;
const PRUNE_INTERVAL_MS = 60 * 60_000;

export async function processHeatmapQueue(): Promise<{ found: number; rendered: number }> {
  if (sedangJalan) return { found: 0, rendered: 0 };
  sedangJalan = true;
  try {
    if (Date.now() - pangkasTerakhir > PRUNE_INTERVAL_MS) {
      pangkasTerakhir = Date.now();
      // Retensi sama dengan data sensor, dari satu sumber angka yang sama.
      await pruneHeatmap(RETENTION_DAYS).catch(() => 0);
    }

    const found = await discoverFrames();

    const pending = await query<PendingRow>(
      `SELECT id, imgpath, captured_at
       FROM cctv_heatmap_frames
       WHERE camera_id = ? AND status IN ('pending','failed')
       ORDER BY captured_at DESC
       LIMIT ?`,
      [CAMERA_ID, RENDER_BATCH]
    );

    for (const row of pending) await renderOne(row);
    return { found, rendered: pending.length };
  } finally {
    sedangJalan = false;
  }
}

// ─── Pembacaan ───────────────────────────────────────────────────────────

export async function listHeatmapFrames(limit = 12): Promise<HeatmapFrame[]> {
  const rows = await query<{
    id: number;
    captured_at: Date;
    status: HeatmapFrame["status"];
    points: number;
    window_sec: number;
    widened: number;
    bytes: number;
    error: string | null;
  }>(
    `SELECT id, captured_at, status, points, window_sec, widened, bytes, error
     FROM cctv_heatmap_frames
     WHERE camera_id = ? AND status IN ('rendered','empty')
     ORDER BY captured_at DESC
     LIMIT ?`,
    [CAMERA_ID, limit]
  );

  return rows.map((r) => ({
    id: Number(r.id),
    capturedAt: r.captured_at.toISOString(),
    status: r.status,
    points: Number(r.points),
    windowSec: Number(r.window_sec),
    widened: Boolean(r.widened),
    bytes: Number(r.bytes),
    error: r.error,
  }));
}

export async function getFrameFile(id: number, size: "thumb" | "full"): Promise<string | null> {
  const [row] = await query<{ thumb_file: string | null; full_file: string | null }>(
    "SELECT thumb_file, full_file FROM cctv_heatmap_frames WHERE camera_id = ? AND id = ?",
    [CAMERA_ID, id]
  );
  const nama = size === "thumb" ? row?.thumb_file : row?.full_file;
  // Nama berkas dibentuk sendiri saat render, tapi tetap diperiksa: berkas yang
  // dilayani ke publik tidak boleh bisa diarahkan keluar direktori ini.
  if (!nama || !/^[\w.-]+\.jpg$/.test(nama)) return null;
  return path.join(HEATMAP_DIR, nama);
}

/**
 * Buang frame lama beserta berkasnya, mengikuti kebijakan retensi yang sama
 * dengan data sensor. Berkas dihapus lebih dulu, baru barisnya — kalau urutannya
 * dibalik, berkas yang barisnya sudah hilang tak akan pernah ada yang menghapus.
 */
export async function pruneHeatmap(days: number): Promise<number> {
  const lama = await query<{ id: number; thumb_file: string | null; full_file: string | null }>(
    `SELECT id, thumb_file, full_file FROM cctv_heatmap_frames
     WHERE camera_id = ? AND captured_at < (NOW() - INTERVAL ? DAY)`,
    [CAMERA_ID, days]
  );
  if (!lama.length) return 0;

  for (const r of lama) {
    for (const nama of [r.thumb_file, r.full_file]) {
      if (!nama || !/^[\w.-]+\.jpg$/.test(nama)) continue;
      await unlink(path.join(HEATMAP_DIR, nama)).catch(() => undefined);
    }
  }
  await query(
    `DELETE FROM cctv_heatmap_frames WHERE camera_id = ? AND captured_at < (NOW() - INTERVAL ? DAY)`,
    [CAMERA_ID, days]
  );
  return lama.length;
}

/** Berkas yang tercecer di disk tanpa baris di database (mis. sisa render gagal). */
export async function countOrphanFiles(): Promise<number> {
  const files = await readdir(HEATMAP_DIR).catch(() => [] as string[]);
  if (!files.length) return 0;
  const rows = await query<{ n: number }>(
    "SELECT COUNT(*) AS n FROM cctv_heatmap_frames WHERE camera_id = ?",
    [CAMERA_ID]
  );
  return Math.max(0, files.length - Number(rows[0]?.n ?? 0) * 2);
}

export { HistoryApiError };

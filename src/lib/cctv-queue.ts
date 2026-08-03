// Antrian / People Crowded: menarik sampel zona dari NVR, menyimpannya, lalu
// menyajikan akumulasi harian. HANYA UNTUK SERVER.
//
// Sama seperti modul visitor, alasan menyimpan sendiri adalah karena API NVR
// hanya menyimpan HARI BERJALAN.
//
// Bedanya dengan visitor: channel ini tidak melaporkan individu, melainkan
// KEADAAN ZONA tiap ~30 detik (±650 sampel/hari). Jadi satu baris = satu sampel,
// dan "akumulasi harian" berarti menghitung berapa banyak sampel yang jatuh di
// tiap ukuran kerumunan — bukan menjumlahkan orang.

import { query } from "@/lib/db";
import { getQueueSamples, listSnapshotPaths, NVR_CHANNELS } from "@/lib/cctv-history";
import { NVR_CAMERAS } from "@/lib/cctv-nvr";

const CAMERA_ID = "antrian";
const CHANNEL_ID = NVR_CHANNELS.antrian;
const SYNC_INTERVAL_MS = 20_000;

/**
 * Batas ukuran kerumunan, mengikuti kartu People Crowded yang sudah ada.
 * Ditulis sebagai rentang tertutup supaya label dan hitungan tidak bisa
 * berselisih — keduanya dibaca dari daftar yang sama.
 */
export const CROWD_BUCKETS = [
  { key: "1-5", label: "1 - 5", min: 1, max: 5 },
  { key: "6-10", label: "6 - 10", min: 6, max: 10 },
  { key: ">10", label: "> 10", min: 11, max: Number.MAX_SAFE_INTEGER },
] as const;

export interface CrowdBucketCount {
  key: string;
  label: string;
  /** Banyaknya SAMPEL yang puncaknya jatuh di rentang ini sepanjang hari. */
  count: number;
}

export interface QueueOverview {
  date: string;
  buckets: CrowdBucketCount[];
  /** Jumlah sampel yang memuat minimal satu orang. */
  totalCrowded: number;
  /** Seluruh sampel hari ini, termasuk yang zonanya kosong. */
  totalSamples: number;
  /** Orang terbanyak yang pernah serentak di zona hari ini. */
  peakPeople: number;
  peakAt: string | null;
  /** Detik. */
  longestStay: number;
  avgStay: number;
  /** Keadaan sampel terbaru. */
  currentPeople: number | null;
  lastSampleAt: string | null;
  lastSyncAt: string | null;
}

export interface QueueSample {
  time: string;
  people: number;
  current: number;
  occupancy: number;
  avgStay: number;
  maxStay: number;
  imagePath: string | null;
}

const pad = (n: number) => String(n).padStart(2, "0");
const sqlDateTime = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}:${pad(d.getSeconds())}`;
const sqlDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/**
 * Tarik sampel hari ini beserta path gambar buktinya, lalu simpan.
 *
 * Menarik SEHARI PENUH tiap kali, dengan alasan yang sama seperti modul visitor:
 * penarikan jadi memperbaiki dirinya sendiri bila proses sempat mati. Ongkosnya
 * murah — ±650 sampel/hari.
 */
export async function syncQueueToday(): Promise<{ samples: number }> {
  const camera = NVR_CAMERAS[CAMERA_ID];
  if (!camera) throw new Error(`Kamera "${CAMERA_ID}" tidak terdaftar`);

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const [samples, paths] = await Promise.all([
    getQueueSamples(camera.guid, CHANNEL_ID, startOfDay, now),
    // Gambar bukti channel ini bertipe `max_image`, bukan `image`.
    listSnapshotPaths(camera.guid, CHANNEL_ID, startOfDay, now, "max_image").catch(() => [] as string[]),
  ]);

  const byBasename = new Map(paths.map((p) => [p.split("/").pop()?.replace(/\.jpg$/i, "") ?? "", p]));

  if (samples.length) {
    const day = sqlDate(now);
    const updatedAt = sqlDateTime(now);
    const values: unknown[] = [];
    const placeholders = samples
      .map((s) => {
        const file = String(s.file ?? "");
        values.push(
          CAMERA_ID, CHANNEL_ID, day, sqlDateTime(new Date(s.time * 1000)),
          file, byBasename.get(file) ?? null,
          Math.round(s.current ?? 0), Math.round(s.max_detection ?? 0), s.ocupancy ?? 0,
          s.avg_stay ?? 0, s.max_stay_time ?? 0, updatedAt
        );
        return "(?,?,?,?,?,?,?,?,?,?,?,?)";
      })
      .join(",");

    await query(
      `INSERT INTO cctv_queue_samples
         (camera_id, channel_id, day, sampled_at, file, image_path,
          current_count, max_detection, occupancy, avg_stay_s, max_stay_s, updated_at)
       VALUES ${placeholders}
       ON DUPLICATE KEY UPDATE
         image_path = VALUES(image_path),
         current_count = VALUES(current_count),
         max_detection = VALUES(max_detection),
         occupancy = VALUES(occupancy),
         avg_stay_s = VALUES(avg_stay_s),
         max_stay_s = VALUES(max_stay_s),
         updated_at = VALUES(updated_at)`,
      values
    );
  }

  await query(
    `INSERT INTO cctv_sync_state (camera_id, channel_id, last_sync_at, last_event_at, tracks_total)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       last_sync_at = VALUES(last_sync_at),
       last_event_at = VALUES(last_event_at),
       tracks_total = VALUES(tracks_total)`,
    [
      CAMERA_ID,
      CHANNEL_ID,
      sqlDateTime(now),
      samples.length ? sqlDateTime(new Date(Math.max(...samples.map((s) => s.time)) * 1000)) : null,
      samples.length,
    ]
  );

  return { samples: samples.length };
}

export async function ensureQueueFresh(): Promise<void> {
  const rows = await query<{ last_sync_at: Date }>(
    "SELECT last_sync_at FROM cctv_sync_state WHERE camera_id = ?",
    [CAMERA_ID]
  );
  const last = rows[0]?.last_sync_at;
  if (last && Date.now() - last.getTime() < SYNC_INTERVAL_MS) return;
  await syncQueueToday();
}

// ─── Pembacaan ───────────────────────────────────────────────────────────

export async function getQueueOverview(): Promise<QueueOverview> {
  const today = sqlDate(new Date());

  // Satu query agregat, bukan menarik 650 baris lalu menghitung di JS.
  const [agg] = await query<{
    total: number;
    crowded: number;
    puncak: number;
    tunggu_terlama: number;
    tunggu_rata: number;
  }>(
    `SELECT COUNT(*) AS total,
            SUM(max_detection >= 1) AS crowded,
            COALESCE(MAX(max_detection), 0) AS puncak,
            COALESCE(MAX(max_stay_s), 0) AS tunggu_terlama,
            COALESCE(AVG(NULLIF(avg_stay_s, 0)), 0) AS tunggu_rata
     FROM cctv_queue_samples WHERE camera_id = ? AND day = ?`,
    [CAMERA_ID, today]
  );

  const bucketRows = await query<{ bucket: string; jumlah: number }>(
    `SELECT CASE
              WHEN max_detection BETWEEN 1 AND 5  THEN '1-5'
              WHEN max_detection BETWEEN 6 AND 10 THEN '6-10'
              WHEN max_detection > 10             THEN '>10'
            END AS bucket,
            COUNT(*) AS jumlah
     FROM cctv_queue_samples
     WHERE camera_id = ? AND day = ? AND max_detection >= 1
     GROUP BY bucket`,
    [CAMERA_ID, today]
  );
  const byKey = new Map(bucketRows.map((r) => [r.bucket, Number(r.jumlah)]));

  const [puncakRow] = await query<{ sampled_at: Date }>(
    `SELECT sampled_at FROM cctv_queue_samples
     WHERE camera_id = ? AND day = ? AND max_detection = ?
     ORDER BY sampled_at ASC LIMIT 1`,
    [CAMERA_ID, today, Number(agg?.puncak ?? 0)]
  );

  const [terbaru] = await query<{ sampled_at: Date; current_count: number }>(
    `SELECT sampled_at, current_count FROM cctv_queue_samples
     WHERE camera_id = ? AND day = ? ORDER BY sampled_at DESC LIMIT 1`,
    [CAMERA_ID, today]
  );

  const [state] = await query<{ last_sync_at: Date }>(
    "SELECT last_sync_at FROM cctv_sync_state WHERE camera_id = ?",
    [CAMERA_ID]
  );

  return {
    date: today,
    buckets: CROWD_BUCKETS.map((b) => ({ key: b.key, label: b.label, count: byKey.get(b.key) ?? 0 })),
    totalCrowded: Number(agg?.crowded ?? 0),
    totalSamples: Number(agg?.total ?? 0),
    peakPeople: Number(agg?.puncak ?? 0),
    peakAt: puncakRow?.sampled_at?.toISOString() ?? null,
    longestStay: Number(agg?.tunggu_terlama ?? 0),
    avgStay: Number(agg?.tunggu_rata ?? 0),
    currentPeople: terbaru ? Number(terbaru.current_count) : null,
    lastSampleAt: terbaru?.sampled_at?.toISOString() ?? null,
    lastSyncAt: state?.last_sync_at?.toISOString() ?? null,
  };
}

/**
 * Sampel terbaru yang benar-benar memuat orang, untuk panel bukti.
 *
 * Sampel dengan zona kosong sengaja disaring: separuh lebih sampel harian
 * berisi nol orang, dan menampilkannya berarti memenuhi panel dengan foto
 * ruangan kosong.
 */
export async function getQueueSamplesWithImages(limit = 40): Promise<QueueSample[]> {
  const rows = await query<{
    sampled_at: Date;
    max_detection: number;
    current_count: number;
    occupancy: number;
    avg_stay_s: number;
    max_stay_s: number;
    image_path: string | null;
  }>(
    `SELECT sampled_at, max_detection, current_count, occupancy, avg_stay_s, max_stay_s, image_path
     FROM cctv_queue_samples
     WHERE camera_id = ? AND day = CURDATE() AND max_detection >= 1
     ORDER BY sampled_at DESC LIMIT ?`,
    [CAMERA_ID, limit]
  );

  return rows.map((r) => ({
    time: r.sampled_at.toISOString(),
    people: Number(r.max_detection),
    current: Number(r.current_count),
    occupancy: Number(r.occupancy),
    avgStay: Number(r.avg_stay_s),
    maxStay: Number(r.max_stay_s),
    imagePath: r.image_path,
  }));
}

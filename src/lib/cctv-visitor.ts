// Visitor Counting: menarik event dari NVR, meringkasnya per orang, menyimpan
// ke MySQL, lalu menyajikan angka siap tampil. HANYA UNTUK SERVER.
//
// Kenapa disimpan sendiri: API NVR hanya menyimpan data HARI BERJALAN — semua
// hari sebelumnya membalas 0 entri (sudah diuji sampai 5 hari ke belakang).
// Tanpa salinan di sini, tidak ada tren harian yang bisa ditampilkan sama
// sekali, dan data hari ini hilang begitu lewat tengah malam.

import { query } from "@/lib/db";
import {
  getVisitorEvents, listSnapshotPaths, NVR_CHANNELS, type VisitorEvent,
} from "@/lib/cctv-history";
import { NVR_CAMERAS } from "@/lib/cctv-nvr";

const CAMERA_ID = "visitor";
const CHANNEL_ID = NVR_CHANNELS.visitor;

/**
 * Selang minimum antar penarikan dari NVR.
 *
 * Angkanya menentukan seberapa "hidup" kartu terasa, jadi dipilih dari
 * pengukuran, bukan dikira-kira:
 *   • REST API NVR sendiri tertinggal 6–58 detik dari kejadian (rata-rata ~25s)
 *   • satu penarikan = 1 permintaan, ~100 KB, ~70 ms
 *
 * Pada 10 detik, penundaan yang dirasakan ≈ 10s (data basi) + 5s (jeda polling
 * UI) + ~25s (bawaan NVR). Sisa terbesarnya adalah keterlambatan NVR sendiri,
 * yang di luar kendali kita — menekan angka ini lebih jauh hampir tidak terasa
 * sementara ongkosnya naik terus, karena penarikan mengambil SEHARI PENUH
 * sehingga payload-nya membesar sepanjang hari.
 */
const SYNC_INTERVAL_MS = 10_000;

/**
 * Berapa lama tanpa event baru sebelum seseorang dianggap tidak lagi di depan
 * kamera. Hanya dipakai untuk angka `active` — bukan untuk menahan penghitungan.
 */
const ACTIVE_WINDOW_MINUTES = 2;

/**
 * CATATAN PENTING soal ketiga kelompok (masuk / keluar / bolak-balik).
 *
 * Ketiganya membagi habis SATU populasi yang sama: masuk + keluar + bolak-balik
 * selalu sama dengan jumlah orang unik hari itu. Arah seseorang diturunkan dari
 * selisih bersih masuk−keluar, dan selisih itu memang BERUBAH selama orangnya
 * masih bolak-balik di depan garis.
 *
 * Jadi angka "masuk" bisa berkurang — dan itu BUKAN kesalahan: satu orang
 * berpindah kelompok, totalnya tidak berubah. Sempat dicoba membekukan arah
 * setelah dua menit supaya angkanya monoton, tapi itu menyembunyikan perpindahan
 * yang justru ingin dilihat, dan menukarnya dengan keterlambatan dua menit.
 *
 * Syaratnya cuma satu: KETIGA ANGKA HARUS TAMPIL BERDAMPINGAN. Kalau hanya
 * masuk & keluar yang tampil, perpindahan ke bolak-balik terbaca seperti angka
 * yang hilang begitu saja.
 */

export interface VisitorHourly {
  hour: number;
  in: number;
  out: number;
  total: number;
}

export interface VisitorOverview {
  date: string;
  /** Orang yang masih bergerak di depan kamera; belum ikut dihitung (lihat
   *  SETTLE_MS). Ditampilkan supaya jelas kenapa angka bisa tertinggal sedikit. */
  active: number;
  /** Jumlah orang berbeda yang melintas — angka paling kokoh dari feed ini. */
  uniqueVisitors: number;
  /** Pembagian arah memakai selisih bersih per orang (lihat catatan di bawah). */
  in: number;
  out: number;
  /** Orang yang melintasi garis bolak-balik tanpa arah bersih (berdiri di garis). */
  lingering: number;
  netFlow: number;
  hourly: VisitorHourly[];
  busiestHour: number | null;
  /** Jumlah event mentah — hanya untuk transparansi, JANGAN dipakai sebagai
   *  jumlah orang; angkanya menggelembung oleh getaran di garis. */
  rawEvents: number;
  /** Perubahan terhadap HARI KEMARIN, dalam persen. `null` bila kemarin belum
   *  ada datanya — dan itu wajar di hari-hari pertama, karena riwayat harian
   *  baru terbentuk sejak tabel ini mulai diisi. Jangan diganti 0: 0 berarti
   *  "tidak berubah", bukan "belum tahu". */
  trendInPct: number | null;
  trendOutPct: number | null;
  lastSyncAt: string | null;
  lastEventAt: string | null;
}

export interface VisitorDay {
  date: string;
  uniqueVisitors: number;
  in: number;
  out: number;
}

/** Satu lintasan orang, lengkap dengan cuplikan gambarnya. */
export interface VisitorHit {
  trackId: string;
  /** Waktu lintasan pertama orang ini (ISO). */
  time: string;
  /** Arah bersih; "lingering" untuk yang bolak-balik tanpa arah jelas. */
  direction: "in" | "out" | "lingering";
  label: string;
  /** Jumlah event mentah orang ini — >1 berarti sempat bolak-balik di garis. */
  crossings: number;
  /** Path relatif gambar di NVR; diambil lewat route proxy kita. */
  imagePath: string | null;
}

/**
 * Lintasan terbaru beserta gambarnya, untuk panel pemantauan.
 *
 * Diambil LANGSUNG dari NVR, bukan dari MySQL: panel ini untuk memantau detik
 * demi detik, sementara tabel kita menyimpan ringkasan harian dan sengaja
 * membuang kolom `file` yang justru dibutuhkan untuk mencocokkan gambar.
 *
 * Pencocokan gambar memakai kolom `file` pada event, yang persis sama dengan
 * nama berkas gambarnya ("140746349" → ".../image/140746349.jpg"). Sudah diukur:
 * 100% event punya gambar pasangannya.
 */
export async function getRecentHits(minutes = 60, limit = 40): Promise<VisitorHit[]> {
  const camera = NVR_CAMERAS[CAMERA_ID];
  if (!camera) throw new Error(`Kamera "${CAMERA_ID}" tidak terdaftar`);

  const end = new Date();
  const start = new Date(end.getTime() - minutes * 60_000);

  const [events, paths] = await Promise.all([
    getVisitorEvents(camera.guid, CHANNEL_ID, start, end),
    listSnapshotPaths(camera.guid, CHANNEL_ID, start, end).catch(() => [] as string[]),
  ]);

  const byBasename = new Map(paths.map((p) => [p.split("/").pop()?.replace(/\.jpg$/i, "") ?? "", p]));

  // Dikelompokkan per orang, bukan per event: orang yang berdiri di garis bisa
  // menghasilkan puluhan event dan akan membanjiri panel ini sendirian.
  const byTrack = new Map<string, VisitorEvent[]>();
  for (const e of events) {
    if (!e?.id) continue;
    const list = byTrack.get(e.id);
    if (list) list.push(e);
    else byTrack.set(e.id, [e]);
  }

  const hits: VisitorHit[] = [];
  for (const [trackId, list] of byTrack) {
    list.sort((a, b) => a.time - b.time);
    const masuk = list.filter((e) => e.direction === "in").length;
    const net = masuk - (list.length - masuk);
    const berGambar = list.find((e) => byBasename.has(String((e as VisitorEvent & { file?: string }).file ?? "")));
    const kunci = String((berGambar as (VisitorEvent & { file?: string }) | undefined)?.file ?? "");

    hits.push({
      trackId,
      time: new Date(list[0].time * 1000).toISOString(),
      direction: net > 0 ? "in" : net < 0 ? "out" : "lingering",
      label: list[0].name ?? "",
      crossings: list.length,
      imagePath: byBasename.get(kunci) ?? null,
    });
  }

  return hits.sort((a, b) => b.time.localeCompare(a.time)).slice(0, limit);
}

// ─── Sinkronisasi ────────────────────────────────────────────────────────

interface TrackSummary {
  trackId: string;
  firstSeen: Date;
  lastSeen: Date;
  eventsIn: number;
  eventsOut: number;
  firstDirection: "in" | "out";
  lastDirection: "in" | "out";
}

/**
 * Ringkas event mentah jadi satu baris per orang.
 *
 * Inilah inti seluruh modul ini. NVR mengirim satu event tiap kali titik lacak
 * melintasi garis; orang yang berdiri di dekat garis menghasilkan puluhan event
 * in/out bergantian berjarak <1 detik. Menghitung event mentah berarti
 * menghitung getaran — pada data nyata 398 event ternyata cuma 52 orang.
 */
export function summarizeTracks(events: VisitorEvent[]): TrackSummary[] {
  const byTrack = new Map<string, VisitorEvent[]>();
  for (const e of events) {
    if (!e?.id || (e.direction !== "in" && e.direction !== "out")) continue;
    const list = byTrack.get(e.id);
    if (list) list.push(e);
    else byTrack.set(e.id, [e]);
  }

  const out: TrackSummary[] = [];
  for (const [trackId, list] of byTrack) {
    list.sort((a, b) => a.time - b.time);
    const eventsIn = list.filter((e) => e.direction === "in").length;
    out.push({
      trackId,
      firstSeen: new Date(list[0].time * 1000),
      lastSeen: new Date(list[list.length - 1].time * 1000),
      eventsIn,
      eventsOut: list.length - eventsIn,
      firstDirection: list[0].direction,
      lastDirection: list[list.length - 1].direction,
    });
  }
  return out;
}

const pad = (n: number) => String(n).padStart(2, "0");
const sqlDateTime = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}:${pad(d.getSeconds())}`;
const sqlDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/**
 * Tarik data hari ini dari NVR lalu simpan.
 *
 * Selalu menarik SEHARI PENUH, bukan hanya sejak penarikan terakhir. Itu
 * disengaja: penarikan jadi memperbaiki dirinya sendiri — kalau proses sempat
 * mati beberapa jam, jendela berikutnya tetap mengisi lubangnya. Biayanya
 * murah karena sehari penuh cuma ~100 KB, dan kunci unik (kamera, hari, track)
 * membuat penarikan ulang memperbarui baris alih-alih menggandakannya.
 */
export async function syncVisitorToday(): Promise<{ tracks: number; events: number }> {
  const camera = NVR_CAMERAS[CAMERA_ID];
  if (!camera) throw new Error(`Kamera "${CAMERA_ID}" tidak terdaftar`);

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const events = await getVisitorEvents(camera.guid, CHANNEL_ID, startOfDay, now);
  const tracks = summarizeTracks(events);

  if (tracks.length) {
    const day = sqlDate(now);
    const updatedAt = sqlDateTime(now);
    const values: unknown[] = [];
    const placeholders = tracks
      .map((t) => {
        values.push(
          CAMERA_ID, CHANNEL_ID, t.trackId, day,
          sqlDateTime(t.firstSeen), sqlDateTime(t.lastSeen),
          t.eventsIn, t.eventsOut, t.eventsIn - t.eventsOut,
          t.firstDirection, t.lastDirection, updatedAt
        );
        return "(?,?,?,?,?,?,?,?,?,?,?,?)";
      })
      .join(",");

    // Satu perintah untuk semua baris: ~50 baris per hari, jadi satu INSERT
    // sudah cukup dan menghindari 50 bolak-balik ke MySQL.
    await query(
      `INSERT INTO cctv_visitor_tracks
         (camera_id, channel_id, track_id, day, first_seen, last_seen,
          events_in, events_out, net, first_direction, last_direction, updated_at)
       VALUES ${placeholders}
       ON DUPLICATE KEY UPDATE
         last_seen = VALUES(last_seen),
         events_in = VALUES(events_in),
         events_out = VALUES(events_out),
         net = VALUES(net),
         last_direction = VALUES(last_direction),
         updated_at = VALUES(updated_at)`,
      values
    );
  }

  const lastEvent = events.length
    ? sqlDateTime(new Date(Math.max(...events.map((e) => e.time)) * 1000))
    : null;

  await query(
    `INSERT INTO cctv_sync_state (camera_id, channel_id, last_sync_at, last_event_at, tracks_total)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       last_sync_at = VALUES(last_sync_at),
       last_event_at = VALUES(last_event_at),
       tracks_total = VALUES(tracks_total)`,
    [CAMERA_ID, CHANNEL_ID, sqlDateTime(now), lastEvent, tracks.length]
  );

  return { tracks: tracks.length, events: events.length };
}

/** Sinkronkan hanya bila data terakhir sudah cukup basi. */
export async function ensureFresh(): Promise<void> {
  const rows = await query<{ last_sync_at: Date }>(
    "SELECT last_sync_at FROM cctv_sync_state WHERE camera_id = ?",
    [CAMERA_ID]
  );
  const last = rows[0]?.last_sync_at;
  if (last && Date.now() - last.getTime() < SYNC_INTERVAL_MS) return;
  await syncVisitorToday();
}

// ─── Pembacaan ───────────────────────────────────────────────────────────

interface TrackRow {
  track_id: string;
  first_seen: Date;
  last_seen: Date;
  events_in: number;
  events_out: number;
  net: number;
}

export async function getVisitorOverview(): Promise<VisitorOverview> {
  const today = sqlDate(new Date());

  const rows = await query<TrackRow>(
    `SELECT track_id, first_seen, last_seen, events_in, events_out, net
     FROM cctv_visitor_tracks
     WHERE camera_id = ? AND day = ?`,
    [CAMERA_ID, today]
  );

  // Semua orang langsung dihitung — tidak ada yang ditahan. Yang masih terlihat
  // di depan kamera tetap dilaporkan lewat `active` sebagai keterangan.
  const batasAktif = Date.now() - ACTIVE_WINDOW_MINUTES * 60_000;
  const active = rows.filter((r) => r.last_seen.getTime() > batasAktif).length;

  // Pembagian arah memakai TANDA selisih bersih per orang, bukan jumlah event.
  // Orang yang bergetar di garis punya jumlah in ≈ out sehingga bersihnya nol —
  // dengan cara ini ia tidak terhitung sebagai masuk maupun keluar, melainkan
  // masuk kolom "lingering" yang justru menjelaskan apa yang terjadi.
  let masuk = 0;
  let keluar = 0;
  let lingering = 0;
  const hourly = new Map<number, VisitorHourly>();

  for (const r of rows) {
    const arah = r.net > 0 ? "in" : r.net < 0 ? "out" : "lingering";
    if (arah === "in") masuk++;
    else if (arah === "out") keluar++;
    else lingering++;

    const h = r.first_seen.getHours();
    const bucket = hourly.get(h) ?? { hour: h, in: 0, out: 0, total: 0 };
    if (arah === "in") bucket.in++;
    else if (arah === "out") bucket.out++;
    bucket.total++;
    hourly.set(h, bucket);
  }

  const hourlyList = [...hourly.values()].sort((a, b) => a.hour - b.hour);
  const busiest = hourlyList.reduce<VisitorHourly | null>(
    (best, h) => (!best || h.total > best.total ? h : best),
    null
  );

  const state = await query<{ last_sync_at: Date; last_event_at: Date | null }>(
    "SELECT last_sync_at, last_event_at FROM cctv_sync_state WHERE camera_id = ?",
    [CAMERA_ID]
  );

  // Kemarin diambil dari tabel kita sendiri — API NVR tidak menyimpannya.
  const kemarin = await query<{ masuk: number; keluar: number }>(
    `SELECT SUM(net > 0) AS masuk, SUM(net < 0) AS keluar
     FROM cctv_visitor_tracks
     WHERE camera_id = ? AND day = (CURDATE() - INTERVAL 1 DAY)`,
    [CAMERA_ID]
  );
  const beda = (kini: number, lalu: number | null) =>
    lalu == null || lalu === 0 ? null : Math.round(((kini - lalu) / lalu) * 100);
  const masukKemarin = kemarin[0]?.masuk != null ? Number(kemarin[0].masuk) : null;
  const keluarKemarin = kemarin[0]?.keluar != null ? Number(kemarin[0].keluar) : null;

  return {
    date: today,
    active,
    // Jumlah orang unik memakai SEMUA track, termasuk yang masih bergerak:
    // sebuah track tidak pernah hilang setelah muncul, jadi angka ini memang
    // hanya bisa bertambah tanpa perlu menunggu mengendap.
    uniqueVisitors: rows.length,
    in: masuk,
    out: keluar,
    lingering,
    netFlow: rows.reduce((s, r) => s + r.net, 0),
    hourly: hourlyList,
    busiestHour: busiest?.hour ?? null,
    rawEvents: rows.reduce((s, r) => s + r.events_in + r.events_out, 0),
    trendInPct: beda(masuk, masukKemarin),
    trendOutPct: beda(keluar, keluarKemarin),
    lastSyncAt: state[0]?.last_sync_at?.toISOString() ?? null,
    lastEventAt: state[0]?.last_event_at?.toISOString() ?? null,
  };
}

/** Riwayat harian — hanya mungkin karena kita menyimpannya sendiri. */
export async function getVisitorHistory(days = 7): Promise<VisitorDay[]> {
  const rows = await query<{ day: Date; unik: number; masuk: number; keluar: number }>(
    `SELECT day,
            COUNT(*) AS unik,
            SUM(net > 0) AS masuk,
            SUM(net < 0) AS keluar
     FROM cctv_visitor_tracks
     WHERE camera_id = ? AND day >= (CURDATE() - INTERVAL ? DAY)
     GROUP BY day
     ORDER BY day ASC`,
    [CAMERA_ID, days]
  );
  return rows.map((r) => ({
    date: sqlDate(r.day),
    uniqueVisitors: Number(r.unik),
    in: Number(r.masuk),
    out: Number(r.keluar),
  }));
}

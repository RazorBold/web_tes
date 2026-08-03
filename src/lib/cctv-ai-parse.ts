// Parser pesan wsai — fungsi murni, tanpa WebSocket & tanpa DOM, supaya bisa
// dipakai server (produsen SSE) maupun klien.
//
// Bentuk protokolnya sudah diverifikasi langsung terhadap ketiga kamera:
//
//   pesan pertama : [{'width': 1920, 'height': 1080}, {'offset': {...}}]
//   pesan berkala : <guid>:{'json': {'type': 3, 'data': { ... }}}
//
// Isi `data` berbeda-beda menurut fungsi AI kamera:
//   • cmd 5              → detect: [[x1,y1,x2,y2,label,id]] + realtime{inout,TrackingVideoCapture}
//   • cmd 4              → realtime{inout, TrackingVideoCapture} tanpa detect
//   • LineVideoCapture2  → inout: [[a,b,c,d]]      (lintasan garis hitung)
//   • TrackingVideoCapture → record + potongan JPEG orang yang dilacak
//   • BaseHeatMapCapture → ori_image berisi JPEG heatmap penuh
//
// Payload memakai kutip tunggal gaya Python, jadi tidak bisa langsung JSON.parse.

import type { CctvAiAnnotations, CctvAiBox, CctvAiLine, CctvAiSetup, CctvAiTrack, CctvAiZone } from "@/types/cctv";

/** Normalisasi teks gaya-Python jadi objek. Melempar bila tetap tak bisa diurai. */
export function parseLoose(text: string): unknown {
  const normalized = text
    .replace(/'/g, '"')
    .replace(/\bTrue\b/g, "true")
    .replace(/\bFalse\b/g, "false")
    .replace(/\bNone\b/g, "null");
  return JSON.parse(normalized);
}

export type ParsedAiMessage =
  | { kind: "setup"; setup: CctvAiSetup }
  | { kind: "annotations"; annotations: CctvAiAnnotations }
  | { kind: "ignored" };

interface RawPayload {
  json?: {
    data?: {
      cmd?: number;
      type?: string;
      detect?: unknown[];
      lines?: unknown[];
      inout?: unknown;
      realtime?: { inout?: unknown; TrackingVideoCapture?: Record<string, unknown> };
    };
  };
}

/**
 * Ubah satu pesan mentah jadi bentuk yang dipakai UI.
 * `guid` dipakai untuk mengenali prefiks pesan berkala.
 */
export function parseAiMessage(raw: string, guid: string): ParsedAiMessage {
  // 1) Pesan init: resolusi acuan + setelan kamera (garis hitung & zona).
  //
  // Bentuknya array dua elemen dan KEDUANYA harus dibaca — isinya berbeda-beda
  // menurut fungsi AI kamera:
  //   [{width, height}, {offset:{...}}]                      → tanpa setelan
  //   [{width, height, lines:[{x1,y1,x2,y2}]}, {offset:...}]  → garis hitung
  //   [{width, height}, {BaseExitsCapture:{idx_0:[[x,y],…]}}] → zona poligon
  //
  // Versi awal berhenti begitu menemukan width/height, sehingga garis pada kamera
  // Visitor Counting dan zona pada kamera Antrian ikut terbuang tanpa jejak.
  if (raw.startsWith("[")) {
    try {
      const arr = parseLoose(raw);
      if (!Array.isArray(arr)) return { kind: "ignored" };

      const head = arr[0] as { width?: number; height?: number; lines?: unknown } | undefined;
      if (!head?.width || !head?.height) return { kind: "ignored" };

      const lines: CctvAiLine[] = [];
      const zones: CctvAiZone[] = [];
      for (const part of arr) {
        const node = part as Record<string, unknown>;
        if (Array.isArray(node?.lines)) lines.push(...normalizeLines(node.lines));
        collectZones(node, zones);
      }

      return { kind: "setup", setup: { ref: { width: head.width, height: head.height }, lines, zones } };
    } catch {
      /* pesan rusak */
    }
    return { kind: "ignored" };
  }

  const prefix = `${guid}:`;
  if (!raw.startsWith(prefix)) return { kind: "ignored" };

  let obj: RawPayload;
  try {
    obj = parseLoose(raw.slice(prefix.length)) as RawPayload;
  } catch {
    return { kind: "ignored" };
  }

  const data = obj?.json?.data;
  if (!data) return { kind: "ignored" };

  const hasDetect = Array.isArray(data.detect);
  const inout = normalizeInout(data.realtime?.inout ?? data.inout);
  const tracks = normalizeTracks(data.realtime?.TrackingVideoCapture);
  const lines = Array.isArray(data.lines) ? normalizeLines(data.lines) : [];

  // Pesan yang tak membawa satu pun dari keempatnya (mis. BaseHeatMapCapture yang
  // isinya cuma gambar) tidak perlu diteruskan — belum ada yang menggambarnya.
  if (!hasDetect && !inout && !tracks.length && !lines.length) return { kind: "ignored" };

  return {
    kind: "annotations",
    annotations: {
      // Sengaja diteruskan walau kosong: daftar kosong artinya "bersihkan kotak".
      // Contoh aslinya melewatkan kasus ini, sehingga kotak lama menempel terus.
      boxes: hasDetect ? normalizeBoxes(data.detect as unknown[]) : [],
      lines,
      inout,
      tracks,
    },
  };
}

function normalizeBoxes(detect: unknown[]): CctvAiBox[] {
  const boxes: CctvAiBox[] = [];
  for (const d of detect) {
    if (!Array.isArray(d) || d.length < 4) continue;
    boxes.push({
      x1: Number(d[0]),
      y1: Number(d[1]),
      x2: Number(d[2]),
      y2: Number(d[3]),
      label: typeof d[4] === "string" ? d[4] : "",
      id: typeof d[5] === "number" || typeof d[5] === "string" ? d[5] : null,
    });
  }
  return boxes;
}

function normalizeLines(lines: unknown[]): CctvAiLine[] {
  return lines
    .filter((l): l is CctvAiLine => Boolean(l) && typeof l === "object" && "x1" in (l as object))
    .map((l) => ({ x1: l.x1, y1: l.y1, x2: l.x2, y2: l.y2 }));
}

/**
 * Telusuri objek init dan kumpulkan setiap deretan titik [x,y] sebagai zona.
 *
 * Ditelusuri, bukan dicocokkan ke nama kunci tertentu, karena tiap fungsi AI
 * memakai namanya sendiri (BaseExitsCapture untuk antrean; kemungkinan nama lain
 * untuk fungsi berikutnya). Yang dikenali bentuk datanya, bukan namanya.
 */
function collectZones(node: unknown, out: CctvAiZone[], prefix = "", depth = 0): void {
  if (!node || typeof node !== "object" || depth > 3) return;

  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    // `offset` selalu berupa persegi geser dengan flag 0 pada kamera-kamera ini —
    // penggeser koordinat, bukan zona yang perlu digambar.
    if (key === "offset" || key === "lines" || key === "width" || key === "height") continue;

    const polygon = asPolygon(value);
    if (polygon) {
      const id = prefix ? `${prefix}.${key}` : key;
      const bagian = pecahZona(polygon);
      bagian.forEach((titik, i) => {
        out.push({ id: bagian.length > 1 ? `${id}#${i + 1}` : id, points: titik });
      });
      continue;
    }
    collectZones(value, out, prefix ? `${prefix}.${key}` : key, depth + 1);
  }
}

/**
 * Beberapa zona yang dikirim NVR dalam SATU deret titik, dipisahkan lagi.
 *
 * Terukur pada kamera Antrian: kanal lama mengirim `BaseExitsCapture.idx_0`
 * berisi 4 titik (satu segi empat), kanal barunya mengirim 8 titik di deret yang
 * sama — dan kedelapan titik itu jelas dua segi empat terpisah:
 *
 *   (195,460) (1301,380) (1366,996) (338,1071)   ← area besar di tengah
 *   ( 65, 98) ( 455, 98) ( 456,329) (101, 347)   ← kotak kecil di kiri atas
 *
 * Digambar sebagai satu poligon, garisnya melompat dari sudut kiri-bawah ke
 * pojok kiri-atas lalu balik lagi — bentuk kusut yang saling potong dan menutupi
 * gambar. Karena itu deret dipecah per 4 titik.
 *
 * Sengaja HANYA untuk kelipatan 4 yang lebih dari 4: semua zona yang pernah
 * teramati di NVR ini berupa segi empat, sementara poligon sungguhan bersudut 5
 * atau 6 tidak akan ikut terpecah. Kalau suatu saat muncul zona segi delapan
 * asli, aturan ini yang perlu ditinjau ulang.
 */
function pecahZona(points: [number, number][]): [number, number][][] {
  if (points.length <= 4 || points.length % 4 !== 0) return [points];
  const bagian: [number, number][][] = [];
  for (let i = 0; i < points.length; i += 4) bagian.push(points.slice(i, i + 4));
  return bagian;
}

/** Deret [[x,y], …] minimal 3 titik — kurang dari itu bukan bidang. */
function asPolygon(value: unknown): [number, number][] | null {
  if (!Array.isArray(value) || value.length < 3) return null;
  const points: [number, number][] = [];
  for (const p of value) {
    if (!Array.isArray(p) || p.length !== 2) return null;
    const [x, y] = p;
    if (typeof x !== "number" || typeof y !== "number") return null;
    points.push([x, y]);
  }
  return points;
}

function normalizeInout(value: unknown): number[][] | null {
  if (!Array.isArray(value)) return null;
  const rows = value.filter(Array.isArray).map((row) => row.map(Number));
  return rows.length ? rows : null;
}

function normalizeTracks(value: Record<string, unknown> | undefined): CctvAiTrack[] {
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).map(([id, v]) => {
    const t = v as { id?: string; stay_time?: number };
    return { id: t?.id ?? id, stayTime: Number(t?.stay_time ?? 0) };
  });
}

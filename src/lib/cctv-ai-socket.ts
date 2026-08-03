// Koneksi wsai dari sisi SERVER. Dipakai route SSE, jangan diimpor dari klien.
//
// Kenapa paket `ws` dan bukan WebSocket bawaan Node: sertifikat NVR sah untuk
// *.icode.id sementara kita menghubunginya lewat IP, jadi verifikasi nama host
// gagal. WebSocket bawaan Node tidak menerima opsi TLS per-koneksi — satu-satunya
// jalan adalah NODE_TLS_REJECT_UNAUTHORIZED=0 yang mematikan verifikasi untuk
// SELURUH proses. `ws` bisa dilonggarkan hanya pada koneksi ini saja.

import WebSocket from "ws";
import { NVR_CAMERAS, NvrError } from "@/lib/cctv-nvr";
import { parseAiMessage } from "@/lib/cctv-ai-parse";
import type { CctvAiAnnotations, CctvAiSetup, CctvAiStatus } from "@/types/cctv";

interface AiSocketHandlers {
  /** Resolusi acuan + garis hitung + zona, dari pesan init. */
  onSetup?: (setup: CctvAiSetup) => void;
  onAnnotations?: (annotations: CctvAiAnnotations) => void;
  onStatus?: (status: CctvAiStatus) => void;
}

const RECONNECT_DELAY_MS = 3000;

/**
 * Jarak minimum antar pembukaan koneksi wsai.
 *
 * INI YANG MEMPERBAIKI "kadang tidak ada bounding box padahal stream jalan".
 * Endpoint /wsai/ tidak tahan dibuka beberapa kali sekaligus — terukur dengan
 * tiga kanal dibuka bersamaan lalu diamati 45 detik:
 *
 *   jeda 0 ms    → 1 dari 3 kanal berisi; dua lainnya init OK tapi NOL pesan
 *   jeda 1000 ms → 3 dari 3 kanal berisi (308 / 201 / 200 pesan)
 *   jeda 2500 ms → 3 dari 3 kanal berisi (378 / 232 / 237 pesan)
 *
 * Pada percobaan dengan lima kanal serentak gejalanya lebih buruk lagi: satu
 * koneksi menerima pesan milik GUID LAIN. Jadi bukan sekadar kanal yang sepi —
 * server benar-benar salah melayani koneksi yang datang berdempetan. Halaman
 * /cctv memasang dua pemutar sekaligus, jadi tanpa jeda ini salah satunya
 * memang sering hidup tanpa kotak deteksi, dan tampak acak karena bergantung
 * pada koneksi mana yang menang.
 *
 * 1200 ms dipilih: di atas ambang yang terbukti cukup (1000 ms), masih jauh
 * lebih cepat daripada stream itu sendiri tersambung.
 */
const OPEN_STAGGER_MS = 1200;

/**
 * Antre pembukaan koneksi, satu per satu dengan jeda. Sengaja mirip `serialize()`
 * di cctv-nvr.ts — masalahnya sejenis: NVR ini tidak suka dua permintaan sejenis
 * yang datang bersamaan.
 */
let openQueue: Promise<void> = Promise.resolve();

function antreBuka(fn: () => void): void {
  openQueue = openQueue.then(async () => {
    fn();
    await new Promise((r) => setTimeout(r, OPEN_STAGGER_MS));
  });
}

/**
 * Buka koneksi anotasi untuk satu kamera dan sambung ulang sendiri bila putus.
 *
 * Catatan: satu koneksi per pemanggil. Kamera-kamera ini bisa diam bermenit-menit
 * (kirimannya event-driven), jadi bebannya ringan — tapi kalau nanti penontonnya
 * banyak, ini titik yang layak dijadikan satu koneksi bersama.
 */
export function openAiSocket(cameraId: string, handlers: AiSocketHandlers): { close: () => void } {
  const camera = NVR_CAMERAS[cameraId];
  if (!camera) throw new NvrError(`Kamera "${cameraId}" tidak terdaftar`, 404);

  const host = process.env.NVR_HOST;
  if (!host) throw new NvrError("NVR_HOST belum dikonfigurasi", 500);

  let closed = false;
  let ws: WebSocket | null = null;
  let retry: NodeJS.Timeout | null = null;

  const open = () => {
    if (closed) return;
    handlers.onStatus?.("connecting");

    ws = new WebSocket(`wss://${host}/wsai/`, { rejectUnauthorized: false });

    ws.on("open", () => {
      handlers.onStatus?.("open");
      // Base token = segmen path stream sesudah /streamRTSPnew/, yang pada NVR
      // ini ternyata sama persis dengan GUID kamera.
      ws?.send(`:init:${camera.guid}:`);
    });

    ws.on("message", (data: WebSocket.RawData) => {
      const raw = data.toString();
      if (!raw) return;
      const parsed = parseAiMessage(raw, camera.guid);
      if (parsed.kind === "setup") handlers.onSetup?.(parsed.setup);
      else if (parsed.kind === "annotations") handlers.onAnnotations?.(parsed.annotations);
    });

    ws.on("error", () => handlers.onStatus?.("error"));

    ws.on("close", () => {
      handlers.onStatus?.("closed");
      // Sambung ulang juga lewat antrean: kalau beberapa kanal putus bersamaan
      // (mis. NVR sempat restart), membukanya serentak akan mengulang persis
      // masalah yang sama.
      if (!closed) retry = setTimeout(() => antreBuka(open), RECONNECT_DELAY_MS);
    });
  };

  antreBuka(open);

  return {
    close() {
      closed = true;
      if (retry) clearTimeout(retry);
      try {
        ws?.close();
      } catch {
        /* sudah tertutup */
      }
    },
  };
}

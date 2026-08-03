// Tipe untuk mpegts.js — sengaja ambient, bukan `npm i mpegts.js`.
//
// Stream NVR berisi HEVC/H.265 di dalam MPEG-TS, dan build mpegts.js yang
// diterbitkan di npm TIDAK mendukung HEVC. Yang dipakai adalah build vendor di
// public/vendor/mpegts.js (punya penanganan `hvc1`/`hvcC`), dimuat lewat tag
// <script> ke `window.mpegts`. Karena tidak ada modul yang bisa diimpor, tipenya
// dideklarasikan di sini — hanya bagian yang benar-benar dipakai player.

interface MpegtsMediaInfo {
  videoCodec?: string;
  width?: number;
  height?: number;
  fps?: number;
}

/** Nilai `extra` pada event ERROR; bentuknya bergantung jenis errornya. */
interface MpegtsErrorExtra {
  code?: number | string;
  msg?: string;
  reason?: string;
}

interface MpegtsPlayer {
  attachMediaElement(element: HTMLMediaElement): void;
  detachMediaElement(): void;
  load(): void;
  unload(): void;
  play(): Promise<void> | void;
  pause(): void;
  destroy(): void;

  on(event: "media_info", handler: (info: MpegtsMediaInfo) => void): void;
  on(event: "statistics_info", handler: (stats: Record<string, unknown>) => void): void;
  on(event: "error", handler: (type: string, detail: string, extra?: MpegtsErrorExtra) => void): void;
  on(event: "loading_complete", handler: () => void): void;
  off(event: string, handler: (...args: never[]) => void): void;
}

interface MpegtsMediaDataSource {
  type: "mpegts" | "mse" | "flv";
  url: string;
  isLive?: boolean;
  cors?: boolean;
  withCredentials?: boolean;
}

interface MpegtsConfig {
  enableWorker?: boolean;
  liveBufferLatencyChasing?: boolean;
  lazyLoad?: boolean;
  stashInitialSize?: number;
  enableStashBuffer?: boolean;
}

interface MpegtsStatic {
  isSupported(): boolean;
  createPlayer(source: MpegtsMediaDataSource, config?: MpegtsConfig): MpegtsPlayer;
  /** Nilai literalnya diambil dari build vendor, bukan ditebak. */
  Events: {
    MEDIA_INFO: "media_info";
    STATISTICS_INFO: "statistics_info";
    ERROR: "error";
    LOADING_COMPLETE: "loading_complete";
  };
}

interface Window {
  mpegts?: MpegtsStatic;
}

"use client";

import React, { useEffect, useRef, useState } from "react";
import { Radar, Users, VideoOff, LoaderCircle } from "lucide-react";
import { DEFAULT_STREAM_PROFILE } from "@/config/cctv-stream";
import { useCctvEvents } from "@/hooks/use-cctv-events";
import CctvAiOverlay from "./cctv-ai-overlay";

// mpegts.js dimuat dari /public, bukan dari npm: stream NVR berisi HEVC/H.265 di
// dalam MPEG-TS, dan build npm tidak mendukung HEVC. Library ini butuh `window`,
// jadi dimuat lewat tag <script> saat komponen dipakai — sekali untuk seluruh
// halaman, berapa pun jumlah pemutarnya.
let mpegtsPromise: Promise<MpegtsStatic | undefined> | null = null;

function loadMpegts(): Promise<MpegtsStatic | undefined> {
  if (typeof window === "undefined") return Promise.resolve(undefined);
  if (window.mpegts) return Promise.resolve(window.mpegts);
  if (mpegtsPromise) return mpegtsPromise;

  mpegtsPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "/vendor/mpegts.js";
    script.async = true;
    script.onload = () => resolve(window.mpegts);
    script.onerror = () => reject(new Error("Gagal memuat mpegts.js"));
    document.head.appendChild(script);
  });
  return mpegtsPromise;
}

export type PlayerStatus = "idle" | "connecting" | "live" | "error";

interface CctvStreamPlayerProps {
  cameraId: string;
  profile?: string;
  /** Tampilkan overlay kotak deteksi. */
  showOverlay?: boolean;
  /**
   * Matikan bila kartu pembungkus sudah menampilkan status sendiri di header —
   * dua lencana "LIVE" di satu kartu justru membingungkan.
   */
  showStatusBadge?: boolean;
  onStatusChange?: (status: PlayerStatus) => void;
  className?: string;
}

const RETRY_DELAY_MS = 4000;

/**
 * Batas "sudah tersambung tapi tidak ada video".
 *
 * Jaring pengaman untuk kegagalan yang TIDAK memicu event `error` di mpegts.js:
 * kalau sumbernya membalas 200 tapi tak pernah mengirim isi, tidak ada yang
 * di-demux dan tidak ada yang dianggap salah — lencana berputar di "Menyambung"
 * selamanya. Penyebab yang sudah diketahui (profil kosong) kini ditangkap di
 * server, tapi ambang ini menjaga agar seluruh kelas kegagalan itu selalu
 * berakhir sebagai pesan + percobaan ulang, bukan spinner abadi.
 */
const CONNECT_TIMEOUT_MS = 12_000;

/** Contoh tipe HEVC-dalam-MP4 untuk menguji dukungan dekoder browser. */
const HEVC_MIME = 'video/mp4; codecs="hvc1.1.6.L93.B0"';

export default function CctvStreamPlayer({
  cameraId,
  profile = DEFAULT_STREAM_PROFILE,
  showOverlay = true,
  showStatusBadge = true,
  onStatusChange,
  className = "",
}: CctvStreamPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Dimulai di "connecting", bukan "idle": pemutar ini memang langsung menyambung
  // begitu dipasang.
  const [status, setStatus] = useState<PlayerStatus>("connecting");
  const [message, setMessage] = useState("Menghubungkan\u2026");
  /** Dinaikkan untuk memicu penyusunan ulang stream (dipakai saat mencoba ulang). */
  const [attempt, setAttempt] = useState(0);
  /** Salah untuk kegagalan yang tak mungkin membaik (mis. codec tak didukung),
   *  supaya overlay tidak menjanjikan percobaan ulang yang tidak akan terjadi. */
  const [willRetry, setWillRetry] = useState(true);

  const ai = useCctvEvents(cameraId);

  // Seluruh siklus hidup pemutar ada di satu efek, dan SEMUA perubahan state
  // datang dari callback mpegts.js — bukan dari badan efek. Selain itulah yang
  // dituntut aturan React Compiler, bentuk ini juga menghapus kebutuhan akan
  // penghitung "generation" dan referensi-diri: mencoba ulang cukup dengan
  // menaikkan `attempt`, yang menjalankan ulang efek ini beserta pembersihannya.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let cancelled = false;
    let player: MpegtsPlayer | null = null;
    let retry: ReturnType<typeof setTimeout> | null = null;
    let stall: ReturnType<typeof setTimeout> | null = null;

    const scheduleRetry = () => {
      retry = setTimeout(() => {
        if (cancelled) return;
        setStatus("connecting");
        setMessage("Menyambung ulang\u2026");
        setAttempt((n) => n + 1);
      }, RETRY_DELAY_MS);
    };

    loadMpegts()
      .then((mpegts) => {
        if (cancelled) return;

        if (!mpegts?.isSupported()) {
          setStatus("error");
          setWillRetry(false);
          setMessage("Browser ini tidak mendukung MediaSource yang dibutuhkan");
          return;
        }

        // Kamera-kamera ini mengeluarkan HEVC/H.265. mpegts.js akan me-remux-nya
        // ke fMP4, tapi pemutarannya tetap bergantung pada dekoder HEVC browser —
        // dan tidak semua browser punya (Chromium tanpa codec proprietary, mis.).
        // Tanpa pemeriksaan ini gejalanya menyesatkan: stream terbaca normal,
        // lencana sempat menyala "Live", lalu gagal diam-diam di addSourceBuffer
        // dan kartu berputar mencoba ulang selamanya.
        if (typeof MediaSource !== "undefined" && !MediaSource.isTypeSupported(HEVC_MIME)) {
          setStatus("error");
          setWillRetry(false);
          setMessage("Browser ini tidak bisa memutar HEVC/H.265 — pakai Chrome atau Edge terbaru");
          return; // sengaja tanpa scheduleRetry: mengulang tidak akan mengubah hasil
        }

        // Menunjuk ke route proxy kita, bukan ke NVR. Tiap permintaan menerbitkan
        // token baru di server, jadi tidak ada URL kedaluwarsa yang perlu diurus
        // di sini — menyambung ulang cukup dengan meminta lagi.
        player = mpegts.createPlayer(
          {
            type: "mpegts",
            isLive: true,
            url: `/api/v1/cctv/cameras/${cameraId}/stream?profile=${encodeURIComponent(profile)}`,
          },
          { enableWorker: false, liveBufferLatencyChasing: true, lazyLoad: false, stashInitialSize: 128 }
        );

        player.on("statistics_info", () => {
          if (cancelled) return;
          // Byte pertama sudah datang — pengawas tidak diperlukan lagi.
          if (stall) {
            clearTimeout(stall);
            stall = null;
          }
          setStatus("live");
        });

        player.on("error", (type, detail, extra) => {
          if (cancelled) return;
          if (stall) {
            clearTimeout(stall);
            stall = null;
          }
          setStatus("error");

          // Codec yang tidak didukung tidak akan berubah dengan dicoba lagi;
          // hanya gangguan jaringan yang layak diulang.
          const terminal = /unsupported|not supported/i.test(`${detail} ${extra?.msg ?? ""}`);
          setWillRetry(!terminal);
          setMessage(terminal ? "Format video tidak didukung browser ini" : `${type} \u2014 ${detail}`);
          if (!terminal) scheduleRetry();
        });

        player.attachMediaElement(video);
        player.load();

        stall = setTimeout(() => {
          if (cancelled) return;
          setStatus("error");
          setWillRetry(true);
          setMessage("Tersambung, tapi NVR tidak mengirim video");
          scheduleRetry();
        }, CONNECT_TIMEOUT_MS);

        const played = video.play();
        if (played) played.catch(() => setMessage("Klik video untuk memulai"));
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "Gagal memuat pemutar");
        scheduleRetry();
      });

    return () => {
      cancelled = true;
      if (retry) clearTimeout(retry);
      if (stall) clearTimeout(stall);
      try {
        player?.destroy();
      } catch {
        /* sudah dihancurkan */
      }
    };
  }, [cameraId, profile, attempt]);

  // Laporkan status ke kartu pembungkus lewat efek, bukan dari dalam callback
  // mpegts — supaya perubahan state milik induk tidak menumpang di tengah
  // perubahan state milik pemutar ini.
  useEffect(() => {
    onStatusChange?.(status);
  }, [status, onStatusChange]);

  const live = status === "live";
  // Ketiga kamera sama-sama mengirim kotak, termasuk yang heatmap. Dulu kamera
  // heatmap dikecualikan dari hitungan ini karena terukur 0 anotasi; yang salah
  // ternyata pengukurannya — kanalnya kelaparan karena koneksi wsai dibuka
  // berbarengan dengan kamera lain (lihat OPEN_STAGGER_MS di cctv-ai-socket.ts).
  // Setelah dijeda, kanal itu mengirim 570 kotak dalam 45 detik.
  const people = ai.boxes.length;

  return (
    <div className={`relative w-full aspect-video bg-slate-950 overflow-hidden ${className}`}>
      <video ref={videoRef} muted autoPlay playsInline className="absolute inset-0 w-full h-full object-contain" />

      {showOverlay && (
        <CctvAiOverlay videoRef={videoRef} boxes={ai.boxes} lines={ai.lines} zones={ai.zones} aiRef={ai.ref} />
      )}

      {showStatusBadge && (
      <span
        className={`absolute top-3 right-3 flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-xl border backdrop-blur-md ${
          live
            ? "bg-[#E12229]/15 text-[#E12229] border-[#E12229]/30"
            : status === "error"
            ? "bg-slate-900/70 text-slate-300 border-white/15"
            : "bg-amber-500/15 text-amber-300 border-amber-400/30"
        }`}
      >
        {live ? (
          <>
            <span className="h-1.5 w-1.5 rounded-full bg-[#E12229] animate-pulse" /> Live
          </>
        ) : status === "error" ? (
          <>
            <VideoOff className="h-3 w-3" /> Terputus
          </>
        ) : (
          <>
            <LoaderCircle className="h-3 w-3 animate-spin" /> Menyambung
          </>
        )}
      </span>
      )}

      {/* Jumlah objek terdeteksi — dari wsai, bukan angka tetap. Sengaja hanya
          muncul saat WS benar-benar terhubung, supaya "0" tidak terbaca sebagai
          "sepi" padahal sebetulnya anotasinya belum tersambung. */}
      {ai.status === "open" && (
        <div className="absolute bottom-3 left-3 pointer-events-none">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-white/80" />
            <span className="text-[26px] font-bold font-mono text-white leading-none">{people}</span>
          </div>
          <span className="block text-[13px] font-semibold text-white/70 mt-1 leading-none">
            Objek Terdeteksi
          </span>
        </div>
      )}

      <span className="absolute bottom-3 right-3 flex items-center gap-1.5 text-[11px] font-bold px-2 py-1 rounded-lg border backdrop-blur-md bg-black/50 border-white/15 text-white/70 pointer-events-none">
        <Radar className={`h-3 w-3 ${ai.status === "open" ? "text-emerald-400" : "text-slate-500"}`} />
        AI {ai.status === "open" ? "aktif" : ai.status}
      </span>

      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-950/70 text-center px-4">
          <VideoOff className="h-7 w-7 text-slate-500" />
          <span className="text-[13px] font-bold text-slate-300">{message}</span>
          {willRetry && (
            <span className="text-[12px] font-semibold text-slate-500">Mencoba menyambung ulang…</span>
          )}
        </div>
      )}
    </div>
  );
}

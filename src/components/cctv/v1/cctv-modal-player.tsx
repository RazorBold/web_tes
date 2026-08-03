"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  X, Video, VideoOff, MapPin, Radar, Volume2, VolumeX, Camera,
  ShieldAlert, UserCheck, Users, Target,
} from "lucide-react";
import { AI_MODELS, DETECTED_LABEL, type Cam } from "@/config/cctv";
import { useCctvAiStore } from "@/stores/cctv-ai-store";

interface CctvModalPlayerProps {
  cam: Cam;
  modeType: "crowd" | "face";
  onClose: () => void;
}

export default function CctvModalPlayer({ cam, modeType, onClose }: CctvModalPlayerProps) {
  const [isMuted, setIsMuted] = useState(true);
  const [showOverlay, setShowOverlay] = useState(true);

  // Model AI yang benar-benar ditugaskan ke kamera INI (bisa diubah di Settings),
  // bukan daftar semua model yang dimiliki platform.
  const activeModes = useCctvAiStore((s) => s.assignments[cam.id]) ?? cam.aiModes;

  // Esc untuk menutup — modal yang hanya bisa ditutup dengan mengklik tombol X
  // terasa mengurung.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Di-portal ke <body>. WAJIB: panel Section pembungkus halaman /cctv memakai
  // backdrop-blur, dan backdrop-filter menjadikan elemen sebagai containing block
  // untuk position:fixed — tanpa portal, `fixed inset-0` di bawah ini hanya
  // menutupi panel grup, bukan seluruh layar.
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-slate-950/90 backdrop-blur-md"
    >
      <div className="relative w-full max-w-[1280px] bg-slate-900 border border-slate-700/70 rounded-3xl overflow-hidden shadow-2xl text-white animate-pop-in">
        {/* ── Header: identitas kamera ── */}
        <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-800 bg-slate-900">
          <div className="flex items-center gap-3 min-w-0">
            <span className="h-9 w-9 rounded-xl bg-red-500/15 border border-red-500/35 flex items-center justify-center flex-shrink-0">
              <Video className="h-[18px] w-[18px] text-red-400" />
            </span>
            <div className="min-w-0">
              <h3 className="text-[16px] font-extrabold text-white truncate leading-tight">{cam.name}</h3>
              <span className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-400 mt-0.5">
                <MapPin className="h-3 w-3 text-red-400 flex-shrink-0" /> {cam.location}
                <span className="text-slate-600">·</span>
                <span className="font-mono">CAM-{cam.id.padStart(2, "0")}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {cam.online ? (
              <span className="flex items-center gap-1.5 bg-red-500/15 text-red-400 border border-red-500/35 text-[12px] font-black px-3 py-1.5 rounded-xl uppercase tracking-wider">
                <span className="h-1.5 w-1.5 bg-red-500 rounded-full animate-pulse" /> Live
              </span>
            ) : (
              <span className="flex items-center gap-1.5 bg-slate-800 text-slate-400 border border-slate-700 text-[12px] font-black px-3 py-1.5 rounded-xl uppercase tracking-wider">
                <VideoOff className="h-3.5 w-3.5" /> Offline
              </span>
            )}
            <button
              onClick={onClose}
              aria-label="Tutup"
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ── Video: bagian utama modal ── */}
        <div className="relative w-full aspect-video bg-slate-950 overflow-hidden">
          <img
            src={cam.imageUrl}
            alt={cam.name}
            className={`absolute inset-0 w-full h-full object-cover ${cam.online ? "" : "grayscale opacity-40"}`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-slate-950/30 pointer-events-none" />

          {cam.online && (
            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_3px_rgba(34,211,238,0.7)] animate-scan pointer-events-none" />
          )}

          {/* Kotak deteksi, mengikuti fokus grup kamera ini */}
          {cam.online && showOverlay && modeType === "crowd" && (
            <div className="absolute top-[20%] left-[25%] w-[42%] h-[48%] border-2 border-red-500 bg-red-500/18 rounded-2xl shadow-[0_0_25px_rgba(239,68,68,0.45)] animate-pulse pointer-events-none">
              <span className="absolute -top-7 left-0 bg-red-600 text-white text-[12px] font-extrabold px-2.5 py-1 rounded-lg shadow-md flex items-center gap-1.5 whitespace-nowrap">
                <ShieldAlert className="h-3.5 w-3.5 text-amber-300" /> High Density Crowd (87%)
              </span>
            </div>
          )}
          {cam.online && showOverlay && modeType === "face" && (
            <div className="absolute top-[24%] left-[38%] w-[20%] h-[34%] border-2 border-indigo-400 bg-indigo-500/22 rounded-2xl shadow-[0_0_25px_rgba(129,140,248,0.55)] pointer-events-none">
              <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[12px] font-bold px-3 py-1 rounded-full whitespace-nowrap shadow-lg flex items-center gap-1.5">
                <UserCheck className="h-3.5 w-3.5 text-cyan-300" /> ID: B9432 · Happy (94%)
              </span>
            </div>
          )}

          {/* Info stream kiri atas */}
          <span className="absolute top-4 left-4 bg-black/60 backdrop-blur-md border border-white/15 text-white text-[12px] font-mono font-semibold px-3 py-1.5 rounded-xl pointer-events-none">
            CAM-{cam.id.padStart(2, "0")} · 1080P · 30FPS
          </span>

          {/* Kontrol kanan bawah */}
          <div className="absolute bottom-4 right-4 flex items-center gap-2">
            <button
              onClick={() => setShowOverlay(!showOverlay)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[12px] font-bold backdrop-blur-md shadow-md transition-colors cursor-pointer ${
                showOverlay
                  ? "bg-red-500/90 border-red-400 text-white"
                  : "bg-slate-900/80 border-slate-700 text-slate-400 hover:text-white"
              }`}
            >
              <Radar className="h-3.5 w-3.5" /> Overlay AI {showOverlay ? "ON" : "OFF"}
            </button>
            <button
              onClick={() => setIsMuted(!isMuted)}
              aria-label={isMuted ? "Nyalakan suara" : "Bisukan"}
              className="p-2 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer shadow-md"
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4 text-emerald-400" />}
            </button>
            <button
              onClick={() => alert("Snapshot berhasil ditangkap!")}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-700 text-slate-200 hover:text-white hover:border-red-400 text-[12px] font-bold transition-colors cursor-pointer shadow-md"
            >
              <Camera className="h-3.5 w-3.5 text-red-400" /> Snapshot
            </button>
          </div>

          {/* Jumlah deteksi kiri bawah — konsisten dengan kartu live di halaman */}
          <div className="absolute bottom-4 left-4 pointer-events-none">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-white/80" />
              <span className="text-[30px] font-bold font-mono text-white leading-none">{cam.value}</span>
            </div>
            <span className="block text-[12px] font-semibold text-white/70 mt-1 leading-none">
              {DETECTED_LABEL[cam.metricType]}
            </span>
          </div>
        </div>

        {/* ── Data kamera ini saja ── */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4 bg-slate-900 border-t border-slate-800">
          <div>
            <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Akurasi Model
            </span>
            <span className="text-[15px] font-black font-mono text-emerald-400">{cam.accuracy}</span>
          </div>

          <div className="h-8 w-px bg-slate-800" />

          <div className="min-w-0">
            <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Model AI Aktif di Kamera Ini
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {activeModes.length > 0 ? (
                activeModes.map((mode) => {
                  const meta = AI_MODELS[mode];
                  const { Icon } = meta;
                  return (
                    <span
                      key={mode}
                      title={meta.desc}
                      className="flex items-center gap-1.5 text-[12px] font-bold text-slate-200 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-lg"
                    >
                      <Icon className="h-3.5 w-3.5 text-slate-400" />
                      {meta.label}
                      <span className="font-mono text-[11px] text-slate-500">{meta.model}</span>
                    </span>
                  );
                })
              ) : (
                <span className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-500">
                  <Target className="h-3.5 w-3.5" /> Belum ada model AI ditugaskan
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

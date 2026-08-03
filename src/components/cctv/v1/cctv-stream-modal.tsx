"use client";

import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Video, VideoOff, LoaderCircle, Radar, Minimize2 } from "lucide-react";
import CctvStreamPlayer, { type PlayerStatus } from "../shared/cctv-stream-player";
import type { CctvCamera } from "@/types/cctv";

interface CctvStreamModalProps {
  cameras: CctvCamera[];
  activeId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
  showOverlay: boolean;
  onToggleOverlay: () => void;
  status: PlayerStatus;
  onStatusChange: (status: PlayerStatus) => void;
}

export default function CctvStreamModal({
  cameras,
  activeId,
  onSelect,
  onClose,
  showOverlay,
  onToggleOverlay,
  status,
  onStatusChange,
}: CctvStreamModalProps) {
  // Esc untuk menutup — modal yang hanya bisa ditutup lewat tombol X terasa
  // mengurung, apalagi kalau dibuka cuma untuk melirik sebentar.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (typeof document === "undefined") return null;

  const activeCam = cameras.find((c) => c.id === activeId);
  const live = status === "live";

  // WAJIB di-portal ke <body>: panel Section pembungkus halaman /cctv memakai
  // backdrop-blur, dan backdrop-filter menjadikan elemen sebagai containing block
  // untuk position:fixed — tanpa portal, `fixed inset-0` hanya menutupi panelnya.
  return createPortal(
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-slate-950/90 backdrop-blur-md"
      role="dialog"
      aria-label={`Tampilan penuh ${activeCam?.name ?? "kamera"}`}
    >
      <div className="relative w-full max-w-[1280px] bg-slate-900 border border-slate-700/70 rounded-3xl overflow-hidden shadow-2xl animate-pop-in">
        {/* Header — sama seperti kartu, plus tombol tutup */}
        <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <span className="h-9 w-9 rounded-xl bg-red-500/15 border border-red-500/35 flex items-center justify-center flex-shrink-0">
              <Video className="h-[18px] w-[18px] text-red-400" />
            </span>
            <h3 className="text-[16px] font-extrabold text-white truncate">
              {activeCam?.name ?? "Kamera NVR"}
            </h3>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <select
              value={activeId}
              onChange={(e) => onSelect(e.target.value)}
              aria-label="Pilih kamera"
              className="max-w-[220px] text-[13px] font-semibold text-slate-200 bg-white/10 border border-white/15 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-red-500 cursor-pointer"
            >
              {cameras.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#111827] text-slate-200">
                  {c.name}
                </option>
              ))}
            </select>

            <span
              className={`flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-xl border ${
                live
                  ? "bg-[#E12229]/15 text-[#E12229] border-[#E12229]/30"
                  : status === "error"
                  ? "bg-white/10 text-slate-400 border-white/15"
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

            <button
              onClick={onToggleOverlay}
              title="Tampilkan / sembunyikan overlay AI"
              aria-pressed={showOverlay}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                showOverlay
                  ? "bg-[#E12229]/90 border-red-400 text-white"
                  : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
              }`}
            >
              <Radar className="h-4 w-4" />
            </button>

            <button
              onClick={onClose}
              aria-label="Tutup tampilan penuh"
              title="Kecilkan (Esc)"
              className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <Minimize2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Profilnya SENGAJA sama dengan kartu kecil. Dulu di sini diminta
            "Streaming 1" dengan harapan dapat 1080p, padahal kamera ini tidak
            punya aliran itu: NVR menjawab 200 lalu menutup tanpa satu byte pun,
            sehingga tampilan penuh terus-menerus "Menyambung" sementara kartu
            kecil normal. Yang ditambah maximize adalah luas tampilan, bukan
            resolusi — sumbernya memang cuma 640x360 (lihat config/cctv-stream.ts).

            `key` memaksa pemutar disusun ulang saat kamera berganti, sehingga
            aliran lama benar-benar ditutup. */}
        <CctvStreamPlayer
          key={activeId}
          cameraId={activeId}
          showOverlay={showOverlay}
          showStatusBadge={false}
          onStatusChange={onStatusChange}
        />

        <button
          onClick={onClose}
          aria-label="Tutup"
          className="absolute top-3 right-3 sm:hidden p-2 rounded-full bg-slate-900/80 text-slate-300 border border-slate-700"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>,
    document.body
  );
}

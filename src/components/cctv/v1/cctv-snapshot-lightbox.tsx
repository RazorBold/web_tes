"use client";

import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Download, Camera, MapPin, Clock, ShieldCheck, Flame } from "lucide-react";
import { CctvHeatmapLayer, CctvHeatmapLegend } from "./cctv-heatmap-overlay";
import { detectionBoxes, type CctvSnapshot } from "@/config/cctv";

interface LightboxProps {
  snapshot: CctvSnapshot;
  onClose: () => void;
}

export default function CctvSnapshotLightbox({ snapshot, onClose }: LightboxProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Sama seperti CctvModalPlayer: harus di-portal ke <body>, karena panel Section
  // di halaman /cctv memakai backdrop-blur yang membuat `fixed inset-0` hanya
  // menutupi panel grup, bukan seluruh layar.
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md"
    >
      <div className="relative w-full max-w-3xl bg-white/95 backdrop-blur-xl border border-slate-300 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-pop-in">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-2 min-w-0">
            <Camera className="h-5 w-5 text-brand-red flex-shrink-0" />
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm">{snapshot.camera}</h3>
              <p className="text-[13px] text-slate-400 font-medium">Snapshot Heatmap Evidence</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-all cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Frame kamera */}
        <div className="relative aspect-[16/10] bg-slate-950 overflow-hidden">
          <img src={snapshot.imageUrl} alt={snapshot.camera} className="w-full h-full object-cover" />

          {/* Heatmap dulu, baru kotak deteksi — urutan ini penting: kotak & label
              harus terbaca DI ATAS panas, bukan ikut terkena blur. */}
          <CctvHeatmapLayer blur={30} />

          {detectionBoxes.map((b, i) => (
            <div
              key={i}
              className="absolute border-2 border-emerald-400 pointer-events-none"
              style={{ left: b.x, top: b.y, width: b.w, height: b.h }}
            >
              <span className="absolute -top-[15px] left-0 bg-emerald-400 text-emerald-950 text-[10px] font-mono font-bold px-1 leading-[14px] whitespace-nowrap">
                {b.label} [{b.score}]
              </span>
            </div>
          ))}

          {/* Kelengkapan perekam: REC + jam di kiri, ID kamera di kanan */}
          <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2 pointer-events-none">
            <div className="flex flex-col items-start gap-1.5">
              <span className="flex items-center gap-2 bg-black/70 backdrop-blur-md text-white text-[12px] font-mono font-bold px-2.5 py-1 rounded-lg border border-white/20">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" /> REC
                <span className="text-white/60">|</span>
                {snapshot.time}
              </span>
              <span className="bg-black/70 backdrop-blur-md text-white/80 text-[11px] font-mono font-bold px-2 py-0.5 rounded-md border border-white/15">
                FPS: 28
              </span>
            </div>

            <span className="bg-black/70 backdrop-blur-md text-white text-[12px] font-mono font-bold px-2.5 py-1 rounded-lg border border-white/20">
              CAM-{snapshot.camId.padStart(2, "0")}
            </span>
          </div>

          {/* Model & keyakinan */}
          <div className="absolute bottom-3 left-3 flex flex-col items-start gap-1.5">
            <span className="bg-black/70 backdrop-blur-md text-white text-[12px] font-mono font-bold px-2.5 py-1 rounded-lg border border-white/20 flex items-center gap-1.5">
              <Flame className="h-3.5 w-3.5 text-orange-400" /> {snapshot.aiMode}
            </span>
            <span className="bg-emerald-500/85 text-white text-[12px] font-mono font-bold px-2.5 py-1 rounded-lg border border-emerald-300/30 flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" /> AI Confidence: {snapshot.confidence}
            </span>
          </div>

          {/* Legenda kepadatan, kanan bawah seperti pada tampilan operator */}
          <div className="absolute bottom-3 right-3">
            <CctvHeatmapLegend />
          </div>
        </div>

        {/* Keterangan & aksi, dipindah ke bawah gambar supaya tidak menutupi heatmap */}
        <div className="flex items-center justify-between gap-3 px-6 py-3.5 bg-slate-50/80 border-t border-slate-200">
          <div className="min-w-0">
            <span className="flex items-center gap-1.5 text-[13px] font-bold text-slate-600">
              <MapPin className="h-3.5 w-3.5 text-brand-red flex-shrink-0" /> {snapshot.location}
            </span>
            <span className="flex items-center gap-1.5 text-[12px] font-mono font-semibold text-slate-400 mt-1">
              <Clock className="h-3.5 w-3.5 flex-shrink-0" /> Captured at {snapshot.time}
            </span>
          </div>
          <button
            onClick={() => alert("Mengunduh gambar bukti snapshot...")}
            className="flex items-center gap-2 bg-brand-red text-white text-xs font-extrabold px-4 py-2 rounded-xl shadow-md hover:bg-red-700 transition-all cursor-pointer flex-shrink-0"
          >
            <Download className="h-4 w-4" /> Download Snapshot
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

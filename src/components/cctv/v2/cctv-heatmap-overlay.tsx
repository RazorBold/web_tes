"use client";

import React from "react";
import { heatBlobs, heatLegend, HEAT_LEVELS } from "@/config/cctv";

/**
 * Lapisan heatmap di atas frame kamera. Dipakai bersama oleh thumbnail kartu
 * Snapshot Heatmap dan lightbox-nya, supaya pola panas yang terlihat di daftar
 * sama persis dengan yang terbuka saat diklik.
 *
 * Blur-nya WAJIB ikut ukuran tampil: bulatan diposisikan dalam persen, jadi di
 * thumbnail 68px sebuah blur 28px akan meleburkan semuanya jadi satu kabut rata.
 * Karena itu `blur` jadi prop, bukan nilai tetap.
 */
export function CctvHeatmapLayer({ blur = 28 }: { blur?: number }) {
  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{ filter: `blur(${blur}px)` }}
      aria-hidden
    >
      {heatBlobs.map((b, i) => (
        <span
          key={i}
          className="absolute rounded-full"
          style={{
            left: b.x,
            top: b.y,
            width: b.size,
            height: b.size,
            transform: "translate(-50%, -50%)",
            background: `radial-gradient(circle, ${HEAT_LEVELS[b.level].glow} 0%, transparent 70%)`,
          }}
        />
      ))}
    </div>
  );
}

/** Legenda Low / Mid / High. `compact` untuk dipakai di dalam kartu. */
export function CctvHeatmapLegend({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="flex items-center gap-2.5">
        {heatLegend.map((lvl) => (
          <span key={lvl} className="flex items-center gap-1">
            <span className={`h-2 w-2 rounded-sm ${HEAT_LEVELS[lvl].dot}`} />
            <span className="text-[11px] font-bold text-slate-500 leading-none">
              {HEAT_LEVELS[lvl].label}
            </span>
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-px bg-black/70 backdrop-blur-md border border-white/20 rounded-lg overflow-hidden p-1">
      {heatLegend.map((lvl) => (
        <span key={lvl} className="flex items-center gap-1.5 pr-1.5">
          <span className={`h-3.5 w-5 rounded-sm ${HEAT_LEVELS[lvl].dot}`} />
          <span className="text-[11px] font-bold text-white">{HEAT_LEVELS[lvl].label}</span>
        </span>
      ))}
    </div>
  );
}

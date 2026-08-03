"use client";

import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight, Users, Timer, Clock, Scan } from "lucide-react";
import { useCctvEvents } from "@/hooks/use-cctv-events";
import type { QueueSample } from "@/lib/cctv-queue";

interface Props {
  sample: QueueSample;
  index: number;
  total: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

const jam = (iso: string) =>
  new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
const tanggal = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" });
const durasi = (d: number) => (d >= 60 ? `${(d / 60).toFixed(1)} menit` : `${Math.round(d)} detik`);

/**
 * Menggambar zona antrean di atas foto bukti.
 *
 * Koordinat zona memakai resolusi ACUAN 1920×1080 (dari pesan init wsai),
 * sementara foto buktinya 960×540 — setengah skalanya. Karena itu penskalaan
 * bertumpu pada `aiRef`, bukan pada ukuran foto: begitu NVR mengubah resolusi
 * simpanannya, gambar ini tetap benar tanpa perlu diutak-atik.
 */
function ZonaOverlay({
  imgRef,
  zones,
  refSize,
}: {
  imgRef: React.RefObject<HTMLImageElement | null>;
  zones: { points: [number, number][] }[];
  refSize: { width: number; height: number } | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    let raf = 0;
    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const cssW = img.clientWidth;
      const cssH = img.clientHeight;
      if (!cssW || !cssH) {
        raf = requestAnimationFrame(draw);
        return;
      }

      if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
        canvas.width = Math.round(cssW * dpr);
        canvas.height = Math.round(cssH * dpr);
      }
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssW, cssH);

      const refW = refSize?.width || img.naturalWidth || cssW;
      const refH = refSize?.height || img.naturalHeight || cssH;

      // Foto ditampilkan dengan object-contain, jadi ada bilah kosong bila
      // rasionya berbeda — offset di bawah yang menjaga zona tetap pas.
      const scale = Math.min(cssW / refW, cssH / refH);
      const offX = (cssW - refW * scale) / 2;
      const offY = (cssH - refH * scale) / 2;
      const sx = (x: number) => offX + x * scale;
      const sy = (y: number) => offY + y * scale;

      for (const z of zones) {
        if (z.points.length < 3) continue;
        ctx.beginPath();
        ctx.moveTo(sx(z.points[0][0]), sy(z.points[0][1]));
        for (const [px, py] of z.points.slice(1)) ctx.lineTo(sx(px), sy(py));
        ctx.closePath();

        ctx.fillStyle = "rgba(56,189,248,0.12)";
        ctx.fill();
        ctx.strokeStyle = "rgba(2,6,23,0.55)";
        ctx.lineWidth = 3.5;
        ctx.setLineDash([9, 6]);
        ctx.stroke();
        ctx.strokeStyle = "#38BDF8";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.setLineDash([]);

        // Label menempel di titik paling kiri-atas zona.
        const tx = sx(Math.min(...z.points.map((p) => p[0])));
        const ty = sy(Math.min(...z.points.map((p) => p[1])));
        const teks = "Zona antrean";
        ctx.font = "700 12px system-ui, sans-serif";
        ctx.textBaseline = "top";
        ctx.lineJoin = "round";
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = "rgba(2,6,23,0.75)";
        ctx.strokeText(teks, tx + 6, Math.max(ty + 6, 4));
        ctx.fillStyle = "#38BDF8";
        ctx.fillText(teks, tx + 6, Math.max(ty + 6, 4));
      }

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [imgRef, zones, refSize]);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />;
}

/** Foto bukti tunggal, diperbesar, dengan zona antrean digambar di atasnya. */
export default function CctvQueueLightbox({ sample, index, total, onClose, onPrev, onNext }: Props) {
  const imgRef = useRef<HTMLImageElement>(null);
  // Zona diambil dari pesan init wsai — hanya sumber yang memilikinya. Koneksi
  // ini menutup sendiri begitu lightbox ditutup.
  const ai = useCctvEvents("antrian");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onPrev, onNext]);

  if (typeof document === "undefined") return null;

  const info = [
    { Icon: Users, label: "Orang terpantau", value: `${sample.people}` },
    { Icon: Timer, label: "Tunggu terlama", value: durasi(sample.maxStay) },
    { Icon: Clock, label: "Rata-rata tunggu", value: durasi(sample.avgStay) },
    { Icon: Scan, label: "Di zona saat itu", value: `${sample.current}` },
  ];

  return createPortal(
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      // z lebih tinggi dari panel bukti (z-60) supaya menumpang di atasnya.
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md"
      role="dialog"
      aria-label={`Bukti pukul ${jam(sample.time)}`}
    >
      <div className="relative w-full max-w-[1000px] max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700/70 rounded-3xl overflow-hidden shadow-2xl animate-pop-in">
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-slate-800 flex-shrink-0">
          <div className="min-w-0">
            <h3 className="text-[15px] font-extrabold text-white">
              {jam(sample.time)} · {sample.people} orang
            </h3>
            <p className="text-[12px] font-semibold text-slate-400">
              {tanggal(sample.time)} · bukti {index + 1} dari {total}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="relative flex-1 min-h-0 bg-slate-950 flex items-center justify-center">
          {sample.imagePath ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imgRef}
                src={`/api/v1/cctv/cameras/antrian/snapshot?path=${encodeURIComponent(sample.imagePath)}`}
                alt={`Antrean ${sample.people} orang pukul ${jam(sample.time)}`}
                className="block max-h-[62vh] w-auto object-contain"
              />
              <ZonaOverlay imgRef={imgRef} zones={ai.zones} refSize={ai.ref} />
            </div>
          ) : (
            <p className="text-[13px] font-semibold text-slate-500 py-20">Gambar tidak tersedia</p>
          )}

          <button
            onClick={onPrev}
            aria-label="Bukti sebelumnya"
            className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-900/80 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={onNext}
            aria-label="Bukti berikutnya"
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-900/80 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 px-5 py-3 border-t border-slate-800 flex-shrink-0">
          {info.map((i) => (
            <div key={i.label} className="rounded-xl bg-slate-800/60 border border-slate-700/60 px-3 py-2">
              <span className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wide text-slate-400">
                <i.Icon className="h-3 w-3" />
                {i.label}
              </span>
              <span className="block text-[18px] font-black font-mono leading-none mt-1.5 text-white">
                {i.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}

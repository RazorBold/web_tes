"use client";

import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight, Users, Clock, Timer, MoonStar } from "lucide-react";
import type { HeatmapFrame } from "@/lib/cctv-heatmap";

interface Props {
  frame: HeatmapFrame;
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

/**
 * Heatmap ukuran penuh.
 *
 * Tidak ada canvas overlay di sini — panasnya sudah menyatu ke dalam JPEG saat
 * dirender di server. Itu memang tujuannya: yang disimpan gambar jadi, supaya
 * menampilkannya tidak memerlukan proses apa pun.
 */
export default function CctvHeatmapLightbox({ frame, index, total, onClose, onPrev, onNext }: Props) {
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

  const kosong = frame.status === "empty";
  const info = [
    {
      Icon: Users,
      label: "Titik terdeteksi",
      value: kosong ? "0" : frame.points.toLocaleString("id-ID"),
    },
    { Icon: Timer, label: "Jendela deteksi", value: `${frame.windowSec} detik` },
    { Icon: Clock, label: "Jam gambar", value: jam(frame.capturedAt) },
    { Icon: MoonStar, label: "Jendela dilebarkan", value: frame.widened ? "Ya" : "Tidak" },
  ];

  return createPortal(
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md"
      role="dialog"
      aria-label={`Heatmap pukul ${jam(frame.capturedAt)}`}
    >
      <div className="relative w-full max-w-[1240px] max-h-[94vh] flex flex-col bg-slate-900 border border-slate-700/70 rounded-3xl overflow-hidden shadow-2xl animate-pop-in">
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-slate-800 flex-shrink-0">
          <div className="min-w-0">
            <h3 className="text-[15px] font-extrabold text-white">
              Heatmap {jam(frame.capturedAt)}
              {!kosong && ` · ${frame.points.toLocaleString("id-ID")} titik`}
            </h3>
            <p className="text-[12px] font-semibold text-slate-400">
              {tanggal(frame.capturedAt)} · {index + 1} dari {total}
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

        {/* Sama seperti lightbox antrean: tinggi foto dikurangi tinggi header +
            baris keterangan, supaya tidak terpotong `overflow-hidden` di layar
            pendek. */}
        <div className="relative flex-1 min-h-0 bg-slate-950 flex items-center justify-center p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/v1/cctv/heatmap/image?id=${frame.id}&size=full`}
            alt={`Heatmap pukul ${jam(frame.capturedAt)}`}
            className="block h-[calc(94vh-190px)] max-w-full w-auto object-contain"
          />

          {kosong && (
            <span className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 text-[12px] font-bold px-3 py-1.5 rounded-full bg-amber-500/90 text-amber-950">
              <MoonStar className="h-3.5 w-3.5" />
              Tidak ada orang terdeteksi — bukan kegagalan render
            </span>
          )}

          <button
            onClick={onPrev}
            aria-label="Heatmap sebelumnya"
            className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-900/80 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={onNext}
            aria-label="Heatmap berikutnya"
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

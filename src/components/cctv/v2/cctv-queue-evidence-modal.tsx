"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Users, Clock, TrendingUp, RefreshCw, ImageOff, Timer } from "lucide-react";
import { useCctvQueue, useCctvQueueSamples } from "@/hooks/use-cctv-queue";
import CctvQueueLightbox from "./cctv-queue-lightbox";
import type { QueueSample } from "@/lib/cctv-queue";

interface Props {
  onClose: () => void;
}

const jam = (iso: string) =>
  new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

/** Detik → teks pendek. Menit dipakai begitu melewati satu menit. */
const durasi = (detik: number) =>
  detik >= 60 ? `${(detik / 60).toFixed(1)} mnt` : `${Math.round(detik)} dtk`;

/** Warna mengikuti ukuran kerumunan; selalu berpasangan dengan angkanya. */
const nadaKerumunan = (n: number) =>
  n >= 6 ? "bg-rose-500 text-white" : n >= 3 ? "bg-amber-500 text-white" : "bg-emerald-500 text-white";

function KartuBukti({ s, onOpen }: { s: QueueSample; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      title="Lihat lebih besar"
      className="text-left rounded-xl overflow-hidden border border-slate-700 bg-slate-900 hover:border-sky-400/60 hover:ring-2 hover:ring-sky-400/20 transition-all cursor-pointer"
    >
      <div className="relative aspect-video bg-slate-950">
        {s.imagePath ? (
          // Lewat proxy kita — gambar di NVR dilindungi header Authorization.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/v1/cctv/cameras/antrian/snapshot?path=${encodeURIComponent(s.imagePath)}`}
            alt={`Antrean ${s.people} orang pukul ${jam(s.time)}`}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-slate-600">
            <ImageOff className="h-6 w-6" />
            <span className="text-[11px] font-semibold">tanpa gambar</span>
          </div>
        )}

        <span
          className={`absolute top-1.5 left-1.5 flex items-center gap-1 text-[11px] font-extrabold px-1.5 py-0.5 rounded-md ${nadaKerumunan(
            s.people
          )}`}
        >
          <Users className="h-3 w-3" />
          {s.people}
        </span>

        {s.maxStay > 0 && (
          <span className="absolute top-1.5 right-1.5 flex items-center gap-1 text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-md bg-black/70 text-amber-300">
            <Timer className="h-2.5 w-2.5" />
            {durasi(s.maxStay)}
          </span>
        )}
      </div>

      <div className="px-2 py-1.5 leading-tight">
        <span className="block text-[12px] font-mono font-bold text-white">{jam(s.time)}</span>
        <span className="block text-[10px] font-semibold text-slate-400">
          rata-rata tunggu {durasi(s.avgStay)}
        </span>
      </div>
    </button>
  );
}

/**
 * Panel bukti People Crowded: akumulasi hari ini di atas, lalu foto bukti tiap
 * sampel yang memuat orang.
 *
 * Sampel berzona kosong tidak ikut ditampilkan — separuh lebih sampel harian
 * berisi nol orang, dan menampilkannya hanya memenuhi panel dengan foto ruangan
 * kosong.
 */
export default function CctvQueueEvidenceModal({ onClose }: Props) {
  const { data: ringkasan } = useCctvQueue();
  const { data: samples, isFetching, error } = useCctvQueueSamples(true, 40);
  const [dipilih, setDipilih] = useState<number | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (typeof document === "undefined") return null;

  const tiles = [
    {
      label: "Puncak hari ini",
      value: ringkasan ? `${ringkasan.peakPeople} orang` : "—",
      note: ringkasan?.peakAt ? `pukul ${jam(ringkasan.peakAt)}` : "",
      warna: "text-rose-400",
      Icon: TrendingUp,
    },
    {
      label: "Tunggu terlama",
      value: ringkasan ? durasi(ringkasan.longestStay) : "—",
      note: "",
      warna: "text-amber-300",
      Icon: Timer,
    },
    {
      label: "Rata-rata tunggu",
      value: ringkasan ? durasi(ringkasan.avgStay) : "—",
      note: "",
      warna: "text-sky-300",
      Icon: Clock,
    },
    {
      label: "Di zona sekarang",
      value: ringkasan?.currentPeople != null ? `${ringkasan.currentPeople} orang` : "—",
      note: ringkasan?.lastSampleAt ? `sampel ${jam(ringkasan.lastSampleAt)}` : "",
      warna: "text-emerald-400",
      Icon: Users,
    },
  ];

  return createPortal(
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-slate-950/90 backdrop-blur-md"
      role="dialog"
      aria-label="Bukti People Crowded"
    >
      <div className="relative w-full max-w-[1100px] max-h-[90vh] flex flex-col bg-slate-900 border border-slate-700/70 rounded-3xl overflow-hidden shadow-2xl animate-pop-in">
        <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-800 flex-shrink-0">
          <div className="min-w-0">
            <h3 className="text-[16px] font-extrabold text-white">People Crowded — Bukti</h3>
            <p className="text-[12px] font-semibold text-slate-400">
              {ringkasan
                ? `${ringkasan.totalCrowded} sampel berisi orang dari ${ringkasan.totalSamples} sampel hari ini`
                : "Memuat…"}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span
              className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-xl border ${
                isFetching
                  ? "bg-amber-500/15 text-amber-300 border-amber-400/30"
                  : "bg-emerald-500/15 text-emerald-300 border-emerald-400/30"
              }`}
            >
              <RefreshCw className={`h-3 w-3 ${isFetching ? "animate-spin" : ""}`} />
              {isFetching ? "Memuat" : "Terkini"}
            </span>
            <button
              onClick={onClose}
              aria-label="Tutup"
              className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 px-5 py-3 border-b border-slate-800 flex-shrink-0">
          {tiles.map((t) => (
            <div key={t.label} className="rounded-xl bg-slate-800/60 border border-slate-700/60 px-3 py-2">
              <span className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wide text-slate-400">
                <t.Icon className="h-3 w-3" />
                {t.label}
              </span>
              <span className={`block text-[20px] font-black font-mono leading-none mt-1.5 ${t.warna}`}>
                {t.value}
              </span>
              {t.note && <span className="block text-[10px] font-semibold text-slate-500 mt-1">{t.note}</span>}
            </div>
          ))}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4">
          {error ? (
            <p className="text-center text-[13px] font-semibold text-rose-300 py-10">
              {error instanceof Error ? error.message : "Gagal mengambil bukti"}
            </p>
          ) : !samples ? (
            <p className="text-center text-[13px] font-semibold text-slate-400 py-10">Memuat bukti…</p>
          ) : samples.length === 0 ? (
            <p className="text-center text-[13px] font-semibold text-slate-400 py-10">
              Belum ada sampel berisi orang hari ini.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {samples.map((s, i) => (
                <KartuBukti key={s.time} s={s} onOpen={() => setDipilih(i)} />
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Lightbox menumpang di atas panel ini; penelusuran melingkar supaya
          tombol maju/mundur tidak pernah mentok. */}
      {dipilih != null && samples?.[dipilih] && (
        <CctvQueueLightbox
          sample={samples[dipilih]}
          index={dipilih}
          total={samples.length}
          onClose={() => setDipilih(null)}
          onPrev={() => setDipilih((i) => ((i ?? 0) - 1 + samples.length) % samples.length)}
          onNext={() => setDipilih((i) => ((i ?? 0) + 1) % samples.length)}
        />
      )}
    </div>,
    document.body
  );
}

"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, LogIn, LogOut, Users, RefreshCw, ImageOff, Repeat } from "lucide-react";
import { useCctvVisitor, useCctvVisitorHits } from "@/hooks/use-cctv-visitor";
import CctvVisitorLightbox from "./cctv-visitor-lightbox";
import type { VisitorHit } from "@/lib/cctv-visitor";

interface Props {
  onClose: () => void;
}

const ARAH = {
  in: { label: "Masuk", chip: "bg-emerald-500 text-white", Icon: LogIn },
  out: { label: "Keluar", chip: "bg-rose-500 text-white", Icon: LogOut },
  lingering: { label: "Bolak-balik", chip: "bg-slate-500 text-white", Icon: Repeat },
} as const;

const jam = (iso: string) =>
  new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

function KartuLintasan({ hit, onOpen }: { hit: VisitorHit; onOpen: () => void }) {
  const arah = ARAH[hit.direction];
  const { Icon } = arah;

  return (
    <button
      onClick={onOpen}
      title="Lihat satu foto ini lebih besar"
      className="group text-left rounded-xl overflow-hidden border border-slate-700 bg-slate-900 hover:border-sky-400/70 transition-colors cursor-pointer">
      <div className="relative aspect-[3/4] bg-slate-950">
        {hit.imagePath ? (
          // Lewat proxy kita — gambar di NVR dilindungi header Authorization
          // yang tidak bisa dikirim oleh tag <img>.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/v1/cctv/cameras/visitor/snapshot?path=${encodeURIComponent(hit.imagePath)}`}
            alt={`Lintasan ${arah.label} pukul ${jam(hit.time)}`}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-slate-600">
            <ImageOff className="h-6 w-6" />
            <span className="text-[11px] font-semibold">tanpa gambar</span>
          </div>
        )}

        <span
          className={`absolute top-1.5 left-1.5 flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wide px-1.5 py-0.5 rounded-md ${arah.chip}`}
        >
          <Icon className="h-3 w-3" />
          {arah.label}
        </span>

        {/* Jumlah lintasan hanya ditampilkan bila lebih dari satu — itulah
            penanda orang yang bolak-balik di garis, bukan sekadar lewat. */}
        {hit.crossings > 1 && (
          <span className="absolute top-1.5 right-1.5 text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-md bg-black/70 text-amber-300">
            {hit.crossings}×
          </span>
        )}
      </div>

      <div className="px-2 py-1.5 leading-tight">
        <span className="block text-[12px] font-mono font-bold text-white">{jam(hit.time)}</span>
        <span className="block text-[10px] font-semibold text-slate-400 truncate">{hit.label}</span>
      </div>
    </button>
  );
}

/**
 * Panel pemantauan People Counting: ringkasan hari ini di atas, lalu lintasan
 * terbaru lengkap dengan cuplikan gambarnya, menyegar sendiri tiap 10 detik.
 *
 * Daftar lintasan diambil LANGSUNG dari NVR, sementara ringkasan di atas dibaca
 * dari MySQL. Keduanya memang beda sumber: yang atas angka harian yang harus
 * bertahan lewat tengah malam, yang bawah potret beberapa menit terakhir.
 */
export default function CctvVisitorHitsModal({ onClose }: Props) {
  const { data: ringkasan } = useCctvVisitor();
  const { data: hits, isFetching, error } = useCctvVisitorHits(true);
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
    { label: "Masuk", value: ringkasan?.in, warna: "text-emerald-400", Icon: LogIn },
    { label: "Keluar", value: ringkasan?.out, warna: "text-rose-400", Icon: LogOut },
    { label: "Orang unik", value: ringkasan?.uniqueVisitors, warna: "text-sky-300", Icon: Users },
    { label: "Bolak-balik", value: ringkasan?.lingering, warna: "text-slate-300", Icon: Repeat },
  ];

  // Di-portal ke <body>: panel Section pembungkus memakai backdrop-blur, yang
  // menjadikannya containing block untuk position:fixed.
  return createPortal(
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-slate-950/90 backdrop-blur-md"
      role="dialog"
      aria-label="Pemantauan People Counting"
    >
      <div className="relative w-full max-w-[1100px] max-h-[90vh] flex flex-col bg-slate-900 border border-slate-700/70 rounded-3xl overflow-hidden shadow-2xl animate-pop-in">
        <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-800 flex-shrink-0">
          <div className="min-w-0">
            <h3 className="text-[16px] font-extrabold text-white">People Counting — Pemantauan</h3>
            <p className="text-[12px] font-semibold text-slate-400">
              Lintasan hari ini · menyegar tiap 10 detik
              {ringkasan?.active ? ` · ${ringkasan.active} sedang di depan kamera` : ""}
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

        {/* Ringkasan hari ini */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 px-5 py-3 border-b border-slate-800 flex-shrink-0">
          {tiles.map((t) => (
            <div key={t.label} className="rounded-xl bg-slate-800/60 border border-slate-700/60 px-3 py-2">
              <span className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wide text-slate-400">
                <t.Icon className="h-3 w-3" />
                {t.label}
              </span>
              <span className={`block text-[24px] font-black font-mono leading-none mt-1.5 ${t.warna}`}>
                {t.value ?? "—"}
              </span>
            </div>
          ))}
        </div>

        {/* Daftar lintasan */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4">
          {error ? (
            <p className="text-center text-[13px] font-semibold text-rose-300 py-10">
              {error instanceof Error ? error.message : "Gagal mengambil lintasan"}
            </p>
          ) : !hits ? (
            <p className="text-center text-[13px] font-semibold text-slate-400 py-10">Memuat lintasan…</p>
          ) : hits.length === 0 ? (
            <p className="text-center text-[13px] font-semibold text-slate-400 py-10">
              Belum ada lintasan hari ini.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {hits.map((h, i) => (
                <KartuLintasan
                  key={`${h.trackId}-${h.time}`}
                  hit={h}
                  onOpen={() => setDipilih(i)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {dipilih != null && hits?.[dipilih] && (
        <CctvVisitorLightbox
          hit={hits[dipilih]}
          index={dipilih}
          total={hits.length}
          onClose={() => setDipilih(null)}
          onPrev={() => setDipilih((i) => ((i ?? 0) - 1 + hits.length) % hits.length)}
          onNext={() => setDipilih((i) => ((i ?? 0) + 1) % hits.length)}
        />
      )}
    </div>,
    document.body
  );
}

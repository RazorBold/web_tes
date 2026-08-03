"use client";

import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight, LogIn, LogOut, Repeat, Clock, Hash, ImageOff } from "lucide-react";
import type { VisitorHit } from "@/lib/cctv-visitor";

interface Props {
  hit: VisitorHit;
  index: number;
  total: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

const ARAH = {
  in: { label: "Masuk", chip: "bg-emerald-500 text-white", warna: "text-emerald-400", Icon: LogIn },
  out: { label: "Keluar", chip: "bg-rose-500 text-white", warna: "text-rose-400", Icon: LogOut },
  lingering: { label: "Bolak-balik", chip: "bg-slate-500 text-white", warna: "text-slate-300", Icon: Repeat },
} as const;

const jam = (iso: string) =>
  new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
const tanggal = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" });

/**
 * Satu foto lintasan, diperbesar.
 *
 * Perlu terpisah dari panel kisi: di kisi, tiap foto cuma selebar ±150px dan
 * yang terbaca hanya "ada orang lewat". Untuk memastikan SIAPA dan ke arah mana,
 * fotonya harus dilihat satu per satu.
 *
 * Tidak ada kotak deteksi digambar di sini — berbeda dengan bukti antrean yang
 * memotret seluruh pemandangan, tangkapan lintasan dari NVR SUDAH dipotong
 * mengikuti kotak orangnya. Menggambar kotak lagi hanya membingkai ulang tepi
 * gambar.
 */
export default function CctvVisitorLightbox({ hit, index, total, onClose, onPrev, onNext }: Props) {
  const arah = ARAH[hit.direction];
  const { Icon } = arah;

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
    { Icon: arah.Icon, label: "Arah", value: arah.label, warna: arah.warna },
    { Icon: Clock, label: "Waktu", value: jam(hit.time), warna: "text-white" },
    {
      Icon: Repeat,
      label: "Melintas garis",
      value: `${hit.crossings}×`,
      warna: hit.crossings > 1 ? "text-amber-300" : "text-white",
    },
    { Icon: Hash, label: "Id lacak", value: hit.trackId, warna: "text-sky-300" },
  ];

  return createPortal(
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      // z lebih tinggi dari panel pemantauan (z-60) supaya menumpang di atasnya.
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md"
      role="dialog"
      aria-label={`Lintasan pukul ${jam(hit.time)}`}
    >
      {/* Sengaja jauh lebih sempit dari lightbox antrean & heatmap: tangkapan
          lintasan itu potongan orang yang tinggi-kurus (terukur 57–81 px lebar
          dari 158–217 px tinggi), jadi jendela selebar 1240px akan hampir
          seluruhnya kosong. 560px pas menampung empat tile keterangan di kaki. */}
      <div className="relative w-full max-w-[560px] max-h-[94vh] flex flex-col bg-slate-900 border border-slate-700/70 rounded-3xl overflow-hidden shadow-2xl animate-pop-in">
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-slate-800 flex-shrink-0">
          <div className="min-w-0">
            <h3 className="flex items-center gap-2 text-[15px] font-extrabold text-white">
              <span
                className={`flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-md ${arah.chip}`}
              >
                <Icon className="h-3 w-3" />
                {arah.label}
              </span>
              {jam(hit.time)}
            </h3>
            <p className="text-[12px] font-semibold text-slate-400">
              {tanggal(hit.time)} · lintasan {index + 1} dari {total}
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

        {/* Tinggi foto dikurangi tinggi header + baris keterangan, bukan angka vh
            polos — kalau tidak, pada layar pendek fotonya terpotong diam-diam
            oleh `overflow-hidden`. */}
        <div className="relative flex-1 min-h-0 bg-slate-950 flex items-center justify-center p-3">
          {hit.imagePath ? (
            // Lewat proxy kita — gambar di NVR dilindungi header Authorization
            // yang tidak bisa dikirim oleh tag <img>.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/v1/cctv/cameras/visitor/snapshot?path=${encodeURIComponent(hit.imagePath)}`}
              alt={`Lintasan ${arah.label} pukul ${jam(hit.time)}`}
              className="block h-[calc(94vh-190px)] max-w-full w-auto object-contain rounded-lg"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 py-20 text-slate-500">
              <ImageOff className="h-8 w-8" />
              <span className="text-[13px] font-semibold">Gambar tidak tersedia</span>
            </div>
          )}

          <button
            onClick={onPrev}
            aria-label="Lintasan sebelumnya"
            className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-900/80 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={onNext}
            aria-label="Lintasan berikutnya"
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
              <span className={`block text-[18px] font-black font-mono leading-none mt-1.5 truncate ${i.warna}`}>
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

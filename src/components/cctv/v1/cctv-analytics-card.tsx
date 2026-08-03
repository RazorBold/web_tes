"use client";

import React from "react";
import type { LucideIcon } from "lucide-react";

/**
 * Rangka bersama untuk keempat kartu analitik di halaman /cctv.
 *
 * Sengaja dipakai bersama supaya ukuran kartu benar-benar sama: frame, padding,
 * tinggi header (44px), dan area isi yang mengisi sisa ruang. Tinggi total
 * ditentukan oleh grid induk (lihat app/(dashboard)/cctv/page.tsx), bukan oleh
 * masing-masing kartu — dulu tiap kartu menaruh h-[180px] sendiri sehingga
 * mudah lepas sinkron.
 */

/**
 * Skala tipografi bersama keempat kartu analitik.
 *
 * Ada di sini, bukan ditulis lepas di tiap kartu, karena masalahnya bukan "angka
 * ini kurang besar" melainkan PERAN YANG SAMA TAMPIL BEDA UKURAN antar kartu:
 * dulu persentase gender 16px sementara persentase mood 15px, angka Masuk 26px
 * sementara angka bucket kerumunan 20px, dan total 8.412 di tengah donut cuma
 * 18px padahal itu angka utama kartunya. Berdampingan, keempat kartu jadi terasa
 * tidak satu keluarga.
 *
 * Aturannya: setiap angka/label memilih peran, bukan ukuran.
 *   headline → satu per kartu saja, angka yang jadi inti kartu itu
 *   stat     → angka di dalam tile/baris (persentase, jumlah masuk-keluar, bucket)
 *   micro    → jumlah mentah pendamping, selalu di sebelah `stat`
 *
 * `font-mono` dipertahankan karena seluruh aplikasi memakainya untuk angka;
 * `tracking-tight` di `headline` mengimbangi mono yang melebar di ukuran besar.
 */
export const CARD_TEXT = {
  headline: "text-[36px] font-black font-mono leading-none tracking-tight text-slate-800",
  stat: "text-[20px] font-black font-mono leading-none text-slate-800",
  micro: "text-[11px] font-mono font-bold leading-none text-slate-400",
  /** Judul sub-bagian di dalam kartu. */
  section: "text-[11px] font-black uppercase tracking-[0.12em] leading-none text-slate-400",
  /** Nama baris / kategori (Happy, 01. Lobby Utama, …). */
  item: "text-[13px] font-extrabold leading-none text-slate-700",
  /** Label kecil di atas angka `stat`. */
  tile: "text-[11px] font-extrabold uppercase tracking-wider leading-none",
  /** Catatan kaki & keterangan. */
  note: "text-[11px] font-semibold leading-snug text-slate-400",
} as const;

type Accent = "emerald" | "orange" | "purple" | "amber";

// Kelas ditulis literal, bukan dirangkai dari variabel — Tailwind hanya
// men-generate kelas yang muncul apa adanya di source.
const ACCENTS: Record<Accent, { wrap: string; icon: string }> = {
  emerald: { wrap: "bg-emerald-500/10 border-emerald-500/20", icon: "text-emerald-600" },
  orange: { wrap: "bg-orange-500/10 border-orange-500/20", icon: "text-orange-500" },
  purple: { wrap: "bg-purple-500/10 border-purple-500/20", icon: "text-purple-600" },
  amber: { wrap: "bg-amber-500/10 border-amber-500/20", icon: "text-amber-500" },
};

interface CctvAnalyticsCardProps {
  title: string;
  Icon: LucideIcon;
  accent: Accent;
  /** Teks chip kanan-atas. Default "Live". */
  badgeLabel?: string;
  /** Chip oranye + tanpa titik berkedip (dipakai Snapshot Evidence). */
  badgeVariant?: "live" | "realtime";
  /** Opsional. Muat di header 44px karena judul & subtitel dua-duanya kecil. */
  subtitle?: string;
  children: React.ReactNode;
}

export default function CctvAnalyticsCard({
  title,
  Icon,
  accent,
  badgeLabel = "Live",
  badgeVariant = "live",
  subtitle,
  children,
}: CctvAnalyticsCardProps) {
  const a = ACCENTS[accent];

  const badgeClass =
    badgeVariant === "live"
      ? "text-emerald-700 bg-emerald-500/10 border-emerald-500/25"
      : "text-orange-600 bg-orange-500/10 border-orange-500/25";
  const badgeDot = badgeVariant === "live" ? "bg-emerald-500" : "bg-orange-500";

  return (
    <div className="flex flex-col h-full min-h-0 bg-white border border-slate-200/90 rounded-[20px] p-4 shadow-[0_6px_24px_rgba(0,0,0,0.05)] hover:shadow-[0_10px_32px_rgba(0,0,0,0.08)] transition-shadow duration-300 overflow-hidden">
      {/* Header — tinggi tetap 44px supaya garis bawahnya sejajar di keempat
          kartu, baik yang bersubtitel maupun tidak. */}
      <div className="flex items-center justify-between gap-2 h-[44px] flex-shrink-0 border-b border-slate-100">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`h-7 w-7 rounded-xl border flex items-center justify-center flex-shrink-0 ${a.wrap}`}
          >
            <Icon className={`h-4 w-4 ${a.icon}`} />
          </span>

          <div className="min-w-0">
            <h4 className="truncate text-[13px] font-black text-slate-800 uppercase tracking-wider">
              {title}
            </h4>
            {subtitle && (
              <p className="truncate text-[11px] font-semibold text-slate-400 leading-none mt-1">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <span
          className={`flex items-center gap-1.5 flex-shrink-0 text-[11px] font-extrabold border rounded-full px-2 py-0.5 ${badgeClass}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${badgeDot}`} />
          {badgeLabel}
        </span>
      </div>

      {/* Isi kartu */}
      <div className="flex-1 min-h-0 pt-3">{children}</div>
    </div>
  );
}

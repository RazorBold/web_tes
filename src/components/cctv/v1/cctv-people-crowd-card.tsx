"use client";

import React, { useState } from "react";
import { UsersRound, Info } from "lucide-react";
import CctvAnalyticsCard, { CARD_TEXT } from "./cctv-analytics-card";
import CctvQueueEvidenceModal from "./cctv-queue-evidence-modal";
import { useCctvQueue } from "@/hooks/use-cctv-queue";

/**
 * People Crowded — berapa kali tiap tingkat kepadatan terpantau hari ini.
 *
 * Dulu kartu ini juga memuat People Counting di bagian atasnya. Keduanya
 * dipisah karena berasal dari KAMERA YANG BERBEDA: People Counting dari Kamera 1
 * (garis hitung), People Crowded dari Kamera 2 (zona antrean). Menyatukannya
 * berarti satu kartu berdiri di bawah panel kamera yang separuh datanya bukan
 * miliknya.
 *
 * Angkanya kejadian deteksi, BUKAN jumlah orang — satu orang yang berdiri lama
 * di zona terhitung berkali-kali. Catatan kaki di bawah menyebutkan itu, dan
 * jangan dihapus: tanpa itu 55 mudah terbaca sebagai "55 orang".
 *
 * Judul bagian bisa diklik untuk membuka foto buktinya.
 */

/** Gaya tiga tile kerumunan. Kelas ditulis literal — Tailwind hanya
 *  men-generate kelas yang muncul apa adanya di source. */
const BUCKET_GAYA = [
  { label: "1 - 5", tile: "bg-emerald-50/60 border-emerald-100", iconWrap: "bg-emerald-100/80 text-emerald-600", chip: "bg-emerald-100/80 text-emerald-700", value: "text-emerald-700" },
  { label: "6 - 10", tile: "bg-amber-50/60 border-amber-100", iconWrap: "bg-amber-100/80 text-amber-600", chip: "bg-amber-100/80 text-amber-700", value: "text-amber-600" },
  { label: "> 10", tile: "bg-rose-50/60 border-rose-100", iconWrap: "bg-rose-100/80 text-rose-500", chip: "bg-rose-100/80 text-rose-600", value: "text-rose-600" },
];

export default function CctvPeopleCrowdCard() {
  const { data: queue } = useCctvQueue();
  const [panelAntrian, setPanelAntrian] = useState(false);

  return (
    <CctvAnalyticsCard
      title="Crowd Detection"
      subtitle="Kepadatan zona antrean"
      Icon={UsersRound}
      accent="emerald"
      badgeLabel="NVR"
      badgeVariant="realtime"
    >
      <div className="flex flex-col h-full min-h-0 gap-2.5">
        <div className="flex items-center justify-between gap-2 flex-shrink-0">
          <button
            onClick={() => setPanelAntrian(true)}
            title="Buka bukti People Crowded"
            className={`${CARD_TEXT.section} hover:text-brand-red underline decoration-dotted underline-offset-4 cursor-pointer transition-colors`}
          >
            Terpantau hari ini
          </button>
          <span className="flex items-baseline gap-1.5 flex-shrink-0">
            <span className="text-[24px] font-black font-mono leading-none text-slate-800">
              {queue ? queue.totalCrowded.toLocaleString("id-ID") : "—"}
            </span>
            <span className={CARD_TEXT.note}>kali</span>
          </span>
        </div>

        {/* Ditumpuk ke bawah sejak kartu ini berdiri sendiri: dengan tinggi 450px
            dan hanya tiga tile, tiga kolom akan jadi tiang kurus setinggi kartu. */}
        <div className="flex flex-col gap-2.5 flex-1 min-h-0">
          {BUCKET_GAYA.map((b, i) => (
            <div
              key={b.label}
              className={`border rounded-2xl px-3.5 py-3 flex items-center justify-between gap-2 flex-1 min-h-0 ${b.tile}`}
            >
              <span className="flex items-center gap-2 min-w-0">
                <span
                  className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${b.iconWrap}`}
                >
                  <UsersRound className="h-4 w-4" />
                </span>
                <span
                  className={`text-[12px] font-extrabold rounded-full px-2 py-0.5 leading-none whitespace-nowrap ${b.chip}`}
                >
                  {b.label}
                </span>
              </span>

              <span className={`${CARD_TEXT.headline} ${b.value} flex-shrink-0`}>
                {queue ? (queue.buckets[i]?.count ?? 0).toLocaleString("id-ID") : "—"}
              </span>
            </div>
          ))}
        </div>

        <p
          className={`flex items-center justify-center gap-1.5 ${CARD_TEXT.note} text-center flex-shrink-0 border-t border-slate-100 pt-2`}
        >
          <Info className="h-3 w-3 flex-shrink-0" />
          Menunjukkan frekuensi kepadatan terpantau, bukan jumlah orang
        </p>
      </div>

      {panelAntrian && <CctvQueueEvidenceModal onClose={() => setPanelAntrian(false)} />}
    </CctvAnalyticsCard>
  );
}

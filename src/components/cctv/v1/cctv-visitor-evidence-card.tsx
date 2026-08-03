"use client";

import React, { useState } from "react";
import { Camera, LogIn, LogOut, Repeat, ImageOff, Eye, RefreshCw } from "lucide-react";
import CctvAnalyticsCard, { CARD_TEXT } from "./cctv-analytics-card";
import CctvVisitorHitsModal from "./cctv-visitor-hits-modal";
import { useCctvVisitorHits } from "@/hooks/use-cctv-visitor";
import type { VisitorHit } from "@/lib/cctv-visitor";

/**
 * Bukti lintasan People Counting — foto tangkapan tiap orang yang melintas garis
 * hitung, terbaru di atas, menyegar sendiri tiap 10 detik.
 *
 * Ini pasangan kartu People Counting: yang sebelah menyajikan angkanya, kartu ini
 * memperlihatkan KEJADIAN di balik angka itu. Tanpa ini, "Masuk 6" cuma angka
 * yang harus dipercaya begitu saja; dengan ini, tiap kenaikannya punya fotonya
 * sendiri lengkap dengan jam dan arahnya.
 *
 * Gambarnya diambil LANGSUNG dari NVR, bukan dari MySQL seperti angka harian di
 * kartu sebelah — yang dipajang di sini kejadiannya sendiri, bukan rekap yang
 * harus bertahan lewat tengah malam.
 *
 * Jendelanya sehari penuh, bukan beberapa jam terakhir: terukur, garis hitung
 * bisa sepi tiga jam berturut-turut padahal hari itu dilewati 104 kali. Daftar
 * yang menulis "belum ada" pada sore yang sepi menyesatkan pembacanya.
 */

const ARAH = {
  in: { label: "Masuk", chip: "bg-emerald-100 text-emerald-700", Icon: LogIn },
  out: { label: "Keluar", chip: "bg-rose-100 text-rose-600", Icon: LogOut },
  lingering: { label: "Bolak-balik", chip: "bg-slate-200 text-slate-600", Icon: Repeat },
} as const;

const jam = (iso: string) =>
  new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

function BarisLintasan({ hit, onOpen }: { hit: VisitorHit; onOpen: () => void }) {
  const arah = ARAH[hit.direction];
  const { Icon } = arah;

  return (
    <button
      onClick={onOpen}
      className="group w-full text-left flex items-center gap-2.5 bg-white border border-slate-200 rounded-xl p-1.5 hover:border-brand-red/50 hover:shadow-sm transition-all duration-200 cursor-pointer"
    >
      {/* Potret, bukan lanskap: tangkapan NVR untuk lintasan orang memang
          dipotong mengikuti kotak orangnya. */}
      <div className="relative w-[46px] aspect-[3/4] rounded-lg overflow-hidden bg-slate-900 flex-shrink-0">
        {hit.imagePath ? (
          // Lewat proxy kita — gambar di NVR dilindungi header Authorization
          // yang tidak bisa dikirim oleh tag <img>.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/v1/cctv/cameras/visitor/snapshot?path=${encodeURIComponent(hit.imagePath)}`}
            alt={`Lintasan ${arah.label} pukul ${jam(hit.time)}`}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-slate-600">
            <ImageOff className="h-4 w-4" />
          </span>
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Eye className="h-3.5 w-3.5 text-white" />
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wide px-1.5 py-0.5 rounded-md ${arah.chip}`}
          >
            <Icon className="h-2.5 w-2.5 flex-shrink-0" />
            {arah.label}
          </span>
          {/* Jumlah lintasan hanya muncul bila lebih dari satu — itulah penanda
              orang yang bolak-balik di garis, bukan sekadar lewat sekali. */}
          {hit.crossings > 1 && (
            <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-700">
              {hit.crossings}×
            </span>
          )}
        </span>

        <span className="block text-[13px] font-extrabold font-mono leading-none text-slate-700 mt-1.5">
          {jam(hit.time)}
        </span>
      </div>
    </button>
  );
}

export default function CctvVisitorEvidenceCard() {
  // `true` — kartu ini memang selalu tampil, jadi tidak ada gunanya menunda.
  const { data: hits, isFetching, error } = useCctvVisitorHits(true);
  const [panelTerbuka, setPanelTerbuka] = useState(false);

  return (
    <>
      <CctvAnalyticsCard
        title="Bukti Lintasan"
        subtitle="Tangkapan tiap orang melintas"
        Icon={Camera}
        accent="purple"
        badgeLabel="NVR"
        badgeVariant="realtime"
      >
        <div className="flex flex-col h-full min-h-0">
          <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
            {error && (
              <p className="text-center text-[12px] font-semibold text-rose-500 py-8 px-4">
                {error instanceof Error ? error.message : "Gagal mengambil lintasan"}
              </p>
            )}

            {!error && !hits && (
              <p className="text-center text-[12px] font-semibold text-slate-400 py-8">
                Memuat lintasan…
              </p>
            )}

            {!error && hits?.length === 0 && (
              <p className="text-center text-[12px] font-semibold text-slate-400 py-8 px-4">
                Belum ada yang melintas garis hitung hari ini.
              </p>
            )}

            {hits?.map((h) => (
              <BarisLintasan
                key={`${h.trackId}-${h.time}`}
                hit={h}
                onOpen={() => setPanelTerbuka(true)}
              />
            ))}
          </div>

          <div className="flex items-center justify-between gap-2 flex-shrink-0 border-t border-slate-100 pt-2 mt-2">
            <span className={CARD_TEXT.section}>Hari ini</span>
            <span
              className={`flex items-center gap-1 ${CARD_TEXT.note} ${
                isFetching ? "text-amber-500" : ""
              }`}
            >
              <RefreshCw className={`h-3 w-3 flex-shrink-0 ${isFetching ? "animate-spin" : ""}`} />
              {hits ? `${hits.length} lintasan` : "memuat"}
            </span>
          </div>
        </div>
      </CctvAnalyticsCard>

      {panelTerbuka && <CctvVisitorHitsModal onClose={() => setPanelTerbuka(false)} />}
    </>
  );
}

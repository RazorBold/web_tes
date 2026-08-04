"use client";

import React, { useState } from "react";
import { Clock, Flame, Eye, Users, MoonStar } from "lucide-react";
import CctvAnalyticsCard, { CARD_TEXT } from "./cctv-analytics-card";
import CctvHeatmapLightbox from "./cctv-heatmap-lightbox";
import { useCctvHeatmap } from "@/hooks/use-cctv-heatmap";
import type { HeatmapFrame } from "@/lib/cctv-heatmap";

/**
 * Daftar heatmap sungguhan dari NVR.
 *
 * Gambarnya SUDAH dirender di latar dan tersimpan sebagai berkas — kartu ini
 * hanya menyajikan yang sudah jadi. Alasannya terukur: mengambil titik deteksi
 * dari NVR makan 2,3 detik rata-rata (sampai 7,9 detik saat ramai), sementara
 * gambar historis tidak pernah berubah. Merender saat kartu dibuka berarti tiap
 * penonton membayar ongkos yang sama untuk hasil yang persis sama.
 */

const jam = (iso: string) =>
  new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

/** Legenda skala panas — sama dengan colormap jet yang dipakai renderer. */
function LegendaPanas() {
  return (
    <div className="flex items-center gap-2">
      <span className={CARD_TEXT.note}>Sepi</span>
      <span
        className="h-2 w-16 rounded-full"
        style={{
          background: "linear-gradient(90deg,#0000ff,#00ffff,#00ff00,#ffff00,#ff0000)",
        }}
      />
      <span className={CARD_TEXT.note}>Ramai</span>
    </div>
  );
}

function BarisFrame({ frame, onOpen }: { frame: HeatmapFrame; onOpen: () => void }) {
  const kosong = frame.status === "empty";

  return (
    <button
      onClick={onOpen}
      className="group w-full text-left flex items-center gap-2.5 bg-white border border-slate-200 rounded-xl p-1.5 hover:border-brand-red/50 hover:shadow-sm transition-all duration-200 cursor-pointer"
    >
      <div className="relative w-[76px] aspect-video rounded-lg overflow-hidden bg-slate-900 flex-shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/v1/cctv/heatmap/image?id=${frame.id}&size=thumb`}
          alt={`Heatmap pukul ${jam(frame.capturedAt)}`}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Eye className="h-3.5 w-3.5 text-white" />
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <h5 className={`${CARD_TEXT.item} flex items-center gap-1.5`}>
          <Clock className="h-3 w-3 text-slate-400 flex-shrink-0" />
          {jam(frame.capturedAt)} WIB
        </h5>

        {/* Frame kosong DIBEDAKAN dari yang ramai, bukan disembunyikan: nol titik
            artinya memang tidak ada orang pada jendela itu — bukan gagal render,
            dan itu informasi yang berguna. */}
        {kosong ? (
          <span className={`flex items-center gap-1 ${CARD_TEXT.note} mt-1.5`}>
            <MoonStar className="h-2.5 w-2.5 flex-shrink-0" /> Tidak ada orang
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[11px] font-bold text-orange-600 mt-1.5 whitespace-nowrap">
            <Users className="h-2.5 w-2.5 flex-shrink-0" />
            {frame.points.toLocaleString("id-ID")} titik
            {/* Kartu ini cuma selebar ±260px, jadi keterangan "jendela
                dilebarkan" diringkas jadi satu titik. Teks penuhnya tetap ada di
                tooltip dan di lightbox — kalau ditulis utuh di sini, barisnya
                membungkus dan tinggi tiap baris jadi tidak seragam. */}
            {frame.widened && (
              <span
                title="Jendela deteksi dilebarkan karena titik di jendela normal terlalu sedikit"
                className="h-1.5 w-1.5 rounded-full bg-amber-400 flex-shrink-0 ml-0.5"
              />
            )}
          </span>
        )}
      </div>
    </button>
  );
}

export default function CctvSnapshotEvidenceCard() {
  const { data: frames, isLoading } = useCctvHeatmap(12);
  const [dipilih, setDipilih] = useState<number | null>(null);

  return (
    <>
      <CctvAnalyticsCard
        title="Screenshot Heatmap"
        subtitle="Sebaran kepadatan pengunjung"
        Icon={Flame}
        accent="orange"
        badgeLabel="NVR"
        badgeVariant="realtime"
      >
        <div className="flex flex-col h-full min-h-0">
          <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
            {isLoading && (
              <p className="text-center text-[12px] font-semibold text-slate-400 py-8">
                Memuat heatmap…
              </p>
            )}

            {!isLoading && !frames?.length && (
              <p className="text-center text-[12px] font-semibold text-slate-400 py-8 px-4">
                Belum ada heatmap yang selesai dirender. Gambar baru datang dari kamera tiap ±5
                menit.
              </p>
            )}

            {frames?.map((f, i) => (
              <BarisFrame key={f.id} frame={f} onOpen={() => setDipilih(i)} />
            ))}
          </div>

          {/* Legenda dipasang di kartu, bukan hanya di lightbox — warna di
              thumbnail tidak ada artinya kalau kuncinya baru muncul setelah diklik. */}
          <div className="flex items-center justify-between gap-2 flex-shrink-0 border-t border-slate-100 pt-2 mt-2">
            <span className={CARD_TEXT.section}>Kepadatan</span>
            <LegendaPanas />
          </div>
        </div>
      </CctvAnalyticsCard>

      {dipilih != null && frames?.[dipilih] && (
        <CctvHeatmapLightbox
          frame={frames[dipilih]}
          index={dipilih}
          total={frames.length}
          onClose={() => setDipilih(null)}
          onPrev={() => setDipilih((i) => ((i ?? 0) - 1 + frames.length) % frames.length)}
          onNext={() => setDipilih((i) => ((i ?? 0) + 1) % frames.length)}
        />
      )}
    </>
  );
}

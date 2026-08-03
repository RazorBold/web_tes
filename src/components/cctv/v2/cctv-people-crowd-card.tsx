"use client";

import React, { useState } from "react";
import { Users, UsersRound, LogIn, LogOut, Repeat, ArrowUpRight, ArrowDownRight, Info } from "lucide-react";
import CctvAnalyticsCard, { CARD_TEXT } from "./cctv-analytics-card";

import { useCctvVisitor } from "@/hooks/use-cctv-visitor";
import { useCctvQueue } from "@/hooks/use-cctv-queue";
import CctvVisitorHitsModal from "./cctv-visitor-hits-modal";
import CctvQueueEvidenceModal from "./cctv-queue-evidence-modal";

/**
 * People Counting (masuk & keluar) di atas, klasifikasi People Crowded di bawah —
 * seukuran tiga kartu analitik lainnya supaya bisa berdampingan dengan Snapshot
 * Heatmap.
 *
 * Keduanya sengaja dipisah garis dan diberi sub-judul sendiri karena SATUANNYA
 * BERBEDA: bagian atas menghitung orang, bagian bawah menghitung kejadian
 * deteksi. Tanpa pemisah itu angka 142 dan 986 mudah terbaca seolah skala sama —
 * karena itu pula tiap bucket menuliskan satuannya sendiri ("Orang").
 *
 * Jumlah orang yang sedang berada di area (`peopleCounting.current`) TIDAK
 * ditampilkan di sini: angka itu sudah muncul sebagai jumlah objek terdeteksi di
 * kartu live stream pada panel yang sama, jadi mengulangnya hanya membuat satu
 * hal yang sama terbaca seperti dua ukuran berbeda.
 *
 * Yang dikorbankan agar semuanya muat di setengah lebar panel: pil tren cuma
 * memuat persentase (teks "dari kemarin" pindah jadi tooltip `title`), dan
 * keterangan "Orang hari ini" dilepas karena label MASUK/KELUAR di atas angka
 * sudah mengatakan hal yang sama.
 *
 * People Counting di bagian atas kini memakai data NVR sungguhan (channel
 * Visitor Counting, lewat MySQL); People Crowded di bawah masih angka contoh.
 *
 * Khusus panel /cctv. Ringkasan seluruh model AI untuk dashboard ada di
 * komponen terpisah (cctv-ai-summary-card) karena kerapatan datanya jauh
 * berbeda — memaksakan keduanya jadi satu komponen hanya melahirkan dua tata
 * letak yang tak punya kesamaan selain nama.
 */

/** Gaya tiga tile kerumunan. Kelas ditulis literal — Tailwind hanya
 *  men-generate kelas yang muncul apa adanya di source. */
const BUCKET_GAYA = [
  { label: "1 - 5", tile: "bg-emerald-50/60 border-emerald-100", iconWrap: "bg-emerald-100/80 text-emerald-600", chip: "bg-emerald-100/80 text-emerald-700", value: "text-emerald-700" },
  { label: "6 - 10", tile: "bg-amber-50/60 border-amber-100", iconWrap: "bg-amber-100/80 text-amber-600", chip: "bg-amber-100/80 text-amber-700", value: "text-amber-600" },
  { label: "> 10", tile: "bg-rose-50/60 border-rose-100", iconWrap: "bg-rose-100/80 text-rose-500", chip: "bg-rose-100/80 text-rose-600", value: "text-rose-600" },
];

/** Pil tren vs hari sebelumnya. Arah panah & warna ditentukan tanda angkanya. */
function TrendPill({ pct }: { pct: number }) {
  const up = pct >= 0;
  const Arrow = up ? ArrowUpRight : ArrowDownRight;

  return (
    <span
      title={`${up ? "Naik" : "Turun"} ${Math.abs(pct)}% dari kemarin`}
      className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-extrabold ${
        up ? "bg-emerald-100/70 text-emerald-700" : "bg-rose-100/70 text-rose-600"
      }`}
    >
      <Arrow className="h-3 w-3 flex-shrink-0" />
      {up ? "+" : "−"}
      {Math.abs(pct)}%
    </span>
  );
}

export default function CctvPeopleCrowdCard() {
  const { data: visitor } = useCctvVisitor();
  const [panelTerbuka, setPanelTerbuka] = useState(false);
  const [panelAntrian, setPanelAntrian] = useState(false);
  const { data: queue } = useCctvQueue();
  const inCount = visitor?.in ?? null;
  const outCount = visitor?.out ?? null;
  // `?? undefined` supaya pil tren tidak muncul selama data kemarin belum ada —
  // "0%" akan terbaca sebagai "tidak berubah", padahal artinya "belum tahu".
  const inTrendPct = visitor?.trendInPct ?? undefined;
  const outTrendPct = visitor?.trendOutPct ?? undefined;
  const angka = (n: number | null) => (n == null ? "—" : n.toLocaleString("id-ID"));

  return (
    <CctvAnalyticsCard
      title="People Analytics"
      subtitle="Analisis kerumunan secara real-time"
      Icon={Users}
      accent="emerald"
    >
      {/* Kedua bagian sama-sama meregang mengisi tinggi kartu (450px, ditentukan
          grid di app/(dashboard)/cctv/page.tsx). Sebelumnya bagian atas dipatok
          setinggi isinya sehingga sisa ruang menumpuk jadi satu rongga kosong di
          bawah. Rasio 1 : 1,25 memberi bagian bawah ruang lebih karena ia memuat
          tiga tile plus catatan kaki. */}
      <div className="flex flex-col h-full min-h-0 gap-2.5">
        {/* ─────────── Bagian 1: People Counting ─────────── */}
        <section className="flex flex-col flex-1 min-h-0">
          <div className="flex items-baseline justify-between gap-2 mb-2 flex-shrink-0">
            <span className="flex items-baseline gap-1.5">
              <button
                onClick={() => setPanelTerbuka(true)}
                title="Buka panel pemantauan"
                className={`${CARD_TEXT.section} hover:text-brand-red underline decoration-dotted underline-offset-4 cursor-pointer transition-colors`}
              >
                People Counting
              </button>
              <span className="text-[9px] font-extrabold uppercase tracking-wide px-1 py-px rounded bg-emerald-100 text-emerald-700">
                NVR
              </span>
            </span>
            {visitor && (
              <span className="flex items-baseline gap-1.5 flex-shrink-0">
                <span className={CARD_TEXT.note}>Hari ini</span>
                <span className="text-[15px] font-black font-mono leading-none text-slate-700">
                  {visitor.uniqueVisitors.toLocaleString("id-ID")}
                </span>
                <span className={CARD_TEXT.note}>orang</span>
              </span>
            )}
          </div>

          {/* Tiga kelompok, bukan dua: masuk + keluar + bolak-balik membagi habis
              satu populasi yang sama. Menyembunyikan yang ketiga membuat orang
              yang berpindah ke sana terbaca seperti angka yang hilang. */}
          <div className="grid grid-cols-3 gap-2 flex-1 min-h-0">
            {/* Masuk & Keluar kini memakai ukuran `headline`: setelah tile "Orang
                Saat Ini" dilepas, keduanyalah angka inti kartu ini. */}
            <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl px-3 py-3 flex flex-col items-start justify-between min-h-0">
              <span className="flex items-center gap-1.5 text-[12px] font-extrabold uppercase tracking-wider leading-none text-emerald-700">
                <LogIn className="h-4 w-4 flex-shrink-0" /> Masuk
              </span>
              <span className={`block ${CARD_TEXT.headline} text-emerald-700`}>{angka(inCount)}</span>
              {inTrendPct != null && <TrendPill pct={inTrendPct} />}
            </div>

            <div className="bg-rose-50/70 border border-rose-100 rounded-2xl px-3 py-3 flex flex-col items-start justify-between min-h-0">
              <span className="flex items-center gap-1.5 text-[12px] font-extrabold uppercase tracking-wider leading-none text-rose-600">
                <LogOut className="h-4 w-4 flex-shrink-0" /> Keluar
              </span>
              <span className={`block ${CARD_TEXT.headline} text-rose-600`}>{angka(outCount)}</span>
              {outTrendPct != null && <TrendPill pct={outTrendPct} />}
            </div>

            <div className="bg-slate-50/80 border border-slate-200 rounded-2xl px-3 py-3 flex flex-col items-start justify-between min-h-0">
              <span className="flex items-center gap-1.5 text-[12px] font-extrabold uppercase tracking-wider leading-none text-slate-500">
                <Repeat className="h-4 w-4 flex-shrink-0" /> Bolak-balik
              </span>
              <span className={`block ${CARD_TEXT.headline} text-slate-600`}>
                {angka(visitor?.lingering ?? null)}
              </span>
            </div>
          </div>
        </section>

        <hr className="border-slate-100 flex-shrink-0" />

        {/* ─────────── Bagian 2: People Crowded ─────────── */}
        <section className="flex flex-col flex-[1.25] min-h-0">
          <div className="flex items-center justify-between gap-2 mb-2 flex-shrink-0">
            <span className="flex items-baseline gap-1.5">
              <button
                onClick={() => setPanelAntrian(true)}
                title="Buka bukti People Crowded"
                className={`${CARD_TEXT.section} hover:text-brand-red underline decoration-dotted underline-offset-4 cursor-pointer transition-colors`}
              >
                People Crowded
              </button>
              <span className="text-[9px] font-extrabold uppercase tracking-wide px-1 py-px rounded bg-emerald-100 text-emerald-700">
                NVR
              </span>
            </span>
            <span className="flex items-baseline gap-1.5 flex-shrink-0">
              <span className={CARD_TEXT.note}>Total</span>
              <span className="text-[24px] font-black font-mono leading-none text-slate-800">
                {queue ? queue.totalCrowded.toLocaleString("id-ID") : "—"}
              </span>
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5 flex-1 min-h-0">
            {BUCKET_GAYA.map((b, i) => (
              <div
                key={b.label}
                className={`border rounded-2xl px-2.5 py-2.5 flex flex-col items-start justify-between min-h-0 ${b.tile}`}
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className={`h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 ${b.iconWrap}`}
                  >
                    <UsersRound className="h-4 w-4" />
                  </span>
                  <span
                    className={`text-[11px] font-extrabold rounded-full px-1.5 py-0.5 leading-none whitespace-nowrap ${b.chip}`}
                  >
                    {b.label}
                  </span>
                </div>

                <div>
                  {/* Sedikit di bawah `headline` supaya tiga angka berdampingan
                      ini tidak menyaingi Masuk/Keluar di atasnya. */}
                  <span className={`block text-[30px] font-black font-mono leading-none ${b.value}`}>
                    {queue ? (queue.buckets[i]?.count ?? 0).toLocaleString("id-ID") : "—"}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <p
            className={`flex items-center justify-center gap-1.5 ${CARD_TEXT.note} text-center flex-shrink-0 pt-2.5`}
          >
            <Info className="h-3 w-3 flex-shrink-0" />
            *Berapa kali kepadatan itu terpantau hari ini, bukan jumlah orang
          </p>
        </section>
      </div>

      {panelTerbuka && <CctvVisitorHitsModal onClose={() => setPanelTerbuka(false)} />}
      {panelAntrian && <CctvQueueEvidenceModal onClose={() => setPanelAntrian(false)} />}
    </CctvAnalyticsCard>
  );
}

"use client";

import React, { useState } from "react";
import {
  RadioTower, LogIn, LogOut, UsersRound, Mars, Venus, Repeat,
  ArrowUpRight, ArrowDownRight, type LucideIcon,
} from "lucide-react";
import CctvAnalyticsCard, { CARD_TEXT } from "./cctv-analytics-card";
import { useCctvVisitor } from "@/hooks/use-cctv-visitor";
import { useCctvQueue } from "@/hooks/use-cctv-queue";
import CctvVisitorHitsModal from "./cctv-visitor-hits-modal";
import CctvQueueEvidenceModal from "./cctv-queue-evidence-modal";
import { genderDetection, moodAnalysis } from "@/config/cctv";

/**
 * Ringkasan SELURUH model AI CCTV dalam satu kartu — dipakai di dashboard, yang
 * hanya punya satu slot untuk mewakili kedua panel halaman /cctv.
 *
 * Komponen sendiri, bukan varian dari CctvPeopleCrowdCard: di sini ada 11 angka
 * yang harus muat di kolom selebar ±500px, jadi tile-nya jauh lebih rapat.
 *
 * CATATAN WARNA (sudah dijalankan lewat validator palet, bukan dikira-kira):
 * kedelapan warna lolos pita terang, ambang kontras 3:1 terhadap permukaan, dan
 * ambang penglihatan normal. Dua hal yang "gagal" memang disengaja:
 *   • #475569 (Neutral) di bawah ambang chroma alias terbaca abu-abu — dan itu
 *     justru MAKNANYA pada skala mood.
 *   • Pasangan Happy↔Wanita hanya ΔE 6,1 pada deuteranopia, yang boleh dipakai
 *     asal ada penanda kedua. Di sini tiap tile selalu membawa ikon + nama +
 *     angka, jadi identitas tak pernah bergantung pada warna saja.
 */

interface Tile {
  label: string;
  /** `null` selagi data belum tiba — dirender "—", bukan 0. Nol adalah angka
   *  yang bermakna "tidak ada orang", jadi tak boleh dipakai sebagai penanda
   *  "belum tahu". */
  value: number | null;
  /** Hex; dipakai untuk angka, ikon, latar tile, dan meter sekaligus. */
  color: string;
  Icon: LucideIcon;
  /** Baris kecil di bawah angka. */
  note?: string;
  /** 0–100. Menyalakan meter di dasar tile. */
  meterPct?: number;
  /** Persentase perubahan vs kemarin; tandanya menentukan arah panah. */
  trendPct?: number;
  /** Deret untuk sparkline batang di sisi kanan. */
  spark?: number[];
  /** Teks status (Low/Medium/High) — selalu berlabel, tak pernah warna saja. */
  status?: string;
}

/**
 * Sparkline batang mini. Batang terakhir memakai warna penuh, sisanya diredam —
 * mata langsung tahu mana kurun terkini tanpa perlu sumbu maupun label.
 */
function SparkBars({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data, 1);
  return (
    <span className="flex items-end gap-[3px] h-7 flex-shrink-0" aria-hidden>
      {data.map((v, i) => (
        <span
          key={i}
          // 4px membulat di ujung data, siku di dasar — batang tumbuh dari satu garis dasar.
          className="w-[4px] rounded-t-[2px]"
          style={{
            height: `${Math.max((v / max) * 100, 12)}%`,
            backgroundColor: color,
            opacity: i === data.length - 1 ? 1 : 0.28,
          }}
        />
      ))}
    </span>
  );
}

/** Meter di dasar tile. Lintasannya warna yang sama namun jauh lebih pudar. */
function Meter({ pct, color }: { pct: number; color: string }) {
  return (
    <span
      className="block h-[5px] rounded-full overflow-hidden mt-1.5"
      style={{ backgroundColor: `${color}24` }}
      aria-hidden
    >
      <span
        className="block h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(Math.max(pct, 0), 100)}%`, backgroundColor: color }}
      />
    </span>
  );
}

function StatTile({ tile }: { tile: Tile }) {
  const { label, value, color, Icon, note, meterPct, trendPct, spark, status } = tile;

  return (
    <div
      className="rounded-xl border px-2.5 py-[7px] flex flex-col justify-between min-h-0"
      style={{ backgroundColor: `${color}0f`, borderColor: `${color}33` }}
    >
      {/* Baris atas: identitas kiri, status kanan. */}
      <div className="flex items-center justify-between gap-1.5">
        <span
          className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wide leading-none truncate"
          style={{ color }}
        >
          <Icon className="h-3.5 w-3.5 flex-shrink-0" />
          {label}
        </span>
        {status && (
          <span
            className="text-[9px] font-extrabold uppercase tracking-wide leading-none px-1.5 py-[3px] rounded-full flex-shrink-0"
            style={{ backgroundColor: `${color}26`, color }}
          >
            {status}
          </span>
        )}
      </div>

      {/* Angka + sparkline. */}
      <div className="flex items-end justify-between gap-2 mt-1">
        <span className="flex items-baseline gap-1 min-w-0">
          <span className="text-[22px] font-black font-mono leading-none tracking-tight" style={{ color }}>
            {value == null ? "—" : value.toLocaleString("id-ID")}
          </span>
          {trendPct != null && (
            <span
              className={`inline-flex items-center text-[10px] font-extrabold leading-none ${
                trendPct >= 0 ? "text-emerald-600" : "text-rose-500"
              }`}
              title={`${trendPct >= 0 ? "Naik" : "Turun"} ${Math.abs(trendPct)}% dari kemarin`}
            >
              {trendPct >= 0 ? <ArrowUpRight className="h-2.5 w-2.5" /> : <ArrowDownRight className="h-2.5 w-2.5" />}
              {Math.abs(trendPct)}%
            </span>
          )}
        </span>
        {spark && <SparkBars data={spark} color={color} />}
      </div>

      {note && <span className="block text-[10px] font-semibold text-slate-400 leading-none mt-1">{note}</span>}
      {meterPct != null && <Meter pct={meterPct} color={color} />}
    </div>
  );
}

function Group({
  title,
  total,
  source,
  cols,
  tiles,
  onOpen,
}: {
  title: string;
  total?: string;
  /** Penanda asal angka. Kartu ini mencampur data NVR sungguhan dengan angka
   *  contoh; tanpa penanda, keduanya terbaca sama-sama nyata. */
  source?: "nvr" | "contoh";
  /** Ditulis literal, bukan dirangkai — Tailwind hanya men-generate kelas yang
   *  muncul apa adanya di source. */
  cols: "grid-cols-2" | "grid-cols-3" | "grid-cols-4";
  tiles: Tile[];
  /** Bila diisi, judul kelompok jadi tombol pembuka panel pemantauan. */
  onOpen?: () => void;
}) {
  return (
    <section className="flex flex-col flex-1 min-h-0">
      <div className="flex items-baseline justify-between gap-2 mb-1 flex-shrink-0">
        <span className="flex items-baseline gap-1.5 min-w-0">
          {onOpen ? (
            <button
              onClick={onOpen}
              title="Buka panel pemantauan"
              className={`${CARD_TEXT.section} hover:text-brand-red underline decoration-dotted underline-offset-4 cursor-pointer transition-colors`}
            >
              {title}
            </button>
          ) : (
            <span className={CARD_TEXT.section}>{title}</span>
          )}
          {source && (
            <span
              className={`text-[9px] font-extrabold uppercase tracking-wide px-1 py-px rounded ${
                source === "nvr"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              {source === "nvr" ? "NVR" : "contoh"}
            </span>
          )}
        </span>
        {total && (
          <span className="flex items-baseline gap-1 flex-shrink-0">
            <span className={CARD_TEXT.note}>Total</span>
            <span className="text-[13px] font-black font-mono leading-none text-slate-700">{total}</span>
          </span>
        )}
      </div>

      <div className={`grid ${cols} gap-1.5 flex-1 min-h-0`}>
        {tiles.map((t) => (
          <StatTile key={t.label} tile={t} />
        ))}
      </div>
    </section>
  );
}

const GREEN = "#059669";
const AMBER = "#D97706";
const ROSE = "#E11D48";
const BLUE = "#2563EB";
const PINK = "#DB2777";
const SLATE = "#475569";

/** Tingkat kepadatan per rentang — selalu tampil sebagai teks, bukan warna saja. */
const CROWD_STATUS = ["Low", "Medium", "High"];
/** Rangka saat data belum tiba, supaya jumlah & label tile tidak berubah-ubah. */
const CROWD_BUCKETS_KOSONG = [
  { key: "1-5", label: "1 - 5", count: 0 },
  { key: "6-10", label: "6 - 10", count: 0 },
  { key: ">10", label: "> 10", count: 0 },
];
const CROWD_COLORS = [GREEN, AMBER, ROSE];

export default function CctvAiSummaryCard() {
  // People Counting kini dari NVR sungguhan (channel 74237, lewat MySQL).
  // Tiga kelompok lainnya masih angka contoh dari config/cctv.ts.
  const { data: visitor } = useCctvVisitor();
  const { data: queue } = useCctvQueue();
  const [panelTerbuka, setPanelTerbuka] = useState(false);
  const [panelAntrian, setPanelAntrian] = useState(false);
  const faceTotal = genderDetection.male + genderDetection.female;

  // Sparkline mengikuti jam yang benar-benar ada datanya, bukan 24 kolom kosong.
  const jam = visitor?.hourly ?? [];
  const sparkIn = jam.length > 1 ? jam.map((h) => h.in) : undefined;
  const sparkOut = jam.length > 1 ? jam.map((h) => h.out) : undefined;

  const share = (n: number, total: number) => (total ? (n / total) * 100 : 0);
  const fmtPct = (n: number) => `${n.toFixed(1).replace(".", ",")}%`;

  return (
    <CctvAnalyticsCard
      title="CCTV AI Analytics"
      subtitle="Ringkasan seluruh model AI"
      Icon={RadioTower}
      accent="emerald"
    >
      <div className="flex flex-col h-full min-h-0 gap-2">
        {/* Tiga kelompok ini membagi habis satu populasi yang sama: masuk +
            keluar + bolak-balik = orang unik. Ketiganya WAJIB tampil bersama —
            kalau bolak-balik disembunyikan, orang yang pindah ke sana terbaca
            seperti angka yang hilang dari "masuk". */}
        <Group
          title="People Counting"
          source="nvr"
          onOpen={() => setPanelTerbuka(true)}
          total={visitor ? visitor.uniqueVisitors.toLocaleString("id-ID") : undefined}
          cols="grid-cols-3"
          tiles={[
            {
              label: "Masuk",
              value: visitor?.in ?? null,
              color: GREEN,
              Icon: LogIn,
              // `?? undefined`, bukan `?? 0`: pil tren disembunyikan selama
              // data kemarin belum ada, alih-alih menampilkan "0%" palsu.
              trendPct: visitor?.trendInPct ?? undefined,
              spark: sparkIn,
            },
            {
              label: "Keluar",
              value: visitor?.out ?? null,
              color: ROSE,
              Icon: LogOut,
              trendPct: visitor?.trendOutPct ?? undefined,
              spark: sparkOut,
            },
            {
              label: "Bolak-balik",
              value: visitor?.lingering ?? null,
              color: SLATE,
              Icon: Repeat,
            },
          ]}
        />

        {/* Angkanya = berapa banyak SAMPEL zona (satu tiap ~30 detik) yang
            puncaknya jatuh di rentang itu sepanjang hari. Bukan jumlah orang. */}
        <Group
          title="People Crowded"
          source="nvr"
          onOpen={() => setPanelAntrian(true)}
          total={queue ? queue.totalCrowded.toLocaleString("id-ID") : undefined}
          cols="grid-cols-3"
          tiles={(queue?.buckets ?? CROWD_BUCKETS_KOSONG).map((b, i) => ({
            label: b.label,
            value: queue ? b.count : null,
            color: CROWD_COLORS[i],
            Icon: UsersRound,
            status: CROWD_STATUS[i],
            note: queue ? fmtPct(share(b.count, queue.totalCrowded)) : undefined,
            meterPct: queue ? share(b.count, queue.totalCrowded) : undefined,
          }))}
        />

        <Group
          title="Gender Detection"
          source="contoh"
          total={faceTotal.toLocaleString("id-ID")}
          cols="grid-cols-2"
          tiles={[
            {
              label: "Pria",
              value: genderDetection.male,
              color: BLUE,
              Icon: Mars,
              note: fmtPct(share(genderDetection.male, faceTotal)),
              meterPct: share(genderDetection.male, faceTotal),
            },
            {
              label: "Wanita",
              value: genderDetection.female,
              color: PINK,
              Icon: Venus,
              note: fmtPct(share(genderDetection.female, faceTotal)),
              meterPct: share(genderDetection.female, faceTotal),
            },
          ]}
        />

        <Group
          title="Mood Analysis"
          source="contoh"
          cols="grid-cols-4"
          tiles={moodAnalysis.map((m) => ({
            label: m.name,
            value: m.count,
            color: m.color,
            Icon: m.Icon,
            note: fmtPct(share(m.count, faceTotal)),
            meterPct: share(m.count, faceTotal),
          }))}
        />
      </div>

      {panelTerbuka && <CctvVisitorHitsModal onClose={() => setPanelTerbuka(false)} />}
      {panelAntrian && <CctvQueueEvidenceModal onClose={() => setPanelAntrian(false)} />}
    </CctvAnalyticsCard>
  );
}

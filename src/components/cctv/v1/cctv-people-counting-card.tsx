"use client";

import React, { useState } from "react";
import { Users, LogIn, LogOut, Repeat, ArrowUpRight, ArrowDownRight } from "lucide-react";
import CctvAnalyticsCard, { CARD_TEXT } from "./cctv-analytics-card";
import CctvVisitorHitsModal from "./cctv-visitor-hits-modal";
import { useCctvVisitor } from "@/hooks/use-cctv-visitor";

/**
 * People Counting — masuk, keluar, bolak-balik. Satu-satunya isi kartu ini.
 *
 * Dulu menumpang satu kartu bersama People Crowded, dan itu memaksakan dua hal
 * yang SATUANNYA BERBEDA berdiri berdampingan: yang satu menghitung orang, yang
 * lain menghitung kejadian deteksi. Sekarang keduanya terpisah mengikuti kamera
 * asalnya — People Counting ikut Kamera 1, People Crowded ikut Kamera 2.
 *
 * Tiga tile ditumpuk ke bawah, bukan berjajar seperti dulu. Dengan tinggi kartu
 * 450px dan hanya satu bagian yang mengisinya, tiga kolom akan jadi tiang-tiang
 * kurus setinggi kartu; ditumpuk, tiap angka dapat lebarnya sendiri dan
 * pil trennya muat tanpa berdesakan.
 *
 * Jumlah orang yang sedang di depan kamera sengaja TIDAK ditampilkan di sini —
 * angka itu sudah muncul sebagai objek terdeteksi di kartu live stream pada
 * panel yang sama.
 */

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

interface TileProps {
  label: string;
  Icon: typeof LogIn;
  value: number | null;
  trend?: number;
  tile: string;
  text: string;
}

function Tile({ label, Icon, value, trend, tile, text }: TileProps) {
  return (
    <div className={`border rounded-2xl px-3.5 py-3 flex items-center justify-between gap-2 flex-1 min-h-0 ${tile}`}>
      <span className="flex flex-col gap-1.5 min-w-0">
        <span className={`flex items-center gap-1.5 text-[12px] font-extrabold uppercase tracking-wider leading-none ${text}`}>
          <Icon className="h-4 w-4 flex-shrink-0" />
          {label}
        </span>
        {trend != null && <TrendPill pct={trend} />}
      </span>

      <span className={`${CARD_TEXT.headline} ${text} flex-shrink-0`}>
        {value == null ? "—" : value.toLocaleString("id-ID")}
      </span>
    </div>
  );
}

export default function CctvPeopleCountingCard() {
  const { data: visitor } = useCctvVisitor();
  const [panelTerbuka, setPanelTerbuka] = useState(false);

  return (
    <CctvAnalyticsCard
      title="People Counting"
      subtitle="Masuk & keluar hari ini"
      Icon={Users}
      accent="emerald"
      badgeLabel="NVR"
      badgeVariant="realtime"
    >
      <div className="flex flex-col h-full min-h-0 gap-2.5">
        <div className="flex items-baseline justify-between gap-2 flex-shrink-0">
          <button
            onClick={() => setPanelTerbuka(true)}
            title="Buka panel pemantauan"
            className={`${CARD_TEXT.section} hover:text-brand-red underline decoration-dotted underline-offset-4 cursor-pointer transition-colors`}
          >
            Orang hari ini
          </button>
          <span className="flex items-baseline gap-1.5 flex-shrink-0">
            <span className="text-[20px] font-black font-mono leading-none text-slate-700">
              {visitor ? visitor.uniqueVisitors.toLocaleString("id-ID") : "—"}
            </span>
            <span className={CARD_TEXT.note}>orang</span>
          </span>
        </div>

        {/* Tiga kelompok, bukan dua: masuk + keluar + bolak-balik membagi habis
            satu populasi yang sama. Menyembunyikan yang ketiga membuat orang
            yang berpindah ke sana terbaca seperti angka yang hilang. */}
        <div className="flex flex-col gap-2.5 flex-1 min-h-0">
          <Tile
            label="Masuk"
            Icon={LogIn}
            value={visitor?.in ?? null}
            // `?? undefined` supaya pil tren tidak muncul selama data kemarin
            // belum ada — "0%" akan terbaca sebagai "tidak berubah", padahal
            // artinya "belum tahu".
            trend={visitor?.trendInPct ?? undefined}
            tile="bg-emerald-50/70 border-emerald-100"
            text="text-emerald-700"
          />
          <Tile
            label="Keluar"
            Icon={LogOut}
            value={visitor?.out ?? null}
            trend={visitor?.trendOutPct ?? undefined}
            tile="bg-rose-50/70 border-rose-100"
            text="text-rose-600"
          />
          <Tile
            label="Bolak-balik"
            Icon={Repeat}
            value={visitor?.lingering ?? null}
            tile="bg-slate-50/80 border-slate-200"
            text="text-slate-600"
          />
        </div>
      </div>

      {panelTerbuka && <CctvVisitorHitsModal onClose={() => setPanelTerbuka(false)} />}
    </CctvAnalyticsCard>
  );
}

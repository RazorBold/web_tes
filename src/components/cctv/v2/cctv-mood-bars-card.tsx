"use client";

import React from "react";
import { Smile } from "lucide-react";
import CctvAnalyticsCard, { CARD_TEXT } from "./cctv-analytics-card";
import { moodAnalysis } from "@/config/cctv";

export default function CctvMoodBarsCard() {
  const total = moodAnalysis.reduce((sum, m) => sum + m.count, 0);
  const dominant = moodAnalysis.reduce((a, b) => (b.count > a.count ? b : a));

  return (
    <CctvAnalyticsCard title="Mood Analysis" Icon={Smile} accent="amber">
      <div className="flex flex-col h-full min-h-0">
        {/* Konteks: total wajah + mood dominan. Total ini sama dengan total di
            kartu Gender Detection — dua-duanya akumulasi hari ini. */}
        <div className="flex items-center justify-between gap-2 flex-shrink-0 mb-2.5">
          <span className={CARD_TEXT.note}>
            <span className="font-mono font-black text-slate-600">{total.toLocaleString("id-ID")}</span>{" "}
            wajah dianalisa
          </span>
          <span
            className="flex items-center gap-1.5 text-[11px] font-extrabold px-2 py-0.5 rounded-full border flex-shrink-0"
            style={{
              color: dominant.color,
              backgroundColor: `${dominant.color}14`,
              borderColor: `${dominant.color}33`,
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: dominant.color }} />
            Dominan {dominant.name}
          </span>
        </div>

        {/* Satu tile per mood, diberi warna moodnya sendiri.
            Tiap baris `flex-1` supaya keempatnya sama tinggi DAN mengisi kartu:
            dengan `justify-between` sebelumnya, sisa ruang jatuh jadi celah lebar
            antar baris sehingga kartu ini terlihat lebih longgar dari tetangganya.
            Sekarang sisa ruang masuk ke dalam tile sebagai padding. */}
        <div className="flex-1 min-h-0 flex flex-col gap-2">
          {moodAnalysis.map((m) => {
            const pct = ((m.count / total) * 100).toFixed(1);
            const { Icon } = m;
            return (
              <div
                key={m.name}
                className="flex flex-1 min-h-0 items-center gap-2.5 rounded-2xl border px-3 py-2"
                style={{ backgroundColor: `${m.color}0d`, borderColor: `${m.color}2e` }}
              >
                <span
                  className="h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${m.color}24`, color: m.color }}
                >
                  <Icon className="h-[18px] w-[18px]" />
                </span>

                <div className="min-w-0 flex-1">
                  {/* Angka memakai tinta gelap, bukan warna moodnya: identitas
                      kategori sudah dibawa ikon berwarna di sebelah kiri & bar di
                      bawah. Angka berwarna-warni membuat empat baris ini terbaca
                      seperti empat sistem berbeda, dan hijau/kuning muda sebagai
                      teks juga paling lemah kontrasnya. */}
                  <div className="flex items-baseline justify-between gap-2">
                    <span className={CARD_TEXT.item}>{m.name}</span>
                    <span className={CARD_TEXT.stat}>{pct}%</span>
                  </div>

                  {/* Bar & jumlah satu baris: sisa lintasan bar terpakai oleh
                      angka, jadi mood bernilai kecil tidak lagi menyisakan
                      lintasan kosong panjang di kanan. Lintasan kosongnya memakai
                      warna mood yang sangat pudar (bukan putih) supaya bar terbaca
                      sebagai takaran sepanjang lintasannya. */}
                  <div className="flex items-center gap-2 mt-2">
                    <div
                      className="flex-1 h-1.5 rounded-full overflow-hidden"
                      style={{ backgroundColor: `${m.color}24` }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: m.color }}
                      />
                    </div>
                    <span className={`${CARD_TEXT.micro} flex-shrink-0`}>
                      {m.count.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </CctvAnalyticsCard>
  );
}

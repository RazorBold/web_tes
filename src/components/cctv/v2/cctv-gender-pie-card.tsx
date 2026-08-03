"use client";

import React from "react";
import BaseChart from "@/components/charts/base-chart";
import { Mars, Venus, VenusAndMars } from "lucide-react";
import CctvAnalyticsCard, { CARD_TEXT } from "./cctv-analytics-card";
import { genderDetection } from "@/config/cctv";

export default function CctvGenderPieCard() {
  const { male, female } = genderDetection;
  const total = male + female;
  const malePct = ((male / total) * 100).toFixed(1);
  const femalePct = ((female / total) * 100).toFixed(1);

  const option = {
    tooltip: {
      trigger: "item",
      formatter: "{b}: {c} ({d}%)",
      textStyle: { fontSize: 13 },
    },
    series: [
      {
        name: "Gender",
        type: "pie",
        // Lubang donut dilebarkan dari 58% ke 66%: angka total di tengah kini
        // seukuran `headline` (36px), dan pada 58% ia mepet ke tepi cincin.
        // Cincin yang lebih tipis juga membuat donut berhenti mendominasi kartu.
        radius: ["66%", "86%"],
        center: ["50%", "50%"],
        avoidLabelOverlap: false,
        // 3px seukuran warna kartu memisahkan kedua irisan — pemisahnya celah
        // permukaan, bukan garis tepi berwarna.
        itemStyle: { borderRadius: 8, borderColor: "#ffffff", borderWidth: 3 },
        label: { show: false },
        labelLine: { show: false },
        data: [
          { value: male, name: "Pria", itemStyle: { color: "#3B82F6" } },
          { value: female, name: "Wanita", itemStyle: { color: "#EC4899" } },
        ],
      },
    ],
  };

  return (
    <CctvAnalyticsCard title="Gender Detection" Icon={VenusAndMars} accent="purple">
      <div className="flex flex-col h-full min-h-0">
        {/* Donut + total di tengah. Total inilah angka utama kartu ini, jadi ia
            yang memakai `headline` — dulu justru 18px, terkecil di antara empat
            kartu padahal duduk di elemen terbesar. */}
        <div className="relative flex-1 min-h-0">
          <BaseChart option={option} />
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className={CARD_TEXT.section}>Total</span>
            <span className={`${CARD_TEXT.headline} mt-2`}>{total.toLocaleString("id-ID")}</span>
            <span className={`${CARD_TEXT.note} mt-1.5`}>wajah</span>
          </div>
        </div>

        {/* Rincian — sekaligus legenda donut: ikon berwarna di sini yang
            memasangkan irisan biru/merah muda dengan namanya. */}
        <div className="grid grid-cols-2 gap-2 pt-2.5 mt-1 border-t border-slate-100 flex-shrink-0">
          <div className="bg-blue-50/70 border border-blue-100 rounded-xl px-2.5 py-2">
            <div className="flex items-center gap-1.5">
              <span className="h-5 w-5 rounded-md bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
                <Mars className="h-3 w-3" />
              </span>
              <span className={`${CARD_TEXT.tile} text-slate-500`}>Pria</span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className={CARD_TEXT.stat}>{malePct}%</span>
              <span className={CARD_TEXT.micro}>{male.toLocaleString("id-ID")}</span>
            </div>
          </div>

          <div className="bg-pink-50/70 border border-pink-100 rounded-xl px-2.5 py-2">
            <div className="flex items-center gap-1.5">
              <span className="h-5 w-5 rounded-md bg-pink-600 text-white flex items-center justify-center flex-shrink-0">
                <Venus className="h-3 w-3" />
              </span>
              <span className={`${CARD_TEXT.tile} text-slate-500`}>Wanita</span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className={CARD_TEXT.stat}>{femalePct}%</span>
              <span className={CARD_TEXT.micro}>{female.toLocaleString("id-ID")}</span>
            </div>
          </div>
        </div>
      </div>
    </CctvAnalyticsCard>
  );
}

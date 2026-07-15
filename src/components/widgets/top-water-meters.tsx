"use client";

import React from "react";
import { ChevronRight } from "lucide-react";

interface WaterMeterRank {
  rank: number;
  name: string;
  value: number;
}

const ranks: WaterMeterRank[] = [
  { rank: 1, name: "PT. Sinar Abadi Utama", value: 540 },
  { rank: 2, name: "Mall Nusantara Plaza", value: 485 },
  { rank: 3, name: "Hotel Sentosa Indah", value: 410 },
  { rank: 4, name: "Apartemen Green Garden", value: 390 },
  { rank: 5, name: "Larang Prabu 3", value: 355 },
  { rank: 6, name: "Loka Citra Utama", value: 321 },
  { rank: 7, name: "Resto Selera Rakyat", value: 315 },
  { rank: 8, name: "Larang Prabu 2", value: 289 },
  { rank: 9, name: "RS Medika Nusantara", value: 265 },
  { rank: 10, name: "Cikondang Jaya", value: 103 },
];

export default function TopWaterMeters() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between h-[220px]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <h3 className="font-bold text-slate-800 text-[11px] tracking-wider uppercase">
          Top Water Meters
        </h3>
        <a
          href="/water"
          className="text-[10px] font-bold text-brand-red hover:text-brand-red-hover transition-colors flex items-center gap-0.5"
        >
          Lihat Semua <ChevronRight className="h-3 w-3" />
        </a>
      </div>

      {/* Ranks List */}
      <div className="flex-1 overflow-y-auto space-y-2 py-1.5 mt-2 text-xs pr-1 scrollbar-thin">
        {ranks.map((item) => (
          <div key={item.rank} className="flex items-center justify-between">
            {/* Rank circle & Name */}
            <div className="flex items-center gap-2 max-w-[70%]">
              <span className="h-5 w-5 rounded-full bg-brand-red text-white font-extrabold text-[9px] flex items-center justify-center flex-shrink-0">
                {item.rank}
              </span>
              <span className="font-bold text-slate-700 truncate">{item.name}</span>
            </div>

            {/* Value */}
            <span className="font-extrabold text-slate-900 font-mono text-right flex-shrink-0">
              {item.value} <span className="text-[9px] text-slate-400 font-sans font-semibold">m³</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}


"use client";

import React from "react";
import { Zap, ChevronRight } from "lucide-react";
import { usePowerMeters } from "@/hooks/use-power";

export default function PowerLosses() {
  const { data: meters } = usePowerMeters();
  const sorted = meters ? [...meters].sort((a, b) => b.energy - a.energy) : [];

  return (
    <div className="bg-white/60 backdrop-blur-md border border-slate-300/80 rounded-2xl p-5 shadow-sm flex flex-col h-[420px]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200/70 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-100/50">
            <Zap className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base leading-none">Efisiensi &amp; Losses Energi</h3>
            <p className="text-[12px] text-slate-400 font-semibold mt-1">Rincian per substasiun</p>
          </div>
        </div>
        <a
          href="/power"
          className="text-[12px] font-bold text-brand-red hover:text-brand-red-hover transition-colors flex items-center gap-0.5 flex-shrink-0"
        >
          Lihat Semua <ChevronRight className="h-3 w-3" />
        </a>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto space-y-2 py-1.5 mt-2 pr-1 scrollbar-thin">
        {sorted.map((m) => (
          <div key={m.id} className="p-3 rounded-xl bg-white/70 border border-slate-100 flex justify-between items-center text-xs">
            <div className="max-w-[65%] min-w-0">
              <span className="font-bold text-slate-700 block leading-tight truncate">{m.name}</span>
              <span className="text-[11px] font-bold text-slate-400 mt-1 block">
                Konsumsi: {m.energy.toLocaleString("id-ID")} {m.unit}
              </span>
            </div>
            <div className="text-right leading-none flex-shrink-0">
              <span className="text-[11px] font-bold text-slate-400 block uppercase">Loss Rate</span>
              <span className={`text-xs font-extrabold font-mono mt-1 block ${m.lossPct >= 2 ? "text-brand-red" : "text-emerald-600"}`}>
                {m.lossPct}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import { RETENTION_LABEL } from "@/config/retention";
import React from "react";
import { Droplets, ChevronRight } from "lucide-react";
import { useWaterOverview } from "@/hooks/use-water";

const rankStyle = (i: number) =>
  i === 0
    ? "bg-amber-500/10 text-amber-600 ring-2 ring-amber-500/20"
    : i === 1
    ? "bg-slate-400/10 text-slate-500 ring-2 ring-slate-400/20"
    : i === 2
    ? "bg-amber-700/10 text-amber-800 ring-2 ring-amber-700/20"
    : "bg-slate-50 text-slate-400";

export default function TopWaterMeters() {
  const { data: overview } = useWaterOverview();
  const ranks = overview?.topConsumers ?? [];

  return (
    <div className="bg-white/60 backdrop-blur-md border border-slate-300/80 rounded-2xl p-5 shadow-sm flex flex-col h-[420px]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200/70 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100/50">
            <Droplets className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base leading-none">Top Pelanggan Air</h3>
            <p className="text-[12px] text-slate-400 font-semibold mt-1">Pemakaian {RETENTION_LABEL.toLowerCase()} terakhir</p>
          </div>
        </div>
        <a
          href="/water"
          className="text-[12px] font-bold text-brand-red hover:text-brand-red-hover transition-colors flex items-center gap-0.5 flex-shrink-0"
        >
          Lihat Semua <ChevronRight className="h-3 w-3" />
        </a>
      </div>

      {/* Ranks List */}
      <div className="flex-1 overflow-y-auto space-y-2 py-1.5 mt-2 text-xs pr-1 scrollbar-thin">
        {ranks.map((item, i) => (
          <div key={item.id} className="flex items-center justify-between p-2.5 rounded-xl bg-white/70 border border-slate-100">
            <div className="flex items-center gap-2.5 max-w-[70%] min-w-0">
              <span className={`h-6 w-6 rounded-full font-extrabold text-[12px] flex items-center justify-center flex-shrink-0 ${rankStyle(i)}`}>
                {i + 1}
              </span>
              <div className="min-w-0">
                <span className="font-bold text-slate-700 block truncate leading-tight">{item.name}</span>
                <span className="text-[11px] font-semibold text-slate-400 block mt-0.5">{item.zone}</span>
              </div>
            </div>
            <span className="font-extrabold text-slate-900 font-mono text-right flex-shrink-0">
              {item.usage} <span className="text-[11px] text-slate-400 font-sans font-semibold">m³</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

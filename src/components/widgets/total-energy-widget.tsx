"use client";

import React from "react";
import BaseChart from "@/components/charts/base-chart";
import { Zap, ArrowUpRight, Award, Clock } from "lucide-react";
import { usePowerOverview } from "@/hooks/use-power";

export default function TotalEnergyWidget() {
  const { data: overview } = usePowerOverview();

  const chartOption = {
    grid: { left: "3%", right: "3%", bottom: "3%", top: "12%", containLabel: true },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: (overview?.loadCurve ?? []).map((c) => c.hour),
      axisLabel: { fontFamily: "Inter, sans-serif", fontSize: 11, color: "#94A3B8" },
      axisLine: { lineStyle: { color: "#E2E8F0" } },
    },
    yAxis: {
      type: "value",
      axisLabel: { fontFamily: "Inter, sans-serif", fontSize: 11, color: "#94A3B8" },
      splitLine: { lineStyle: { color: "#F1F5F9" } },
    },
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(255, 255, 255, 0.95)",
      borderColor: "#E2E8F0",
      borderWidth: 1,
      textStyle: { color: "#1E293B", fontSize: 13 },
    },
    series: [
      {
        name: "Beban Hari Ini",
        data: (overview?.loadCurve ?? []).map((c) => c.powerKw),
        type: "line",
        smooth: true,
        symbol: "none",
        lineStyle: { color: "#F59E0B", width: 2.5 },
        areaStyle: {
          color: {
            type: "linear",
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(245, 158, 11, 0.15)" },
              { offset: 1, color: "rgba(245, 158, 11, 0)" },
            ],
          },
        },
      },
    ],
  };

  const categories = overview?.sectors.map((s) => ({
    name: `Sektor ${s.sector.charAt(0).toUpperCase()}${s.sector.slice(1)}`,
    value: `${s.energy.toLocaleString("id-ID")} MWh`,
    pct: `${s.pct}%`,
  })) ?? [];

  return (
    <div className="bg-white/60 backdrop-blur-md border border-slate-300/80 rounded-2xl p-5 shadow-sm flex flex-col h-[420px]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200/70 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-100/50">
            <Zap className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base leading-none">Total Energi</h3>
            <p className="text-[12px] text-slate-400 font-semibold mt-1">Konsumsi beban &amp; profil sektor</p>
          </div>
        </div>
        <span className="flex items-center gap-0.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded px-1.5 py-0.5">
          <ArrowUpRight className="h-3 w-3" />
          {overview ? `${overview.totalEnergy.toLocaleString("id-ID")} MWh` : "—"}
        </span>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3 flex items-center gap-2.5">
          <Clock className="h-4 w-4 text-amber-500" />
          <div className="leading-tight">
            <span className="text-[11px] font-bold text-slate-400 block uppercase">Beban Puncak</span>
            <span className="text-xs font-extrabold text-slate-700">
              {overview ? `${overview.peakLoadKw.toLocaleString("id-ID")} kW (${overview.peakLoadAt})` : "—"}
            </span>
          </div>
        </div>
        <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3 flex items-center gap-2.5">
          <Award className="h-4 w-4 text-emerald-500" />
          <div className="leading-tight">
            <span className="text-[11px] font-bold text-slate-400 block uppercase">Faktor Daya</span>
            <span className="text-xs font-extrabold text-slate-700">
              {overview ? `${overview.avgPowerFactor} (${overview.avgPowerFactor >= 0.95 ? "Optimal" : "Perlu Perbaikan"})` : "—"}
            </span>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="flex-1 min-h-0 mt-3 relative">
        <BaseChart option={chartOption} />
      </div>

      {/* Categories table */}
      <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-1.5">
        {categories.map((c, i) => (
          <div key={i} className="flex justify-between items-center text-[12px]">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              <span className="font-bold text-slate-600">{c.name}</span>
            </div>
            <div className="flex items-center gap-3 font-mono font-bold text-slate-700">
              <span>{c.value}</span>
              <span className="text-slate-400 text-[11px]">({c.pct})</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

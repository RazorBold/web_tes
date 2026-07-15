"use client";

import React from "react";
import BaseChart from "@/components/charts/base-chart";
import { Waves, AlertTriangle, Battery, Wifi, MapPin } from "lucide-react";

export default function FloodSmartMeter() {
  const historyOption = {
    grid: { left: "3%", right: "3%", bottom: "3%", top: "12%", containLabel: true },
    xAxis: {
      type: "category",
      data: ["10:00", "12:00", "14:00", "16:00", "18:00", "20:00"],
      axisLabel: { fontFamily: "Inter, sans-serif", fontSize: 9, color: "#94A3B8" },
      axisLine: { lineStyle: { color: "#E2E8F0" } },
    },
    yAxis: {
      type: "value",
      axisLabel: { fontFamily: "Inter, sans-serif", fontSize: 9, color: "#94A3B8" },
      splitLine: { lineStyle: { color: "#F1F5F9" } },
    },
    tooltip: { trigger: "axis", textStyle: { fontFamily: "Inter, sans-serif", fontSize: 11 } },
    series: [
      {
        name: "Ketinggian Air",
        data: [1.2, 1.45, 1.7, 1.85, 1.9, 1.85],
        type: "bar",
        barWidth: 16,
        itemStyle: {
          color: {
            type: "linear",
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: "#3B82F6" }, // blue
              { offset: 1, color: "rgba(59, 130, 246, 0.3)" },
            ],
          },
          borderRadius: [4, 4, 0, 0],
        },
      },
    ],
  };

  return (
    <div className="bg-white/45 backdrop-blur-md border border-white/70 rounded-2xl p-5 shadow-sm flex flex-col h-[420px]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200/70 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100/50">
            <Waves className="h-5 w-5 text-blue-500 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base leading-none">Flood Smart Meter</h3>
            <p className="text-[10px] text-slate-400 font-semibold mt-1">Sensor Ketinggian Air &amp; Banjir</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[9px] font-bold text-slate-400">SDA DKI</span>
          <div className="h-6 px-1.5 rounded-lg bg-blue-500 text-white text-[8px] font-extrabold flex items-center justify-center">
            PWS-01
          </div>
        </div>
      </div>

      {/* Current conditions container */}
      <div className="bg-gradient-to-br from-blue-50/50 to-slate-50 border border-blue-100 rounded-2xl p-4 mt-4 flex items-center justify-between gap-4">
        {/* Wave Animation Visual */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-14 w-12 rounded-xl border border-blue-200 bg-white relative overflow-hidden flex flex-col justify-end flex-shrink-0 shadow-inner">
            {/* Blue animated wave background representation */}
            <div className="absolute bottom-0 inset-x-0 bg-blue-500/35 h-[62%] animate-pulse" />
            <div className="absolute bottom-0 inset-x-0 bg-blue-600/50 h-[58%] animate-bounce" />
            <div className="z-10 text-center font-extrabold text-[10px] text-blue-900 font-mono mb-1 w-full leading-none">
              62%
            </div>
          </div>
          <div className="min-w-0 leading-tight">
            <span className="flex items-center gap-1 text-[10.5px] font-bold text-slate-500 truncate">
              <MapPin className="h-3 w-3 text-brand-red flex-shrink-0" />
              Pintu Air Manggarai
            </span>
            <h4 className="text-3xl font-extrabold text-slate-800 tracking-tight leading-none mt-1.5 flex items-baseline gap-0.5">
              1.85
              <span className="text-sm font-extrabold text-slate-400 font-sans">m</span>
            </h4>
            <span className="inline-flex items-center gap-1 text-[9.5px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200/60 rounded-full px-2 py-0.5 mt-2">
              <AlertTriangle className="h-2.5 w-2.5" />
              Siaga II / Waspada
            </span>
          </div>
        </div>

        {/* Telemetry Stats Right */}
        <div className="flex flex-col gap-2 flex-shrink-0">
          {/* Signal */}
          <div className="flex items-center gap-2 bg-white border border-slate-100 rounded-xl px-2.5 py-1.5 shadow-sm">
            <Wifi className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
            <div className="leading-tight">
              <span className="text-[8.5px] font-bold text-slate-400 block">Konektivitas</span>
              <span className="text-[11px] font-extrabold text-slate-700 leading-none">Aktif (98%)</span>
            </div>
          </div>
          {/* Battery */}
          <div className="flex items-center gap-2 bg-white border border-slate-100 rounded-xl px-2.5 py-1.5 shadow-sm">
            <Battery className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
            <div className="leading-tight">
              <span className="text-[8.5px] font-bold text-slate-400 block">Daya Baterai</span>
              <span className="text-[11px] font-extrabold text-slate-700 leading-none">94% (Sehat)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Historical chart */}
      <div className="flex-1 flex flex-col min-h-0 mt-3">
        <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
          Histori Level Air 12 Jam Terakhir
        </span>
        <div className="flex-1 w-full h-full relative min-h-0">
          <BaseChart option={historyOption} />
        </div>
      </div>
    </div>
  );
}

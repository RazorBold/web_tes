"use client";

import React from "react";
import BaseChart from "@/components/charts/base-chart";
import { Waves, AlertTriangle, Battery, Wifi, MapPin } from "lucide-react";
import { useFloodSensor, useFloodSensorHistory } from "@/hooks/use-flood";
import { floodLevelLabel } from "@/lib/format";

const FLAGSHIP_SENSOR_ID = "fs_01";

const alertBadgeColor = (level: string) =>
  level === "bahaya"
    ? "text-brand-red bg-red-50 border-red-200/60"
    : level === "siaga"
    ? "text-orange-700 bg-orange-50 border-orange-200/60"
    : level === "waspada"
    ? "text-amber-700 bg-amber-50 border-amber-200/60"
    : "text-emerald-700 bg-emerald-50 border-emerald-200/60";

export default function FloodSmartMeter() {
  const { data: sensor } = useFloodSensor(FLAGSHIP_SENSOR_ID);
  const { data: history } = useFloodSensorHistory(FLAGSHIP_SENSOR_ID);

  const historyOption = {
    grid: { left: "3%", right: "3%", bottom: "3%", top: "12%", containLabel: true },
    xAxis: {
      type: "category",
      data: (history ?? []).map((h) =>
        new Date(h.recordedAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
      ),
      axisLabel: { fontFamily: "Inter, sans-serif", fontSize: 11, color: "#94A3B8" },
      axisLine: { lineStyle: { color: "#E2E8F0" } },
    },
    yAxis: {
      type: "value",
      axisLabel: { fontFamily: "Inter, sans-serif", fontSize: 11, color: "#94A3B8" },
      splitLine: { lineStyle: { color: "#F1F5F9" } },
    },
    tooltip: { trigger: "axis", textStyle: { fontFamily: "Inter, sans-serif", fontSize: 13 } },
    series: [
      {
        name: "Ketinggian Air (cm)",
        data: (history ?? []).map((h) => h.waterLevelCm),
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

  const levelPct = sensor ? Math.min(100, Math.round((sensor.waterLevelCm / 350) * 100)) : 0;

  return (
    <div className="bg-white/60 backdrop-blur-md border border-slate-300/80 rounded-2xl p-5 shadow-sm flex flex-col h-[420px]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200/70 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100/50">
            <Waves className="h-5 w-5 text-blue-500 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base leading-none">Flood Smart Meter</h3>
            <p className="text-[12px] text-slate-400 font-semibold mt-1">Sensor Ketinggian Air &amp; Banjir</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[11px] font-bold text-slate-400">SDA DKI</span>
          <div className="h-6 px-1.5 rounded-lg bg-blue-500 text-white text-[11px] font-extrabold flex items-center justify-center">
            {sensor?.id ?? "—"}
          </div>
        </div>
      </div>

      {/* Current conditions container */}
      {/* `flex-wrap`: kartu ini kini berbagi baris dengan Energy/Environment/Weather,
          jadi saat kolom menyempit chip telemetri turun ke bawah, bukan saling tindih. */}
      <div className="bg-gradient-to-br from-blue-50/50 to-slate-50 border border-blue-100 rounded-2xl p-4 mt-4 flex flex-wrap items-center justify-between gap-4">
        {/* Wave Animation Visual */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-14 w-12 rounded-xl border border-blue-200 bg-white relative overflow-hidden flex flex-col justify-end flex-shrink-0 shadow-inner">
            {/* Blue animated wave background representation */}
            <div className="absolute bottom-0 inset-x-0 bg-blue-500/35 animate-pulse" style={{ height: `${levelPct}%` }} />
            <div className="absolute bottom-0 inset-x-0 bg-blue-600/50 animate-bounce" style={{ height: `${Math.max(0, levelPct - 4)}%` }} />
            <div className="z-10 text-center font-extrabold text-[12px] text-blue-900 font-mono mb-1 w-full leading-none">
              {levelPct}%
            </div>
          </div>
          <div className="min-w-0 leading-tight">
            <span className="flex items-center gap-1 text-[12px] font-bold text-slate-500 truncate">
              <MapPin className="h-3 w-3 text-brand-red flex-shrink-0" />
              {sensor?.name ?? "Memuat..."}
            </span>
            <h4 className="text-3xl font-extrabold text-slate-800 tracking-tight leading-none mt-1.5 flex items-baseline gap-0.5">
              {sensor ? (sensor.waterLevelCm / 100).toFixed(2) : "—"}
              <span className="text-sm font-extrabold text-slate-400 font-sans">m</span>
            </h4>
            {sensor && (
              <span className={`inline-flex items-center gap-1 text-[11px] font-extrabold rounded-full px-2 py-0.5 mt-2 border ${alertBadgeColor(sensor.alertLevel)}`}>
                <AlertTriangle className="h-2.5 w-2.5" />
                {floodLevelLabel(sensor.alertLevel)}
              </span>
            )}
          </div>
        </div>

        {/* Telemetry Stats Right */}
        <div className="flex flex-col gap-2 flex-shrink-0">
          {/* Signal */}
          <div className="flex items-center gap-2 bg-white border border-slate-100 rounded-xl px-2.5 py-1.5 shadow-sm">
            <Wifi className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
            <div className="leading-tight">
              <span className="text-[11px] font-bold text-slate-400 block">Konektivitas</span>
              <span className="text-[13px] font-extrabold text-slate-700 leading-none">
                {sensor?.status === "online" ? "Aktif" : "Offline"}
              </span>
            </div>
          </div>
          {/* Battery */}
          <div className="flex items-center gap-2 bg-white border border-slate-100 rounded-xl px-2.5 py-1.5 shadow-sm">
            <Battery className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
            <div className="leading-tight">
              <span className="text-[11px] font-bold text-slate-400 block">Daya Baterai</span>
              <span className="text-[13px] font-extrabold text-slate-700 leading-none">
                {sensor?.battery != null ? `${sensor.battery}%` : "—"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Historical chart */}
      <div className="flex-1 flex flex-col min-h-0 mt-3">
        <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
          Histori Level Air Terakhir
        </span>
        <div className="flex-1 w-full h-full relative min-h-0">
          <BaseChart option={historyOption} />
        </div>
      </div>
    </div>
  );
}

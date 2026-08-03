"use client";

import React from "react";
import { CloudRain, Compass, Radio, Cloud, Sun, CloudSun, MapPin } from "lucide-react";
import { useWeatherOverview } from "@/hooks/use-weather";
import { windDirectionLabel } from "@/lib/format";

const CONDITION_LABEL: Record<string, string> = {
  hujan_ringan: "Hujan Ringan",
  cerah_berawan: "Cerah Berawan",
  cerah: "Cerah",
  berawan: "Berawan",
};

function conditionIcon(condition: string, className = "h-4 w-4") {
  if (condition.includes("hujan")) return <CloudRain className={`${className} text-blue-500`} />;
  if (condition === "cerah") return <Sun className={`${className} text-amber-500`} />;
  if (condition.includes("cerah")) return <CloudSun className={`${className} text-slate-400`} />;
  return <Cloud className={`${className} text-slate-400`} />;
}

export default function WeatherWidget() {
  const { data: overview } = useWeatherOverview();
  const recent = (overview?.hourlyTemp ?? []).slice(-6);

  return (
    <div className="bg-white/60 backdrop-blur-md border border-slate-300/80 rounded-2xl p-5 shadow-sm flex flex-col h-[420px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center">
            <CloudRain className="h-5 w-5 text-blue-500" />
          </div>
          <h3 className="font-bold text-slate-800 text-base">Cuaca Indonesia</h3>
        </div>
        <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 text-[12px] font-bold px-2.5 py-1 rounded-full border border-emerald-100 uppercase tracking-wider">
          <Radio className="h-3 w-3" /> Sensor Aktif
        </span>
      </div>

      {/* Current conditions card */}
      <div className="bg-gradient-to-br from-blue-50 to-slate-50 border border-blue-100 rounded-2xl p-4 mt-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <CloudRain className="h-14 w-14 text-blue-400 flex-shrink-0" strokeWidth={1.5} />
          <div className="min-w-0">
            <span className="flex items-center gap-1 text-[13px] font-semibold text-slate-500">
              <MapPin className="h-3 w-3 text-brand-red" /> {overview?.station.zone ?? "Memuat..."}
            </span>
            <h4 className="text-4xl font-extrabold text-slate-800 tracking-tight leading-none mt-1">
              {overview ? Math.round(overview.current.temperature) : "—"}
              <span className="text-xl align-top text-slate-400">°C</span>
            </h4>
            <span className="inline-flex items-center gap-1 text-[13px] font-bold text-blue-700 bg-blue-100 border border-blue-200 rounded-full px-2 py-0.5 mt-1.5">
              <CloudRain className="h-3 w-3" /> {overview ? CONDITION_LABEL[overview.current.condition] ?? overview.current.condition : "—"}
            </span>
          </div>
        </div>

        {/* Curah Hujan & Arah Angin */}
        <div className="flex flex-col gap-2.5 flex-shrink-0">
          <div className="flex items-center gap-2 bg-white/70 rounded-xl px-3 py-2 border border-blue-100">
            <CloudRain className="h-4 w-4 text-blue-500 flex-shrink-0" />
            <div className="leading-tight">
              <span className="text-[11px] font-semibold text-slate-400 block">Curah Hujan</span>
              <span className="text-sm font-extrabold text-slate-700">
                {overview ? `${overview.current.rainfall} mm/jam` : "—"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white/70 rounded-xl px-3 py-2 border border-blue-100">
            <Compass className="h-4 w-4 text-blue-500 flex-shrink-0" />
            <div className="leading-tight">
              <span className="text-[11px] font-semibold text-slate-400 block">Arah Angin</span>
              <span className="text-sm font-extrabold text-slate-700">
                {overview ? `${windDirectionLabel(overview.current.windDirection)} · ${overview.current.windSpeed} km/h` : "—"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent readings */}
      <div className="flex-1 flex flex-col justify-center mt-2">
        <div className="grid grid-cols-6 gap-2">
          {recent.map((r, i) => (
            <div
              key={i}
              className="flex flex-col items-center bg-slate-50 rounded-xl py-3 border border-slate-100"
            >
              <span className="text-[12px] font-semibold text-slate-400 font-mono">{r.time}</span>
              {conditionIcon(overview?.current.condition ?? "berawan", "h-5 w-5 my-2")}
              <span className="text-[14px] font-extrabold text-slate-700 font-mono">{Math.round(r.temperature)}°</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

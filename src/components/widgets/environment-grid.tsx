"use client";

import React from "react";
import { Thermometer, Droplets, Volume2, Wind, ShieldCheck, BarChart3, ChevronRight } from "lucide-react";

interface EnvMetric {
  name: string;
  value: string;
  unit: string;
  status: string;
  statusType: "good" | "normal" | "warn";
  icon: React.ReactNode;
}

const metrics: EnvMetric[] = [
  { name: "AQI", value: "42", unit: "", status: "Baik", statusType: "good", icon: <Wind className="h-6 w-6 text-emerald-500" /> },
  { name: "Suhu", value: "26,3", unit: "°C", status: "Normal", statusType: "normal", icon: <Thermometer className="h-6 w-6 text-brand-red" /> },
  { name: "Kelembapan", value: "77,4", unit: "%", status: "Normal", statusType: "normal", icon: <Droplets className="h-6 w-6 text-blue-500" /> },
  { name: "PM2.5", value: "12,5", unit: "µg/m³", status: "Baik", statusType: "good", icon: <ShieldCheck className="h-6 w-6 text-emerald-500" /> },
  { name: "CO2", value: "410", unit: "ppm", status: "Normal", statusType: "normal", icon: <Wind className="h-6 w-6 text-slate-400" /> },
  { name: "Kebisingan", value: "58", unit: "dB", status: "Sedang", statusType: "warn", icon: <Volume2 className="h-6 w-6 text-amber-500" /> },
];

const statusColor = (type: EnvMetric["statusType"]) =>
  type === "good" ? "text-emerald-500" : type === "warn" ? "text-amber-500" : "text-slate-400";

export default function EnvironmentGrid() {
  return (
    <div className="bg-white/45 backdrop-blur-md border border-white/70 rounded-2xl p-5 shadow-sm flex flex-col gap-3 h-[420px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <BarChart3 className="h-5 w-5 text-emerald-500" />
          </div>
          <h3 className="font-bold text-slate-800 text-base">Kondisi Lingkungan</h3>
        </div>
        <a
          href="/weather"
          className="text-[10px] font-bold text-brand-red hover:text-brand-red-hover transition-colors flex items-center gap-0.5"
        >
          Lihat Semua Sensor <ChevronRight className="h-3 w-3" />
        </a>
      </div>

      {/* Metrics Grid */}
      <div className="flex-1 grid grid-cols-2 gap-3">
        {metrics.map((item) => (
          <div
            key={item.name}
            className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/40 flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex flex-col justify-between h-full">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide leading-none">
                {item.name}
              </span>
              <h4 className="text-xl font-extrabold text-slate-800 font-mono tracking-tight mt-2.5 leading-none">
                {item.value}
                {item.unit && <span className="text-xs font-bold text-slate-500 font-sans ml-0.5">{item.unit}</span>}
              </h4>
              <span className={`text-[10px] font-bold mt-2.5 leading-none ${statusColor(item.statusType)}`}>
                {item.status}
              </span>
            </div>
            <div className="h-10 w-10 rounded-full bg-white border border-slate-100 flex items-center justify-center shadow-sm flex-shrink-0">
              {item.icon}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

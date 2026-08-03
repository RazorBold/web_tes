"use client";

import React from "react";
import { Thermometer, Droplets, BarChart3, ChevronRight } from "lucide-react";
import { useTempHumOverview } from "@/hooks/use-temphum";

/* Lightweight smooth SVG sparkline (no chart library needed) */
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const w = 120;
  const h = 36;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((d, i) => [
    (i / (data.length - 1)) * w,
    h - 3 - ((d - min) / range) * (h - 8),
  ]);

  let line = `M ${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const mx = (x0 + x1) / 2;
    const my = (y0 + y1) / 2;
    line += ` Q ${x0.toFixed(1)},${y0.toFixed(1)} ${mx.toFixed(1)},${my.toFixed(1)}`;
  }
  line += ` L ${pts[pts.length - 1][0].toFixed(1)},${pts[pts.length - 1][1].toFixed(1)}`;
  const area = `${line} L ${w},${h} L 0,${h} Z`;
  const id = React.useId();

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="3" fill={color} stroke="#fff" strokeWidth="1.5" />
    </svg>
  );
}

const statusColor = (ok: boolean) => (ok ? "text-emerald-600 bg-emerald-50 border-emerald-100" : "text-amber-600 bg-amber-50 border-amber-100");

export default function EnvironmentGrid() {
  const { data: overview } = useTempHumOverview();

  const tempHistory = overview?.tempHistory.length ? overview.tempHistory : [0, 0];
  const humHistory = overview?.humidityHistory.length ? overview.humidityHistory : [0, 0];

  const metrics = [
    {
      name: "Suhu",
      value: overview ? overview.avgTemp.toString().replace(".", ",") : "—",
      unit: "°C",
      ok: overview ? overview.avgTemp >= 18 && overview.avgTemp <= 32 : true,
      icon: <Thermometer className="h-6 w-6 text-brand-red" />,
      iconBg: "bg-red-50",
      accent: "#DC2626",
      history: tempHistory,
      pct: overview ? Math.min(100, Math.round(((overview.avgTemp - 18) / (32 - 18)) * 100)) : 0,
      range: "18°C – 32°C",
    },
    {
      name: "Kelembapan",
      value: overview ? overview.avgHumidity.toString().replace(".", ",") : "—",
      unit: "%",
      ok: overview ? overview.avgHumidity >= 30 && overview.avgHumidity <= 90 : true,
      icon: <Droplets className="h-6 w-6 text-blue-500" />,
      iconBg: "bg-blue-50",
      accent: "#3B82F6",
      history: humHistory,
      pct: overview ? Math.min(100, Math.round(((overview.avgHumidity - 30) / (90 - 30)) * 100)) : 0,
      range: "30% – 90%",
    },
  ];

  return (
    <div className="bg-white/60 backdrop-blur-md border border-slate-300/80 rounded-2xl p-5 shadow-sm flex flex-col gap-4 h-[420px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <BarChart3 className="h-5 w-5 text-emerald-500" />
          </div>
          <h3 className="font-bold text-slate-800 text-base">Kondisi Suhu &amp; Kelembapan</h3>
        </div>
        <a
          href="/temphum"
          className="text-[12px] font-bold text-brand-red hover:text-brand-red-hover transition-colors flex items-center gap-0.5"
        >
          Lihat Semua Ruangan <ChevronRight className="h-3 w-3" />
        </a>
      </div>

      {/* Metrics */}
      <div className="flex-1 flex flex-col gap-4">
        {metrics.map((item) => (
          <div
            key={item.name}
            className="flex-1 border border-slate-200 rounded-2xl p-4 bg-slate-50/40 flex flex-col justify-between hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`h-11 w-11 rounded-xl ${item.iconBg} flex items-center justify-center flex-shrink-0`}>
                  {item.icon}
                </div>
                <div className="min-w-0">
                  <span className="text-[13px] font-bold text-slate-400 uppercase tracking-wide block">
                    {item.name}
                  </span>
                  <h4 className="text-2xl font-extrabold text-slate-800 font-mono tracking-tight leading-none mt-1">
                    {item.value}
                    <span className="text-xs font-bold text-slate-500 font-sans ml-1">{item.unit}</span>
                  </h4>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <span className={`text-[12px] font-extrabold px-2.5 py-1 rounded-full border ${statusColor(item.ok)}`}>
                  {item.ok ? "Normal" : "Waspada"}
                </span>
                <div className="w-[92px] h-9">
                  <Sparkline data={item.history} color={item.accent} />
                </div>
              </div>
            </div>
            <div className="mt-3">
              <div className="w-full bg-white h-1.5 rounded-full overflow-hidden border border-slate-100">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${item.pct}%`, backgroundColor: item.accent }}
                />
              </div>
              <span className="text-[12px] font-semibold text-slate-400 mt-1.5 block">
                Rentang aman: {item.range}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

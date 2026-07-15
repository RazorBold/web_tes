"use client";

import React from "react";
import Section from "@/components/layout/section";
import PageHeader from "@/components/layout/page-header";
import BaseChart from "@/components/charts/base-chart";
import TotalEnergyWidget from "@/components/widgets/total-energy-widget";
import { Zap, Clock, Award, TrendingDown, PlugZap, Gauge, Waves, Percent } from "lucide-react";

const stats = [
  { label: "Total Energi", value: "6.759,13", unit: "MWh", note: "+1,8% vs bulan lalu", icon: <Zap className="h-5 w-5 text-amber-500" />, bg: "bg-amber-50" },
  { label: "Beban Puncak", value: "1.290", unit: "kW", note: "Jumat, 17:00 WIB", icon: <Clock className="h-5 w-5 text-orange-500" />, bg: "bg-orange-50" },
  { label: "Faktor Daya", value: "0,96", unit: "", note: "Optimal (> 0,95)", icon: <Award className="h-5 w-5 text-emerald-500" />, bg: "bg-emerald-50" },
  { label: "Susut Energi", value: "1,78", unit: "%", note: "Di bawah ambang 2%", icon: <TrendingDown className="h-5 w-5 text-brand-red" />, bg: "bg-red-50" },
];

const sectors = [
  { name: "Sektor Industri", value: 3115, pct: 46, color: "#DC2626" },
  { name: "Sektor Komersial", value: 2365, pct: 35, color: "#475569" },
  { name: "Sektor Residensial", value: 1279, pct: 19, color: "#F59E0B" },
];

const quality = [
  { label: "Tegangan", value: "220,5", unit: "V", pct: 92, status: "Normal", icon: <PlugZap className="h-4 w-4" /> },
  { label: "Arus", value: "45,2", unit: "A", pct: 68, status: "Normal", icon: <Gauge className="h-4 w-4" /> },
  { label: "Frekuensi", value: "50,0", unit: "Hz", pct: 100, status: "Stabil", icon: <Waves className="h-4 w-4" /> },
  { label: "Power Factor", value: "0,96", unit: "", pct: 96, status: "Optimal", icon: <Percent className="h-4 w-4" /> },
];

const loadOption = {
  grid: { left: "2%", right: "2%", bottom: "3%", top: "12%", containLabel: true },
  xAxis: {
    type: "category",
    boundaryGap: false,
    data: ["00:00", "03:00", "06:00", "09:00", "12:00", "15:00", "18:00", "21:00"],
    axisLabel: { fontFamily: "Inter, sans-serif", fontSize: 10, color: "#94A3B8" },
    axisLine: { lineStyle: { color: "#E2E8F0" } },
  },
  yAxis: {
    type: "value",
    axisLabel: { fontFamily: "Inter, sans-serif", fontSize: 10, color: "#94A3B8" },
    splitLine: { lineStyle: { color: "#F1F5F9" } },
  },
  tooltip: { trigger: "axis", textStyle: { fontFamily: "Inter, sans-serif", fontSize: 11 } },
  legend: {
    data: ["Beban Hari Ini", "Rata-rata"],
    top: 0,
    textStyle: { fontFamily: "Inter, sans-serif", fontSize: 10, color: "#64748B" },
  },
  series: [
    {
      name: "Beban Hari Ini",
      data: [420, 380, 520, 890, 1120, 1050, 1290, 760],
      type: "line",
      smooth: true,
      symbol: "none",
      lineStyle: { color: "#F59E0B", width: 3 },
      areaStyle: {
        color: {
          type: "linear", x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: "rgba(245,158,11,0.18)" },
            { offset: 1, color: "rgba(245,158,11,0)" },
          ],
        },
      },
    },
    {
      name: "Rata-rata",
      data: [400, 360, 480, 800, 980, 940, 1050, 700],
      type: "line",
      smooth: true,
      symbol: "none",
      lineStyle: { color: "#94A3B8", width: 1.5, type: "dashed" },
    },
  ],
};

const donutOption = {
  tooltip: { trigger: "item", formatter: "{b}: {c} MWh ({d}%)", textStyle: { fontFamily: "Inter, sans-serif", fontSize: 11 } },
  color: sectors.map((s) => s.color),
  series: [
    {
      type: "pie",
      radius: ["58%", "82%"],
      center: ["50%", "50%"],
      label: { show: false },
      labelLine: { show: false },
      data: sectors.map((s) => ({ value: s.value, name: s.name })),
    },
  ],
};

export default function PowerPage() {
  return (
    <div className="space-y-6 pb-4">
      <PageHeader
        title="Energy Monitoring"
        subtitle="Pemantauan konsumsi listrik, profil beban & kualitas daya nasional"
        right={
          <span className="flex items-center gap-1.5 bg-amber-50 text-amber-600 text-[10px] font-bold px-2.5 py-1 rounded-full border border-amber-100 uppercase tracking-wider">
            <Zap className="h-3 w-3" /> 18 Power Meter Aktif
          </span>
        }
      />

      {/* 1. Ringkasan */}
      <Section num={1} title="Ringkasan Energi">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-white/45 backdrop-blur-md border border-white/70 rounded-2xl p-5 shadow-sm flex items-center gap-4">
              <div className={`h-11 w-11 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>{s.icon}</div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">{s.label}</span>
                <h4 className="text-xl font-extrabold text-slate-800 leading-none mt-1 flex items-baseline gap-1">
                  {s.value}
                  {s.unit && <span className="text-[11px] font-bold text-slate-400">{s.unit}</span>}
                </h4>
                <span className="text-[10px] font-semibold text-slate-400 block mt-1">{s.note}</span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* 2. Profil Beban & Sektor */}
      <Section num={2} title="Profil Beban Harian & Distribusi Sektor">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 bg-white/45 backdrop-blur-md border border-white/70 rounded-2xl p-5 shadow-sm h-[380px] flex flex-col">
            <h3 className="font-bold text-slate-800 text-sm mb-2">Kurva Beban 24 Jam</h3>
            <div className="flex-1 min-h-0">
              <BaseChart option={loadOption} className="w-full h-full" />
            </div>
          </div>

          <div className="bg-white/45 backdrop-blur-md border border-white/70 rounded-2xl p-5 shadow-sm h-[380px] flex flex-col">
            <h3 className="font-bold text-slate-700 text-[11px] tracking-wider uppercase border-b border-slate-100 pb-2">
              Energi per Sektor
            </h3>
            <div className="relative h-[170px] mt-2">
              <BaseChart option={donutOption} className="w-full h-full" />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center leading-none">
                <span className="text-[9px] font-bold text-slate-400 uppercase">Total</span>
                <span className="text-base font-extrabold text-slate-800 font-mono mt-1">6.759</span>
                <span className="text-[9px] font-bold text-slate-500 mt-0.5">MWh</span>
              </div>
            </div>
            <div className="flex-1 flex flex-col justify-center gap-3 mt-2">
              {sectors.map((s) => (
                <div key={s.name} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: s.color }} />
                      <span className="text-[11px] font-bold text-slate-700">{s.name}</span>
                    </div>
                    <span className="text-[11px] font-extrabold text-slate-800 font-mono">{s.pct}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${s.pct}%`, backgroundColor: s.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* 3. Kualitas Daya */}
      <Section num={3} title="Kualitas Daya Real-time">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {quality.map((q) => (
              <div key={q.label} className="bg-white/45 backdrop-blur-md border border-white/70 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">{q.icon}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{q.label}</span>
                  </div>
                  <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5">{q.status}</span>
                </div>
                <h4 className="text-2xl font-extrabold text-slate-800 font-mono leading-none mt-3 flex items-baseline gap-1">
                  {q.value}
                  {q.unit && <span className="text-xs font-bold text-slate-400 font-sans">{q.unit}</span>}
                </h4>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-3">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${q.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
          <TotalEnergyWidget />
        </div>
      </Section>
    </div>
  );
}

"use client";

import React from "react";
import Section from "@/components/layout/section";
import PageHeader from "@/components/layout/page-header";
import BaseChart from "@/components/charts/base-chart";
import TotalWaterWidget from "@/components/widgets/total-water-widget";
import {
  Droplets,
  Gauge,
  Activity,
  ShieldAlert,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  Trophy,
} from "lucide-react";

const stats = [
  { label: "Total Pemakaian", value: "9.265", unit: "m³", note: "+6,2% vs bulan lalu", icon: <Droplets className="h-5 w-5 text-blue-500" />, bg: "bg-blue-50" },
  { label: "Rata-rata Harian", value: "335", unit: "m³/hari", note: "Stabil 7 hari terakhir", icon: <Gauge className="h-5 w-5 text-indigo-500" />, bg: "bg-indigo-50" },
  { label: "Sensor Aktif", value: "24/24", unit: "", note: "Konektivitas 100%", icon: <Activity className="h-5 w-5 text-emerald-500" />, bg: "bg-emerald-50" },
  { label: "Kebocoran Jaringan", value: "0,2", unit: "%", note: "Minimal · Terkendali", icon: <ShieldAlert className="h-5 w-5 text-amber-500" />, bg: "bg-amber-50" },
];

const topMeters = [
  { rank: 1, name: "Loka Citra", value: 221 },
  { rank: 2, name: "Larang Prabu 3", value: 555 },
  { rank: 3, name: "Cikondang", value: 103 },
  { rank: 4, name: "Larang Prabu 1", value: 396 },
  { rank: 5, name: "Larang Prabu 2", value: 289 },
];

const topCustomers = [
  { name: "PT. Sinar Abadi Utama", zone: "Jakarta Pusat", usage: 540 },
  { name: "Mall Nusantara Plaza", zone: "Jakarta Pusat", usage: 485 },
  { name: "Hotel Sentosa Indah", zone: "Jakarta Selatan", usage: 410 },
  { name: "Apartemen Green Garden", zone: "Jakarta Barat", usage: 390 },
  { name: "Resto Selera Rakyat", zone: "Jakarta Timur", usage: 315 },
];

const zones = [
  { name: "Zona A · Jakarta Pusat", status: "Normal", ok: true, flow: "3,2 Bar" },
  { name: "Zona B · Jakarta Selatan", status: "Bocor Terdeteksi", ok: false, flow: "2,1 Bar" },
  { name: "Zona C · Jakarta Timur", status: "Normal", ok: true, flow: "3,0 Bar" },
  { name: "Zona D · Bekasi", status: "Normal", ok: true, flow: "3,4 Bar" },
];

const trendOption = {
  grid: { left: "2%", right: "2%", bottom: "3%", top: "10%", containLabel: true },
  xAxis: {
    type: "category",
    boundaryGap: false,
    data: ["1 Mei", "3 Mei", "5 Mei", "7 Mei", "9 Mei", "11 Mei", "13 Mei", "15 Mei"],
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { fontFamily: "Inter, sans-serif", fontSize: 10, color: "#94A3B8" },
  },
  yAxis: {
    type: "value",
    axisLabel: { fontFamily: "Inter, sans-serif", fontSize: 10, color: "#94A3B8" },
    splitLine: { lineStyle: { color: "#F1F5F9" } },
  },
  tooltip: { trigger: "axis", textStyle: { fontFamily: "Inter, sans-serif", fontSize: 11 } },
  series: [
    {
      name: "Debit Air (m³)",
      data: [280, 310, 290, 340, 380, 410, 430, 490],
      type: "line",
      smooth: true,
      symbol: "circle",
      symbolSize: 6,
      itemStyle: { color: "#3B82F6", borderWidth: 2, borderColor: "#fff" },
      lineStyle: { width: 3 },
      areaStyle: {
        color: {
          type: "linear", x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: "rgba(59,130,246,0.18)" },
            { offset: 1, color: "rgba(59,130,246,0.005)" },
          ],
        },
      },
    },
  ],
};

const rankStyle = (i: number) =>
  i === 0
    ? "bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/30"
    : i === 1
    ? "bg-slate-400/10 text-slate-500 ring-1 ring-slate-400/30"
    : i === 2
    ? "bg-amber-700/10 text-amber-800 ring-1 ring-amber-700/30"
    : "bg-slate-50 text-slate-400";

export default function WaterPage() {
  return (
    <div className="space-y-6 pb-4">
      <PageHeader
        title="Smart Water Meter"
        subtitle="Pemantauan pemakaian & distribusi air bersih secara nasional"
        right={
          <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-100 uppercase tracking-wider">
            <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" /> 24 Sensor Online
          </span>
        }
      />

      {/* 1. Ringkasan */}
      <Section num={1} title="Ringkasan Pemakaian Air">
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

      {/* 2. Tren & Peringkat */}
      <Section num={2} title="Tren & Peringkat Konsumsi">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Trend chart */}
          <div className="xl:col-span-2 bg-white/45 backdrop-blur-md border border-white/70 rounded-2xl p-5 shadow-sm h-[380px] flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-800 text-sm">Tren Penggunaan 15 Hari Terakhir</h3>
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5">
                <ArrowUpRight className="h-3 w-3" /> +6,2%
              </span>
            </div>
            <div className="flex-1 min-h-0">
              <BaseChart option={trendOption} className="w-full h-full" />
            </div>
          </div>

          {/* Top meters + customers */}
          <div className="flex flex-col gap-4">
            <div className="bg-white/45 backdrop-blur-md border border-white/70 rounded-2xl p-5 shadow-sm flex-1">
              <h3 className="font-bold text-slate-700 text-[11px] tracking-wider uppercase border-b border-slate-100 pb-2 mb-3">
                Top Water Meters
              </h3>
              <div className="space-y-2.5">
                {topMeters.map((m) => (
                  <div key={m.rank} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-5 w-5 rounded-full bg-brand-red text-white font-extrabold text-[9px] flex items-center justify-center">{m.rank}</span>
                      <span className="text-xs font-bold text-slate-700">{m.name}</span>
                    </div>
                    <span className="text-xs font-extrabold text-slate-900 font-mono">
                      {m.value} <span className="text-[9px] text-slate-400 font-sans font-semibold">m³</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white/45 backdrop-blur-md border border-white/70 rounded-2xl p-5 shadow-sm flex-1">
              <h3 className="font-bold text-slate-700 text-[11px] tracking-wider uppercase border-b border-slate-100 pb-2 mb-3 flex items-center gap-1.5">
                <Trophy className="h-3.5 w-3.5 text-amber-500" /> Pelanggan Terbesar
              </h3>
              <div className="space-y-2">
                {topCustomers.map((c, i) => (
                  <div key={c.name} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`h-5 w-5 rounded-full text-[9px] font-extrabold flex items-center justify-center flex-shrink-0 ${rankStyle(i)}`}>{i + 1}</span>
                      <div className="min-w-0 leading-tight">
                        <span className="text-[11px] font-bold text-slate-700 truncate block">{c.name}</span>
                        <span className="text-[9px] font-semibold text-slate-400">{c.zone}</span>
                      </div>
                    </div>
                    <span className="text-[11px] font-extrabold text-slate-800 font-mono flex-shrink-0">{c.usage} m³</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* 3. Deteksi Kebocoran */}
      <Section num={3} title="Deteksi Kebocoran per Zona">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {zones.map((z) => (
              <div
                key={z.name}
                className={`rounded-2xl p-4 border backdrop-blur-md shadow-sm flex items-start justify-between gap-3 ${
                  z.ok ? "bg-white/45 border-white/70" : "bg-red-50/70 border-red-200"
                }`}
              >
                <div>
                  <span className="text-[11px] font-bold text-slate-700 block">{z.name}</span>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold mt-2 px-2 py-0.5 rounded-full border ${
                    z.ok ? "text-emerald-600 bg-emerald-50 border-emerald-100" : "text-brand-red bg-red-50 border-red-200"
                  }`}>
                    {z.ok ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                    {z.status}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400 block mt-2">Tekanan: {z.flow}</span>
                </div>
                <Droplets className={`h-8 w-8 flex-shrink-0 ${z.ok ? "text-blue-200" : "text-red-300"}`} />
              </div>
            ))}
          </div>
          <TotalWaterWidget />
        </div>
      </Section>
    </div>
  );
}

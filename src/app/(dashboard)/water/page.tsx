"use client";

import React from "react";
import Section from "@/components/layout/section";
import PageHeader from "@/components/layout/page-header";
import BaseChart from "@/components/charts/base-chart";
import TotalWaterWidget from "@/components/widgets/total-water-widget";
import { useWaterOverview, useWaterMeters, useWaterZones } from "@/hooks/use-water";
import { RETENTION_LABEL } from "@/config/retention";
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

const rankStyle = (i: number) =>
  i === 0
    ? "bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/30"
    : i === 1
    ? "bg-slate-400/10 text-slate-500 ring-1 ring-slate-400/30"
    : i === 2
    ? "bg-amber-700/10 text-amber-800 ring-1 ring-amber-700/30"
    : "bg-slate-50 text-slate-400";

export default function WaterPage() {
  const { data: overview } = useWaterOverview();
  const { data: meters } = useWaterMeters();
  const { data: zones } = useWaterZones();

  const onlineMeters = meters?.filter((m) => m.status === "online").length ?? 0;
  const leakZones = zones?.filter((z) => z.status === "leak").length ?? 0;
  const trendPct =
    overview && overview.trend.length >= 2 && overview.trend[0].volume > 0
      ? (
          ((overview.trend[overview.trend.length - 1].volume - overview.trend[0].volume) /
            overview.trend[0].volume) *
          100
        ).toFixed(1)
      : null;

  const stats = [
    {
      label: "Total Pemakaian",
      value: overview ? overview.totalVolume.toLocaleString("id-ID") : "—",
      unit: "m³",
      note: trendPct ? `${trendPct}% vs ${RETENTION_LABEL.toLowerCase()} lalu` : "—",
      icon: <Droplets className="h-5 w-5 text-blue-500" />,
      bg: "bg-blue-50",
    },
    {
      label: "Rata-rata Harian",
      value: overview?.avgDaily ?? "—",
      unit: "m³/hari",
      note: `${RETENTION_LABEL.toLowerCase()} terakhir`,
      icon: <Gauge className="h-5 w-5 text-indigo-500" />,
      bg: "bg-indigo-50",
    },
    {
      label: "Sensor Aktif",
      value: meters ? `${onlineMeters}/${meters.length}` : "—",
      unit: "",
      note: meters ? `Konektivitas ${Math.round((onlineMeters / meters.length) * 100)}%` : "—",
      icon: <Activity className="h-5 w-5 text-emerald-500" />,
      bg: "bg-emerald-50",
    },
    {
      label: "Zona Bermasalah",
      value: zones ? `${leakZones}/${zones.length}` : "—",
      unit: "",
      note: leakZones > 0 ? "Kebocoran terdeteksi" : "Tidak ada kebocoran",
      icon: <ShieldAlert className="h-5 w-5 text-amber-500" />,
      bg: "bg-amber-50",
    },
  ];

  const topMeters = (meters ?? []).slice(0, 5);
  const topCustomers = overview?.topConsumers.slice(0, 5) ?? [];

  const trendOption = {
    grid: { left: "2%", right: "2%", bottom: "3%", top: "10%", containLabel: true },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: (overview?.trend ?? []).map((t) =>
        new Date(t.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })
      ),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { fontFamily: "Inter, sans-serif", fontSize: 12, color: "#94A3B8" },
    },
    yAxis: {
      type: "value",
      axisLabel: { fontFamily: "Inter, sans-serif", fontSize: 12, color: "#94A3B8" },
      splitLine: { lineStyle: { color: "#F1F5F9" } },
    },
    tooltip: { trigger: "axis", textStyle: { fontFamily: "Inter, sans-serif", fontSize: 13 } },
    series: [
      {
        name: "Debit Air (m³)",
        data: (overview?.trend ?? []).map((t) => t.volume),
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

  return (
    <div className="space-y-6 pb-4">
      <PageHeader
        title="Smart Water Meter"
        subtitle="Pemantauan pemakaian & distribusi air bersih secara nasional"
        right={
          <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 text-[12px] font-bold px-2.5 py-1 rounded-full border border-emerald-100 uppercase tracking-wider">
            <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
            {meters ? `${meters.length} Sensor Terdaftar` : "Memuat sensor..."}
          </span>
        }
      />

      {/* 1. Ringkasan */}
      <Section num={1} title="Ringkasan Pemakaian Air">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-white/60 backdrop-blur-md border border-slate-300/80 rounded-2xl p-5 shadow-sm flex items-center gap-4">
              <div className={`h-11 w-11 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>{s.icon}</div>
              <div className="min-w-0">
                <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wide block">{s.label}</span>
                <h4 className="text-xl font-extrabold text-slate-800 leading-none mt-1 flex items-baseline gap-1">
                  {s.value}
                  {s.unit && <span className="text-[13px] font-bold text-slate-400">{s.unit}</span>}
                </h4>
                <span className="text-[12px] font-semibold text-slate-400 block mt-1">{s.note}</span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* 2. Tren & Peringkat */}
      <Section num={2} title="Tren & Peringkat Konsumsi">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Trend chart */}
          <div className="xl:col-span-2 bg-white/60 backdrop-blur-md border border-slate-300/80 rounded-2xl p-5 shadow-sm h-[380px] flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-800 text-sm">Tren Penggunaan {RETENTION_LABEL} Terakhir</h3>
              {trendPct && (
                <span className="flex items-center gap-1 text-[12px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5">
                  <ArrowUpRight className="h-3 w-3" /> {trendPct}%
                </span>
              )}
            </div>
            <div className="flex-1 min-h-0">
              <BaseChart option={trendOption} className="w-full h-full" />
            </div>
          </div>

          {/* Top meters + customers */}
          <div className="flex flex-col gap-4">
            <div className="bg-white/60 backdrop-blur-md border border-slate-300/80 rounded-2xl p-5 shadow-sm flex-1">
              <h3 className="font-bold text-slate-700 text-[13px] tracking-wider uppercase border-b border-slate-100 pb-2 mb-3">
                Top Water Meters (Kumulatif)
              </h3>
              <div className="space-y-2.5">
                {topMeters.map((m, i) => (
                  <div key={m.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-5 w-5 rounded-full bg-brand-red text-white font-extrabold text-[11px] flex items-center justify-center">{i + 1}</span>
                      <span className="text-xs font-bold text-slate-700">{m.name}</span>
                    </div>
                    <span className="text-xs font-extrabold text-slate-900 font-mono">
                      {m.totalVolume.toLocaleString("id-ID")} <span className="text-[11px] text-slate-400 font-sans font-semibold">m³</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white/60 backdrop-blur-md border border-slate-300/80 rounded-2xl p-5 shadow-sm flex-1">
              <h3 className="font-bold text-slate-700 text-[13px] tracking-wider uppercase border-b border-slate-100 pb-2 mb-3 flex items-center gap-1.5">
                <Trophy className="h-3.5 w-3.5 text-amber-500" /> Pelanggan Terbesar ({RETENTION_LABEL})
              </h3>
              <div className="space-y-2">
                {topCustomers.map((c, i) => (
                  <div key={c.id} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`h-5 w-5 rounded-full text-[11px] font-extrabold flex items-center justify-center flex-shrink-0 ${rankStyle(i)}`}>{i + 1}</span>
                      <div className="min-w-0 leading-tight">
                        <span className="text-[13px] font-bold text-slate-700 truncate block">{c.name}</span>
                        <span className="text-[11px] font-semibold text-slate-400">{c.zone}</span>
                      </div>
                    </div>
                    <span className="text-[13px] font-extrabold text-slate-800 font-mono flex-shrink-0">{c.usage} m³</span>
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
            {(zones ?? []).map((z) => {
              const ok = z.status === "normal";
              return (
                <div
                  key={z.id}
                  className={`rounded-2xl p-4 border backdrop-blur-md shadow-sm flex items-start justify-between gap-3 ${
                    ok ? "bg-white/45 border-white/70" : "bg-red-50/70 border-red-200"
                  }`}
                >
                  <div>
                    <span className="text-[13px] font-bold text-slate-700 block">{z.name}</span>
                    <span className={`inline-flex items-center gap-1 text-[12px] font-extrabold mt-2 px-2 py-0.5 rounded-full border ${
                      ok ? "text-emerald-600 bg-emerald-50 border-emerald-100" : "text-brand-red bg-red-50 border-red-200"
                    }`}>
                      {ok ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                      {ok ? "Normal" : "Bocor Terdeteksi"}
                    </span>
                    <span className="text-[12px] font-semibold text-slate-500 block mt-1.5 font-mono">Tekanan: {z.pressureBar} Bar</span>
                  </div>
                  <Droplets className={`h-8 w-8 flex-shrink-0 ${ok ? "text-blue-200" : "text-red-300"}`} />
                </div>
              );
            })}
          </div>
          <TotalWaterWidget />
        </div>
      </Section>
    </div>
  );
}

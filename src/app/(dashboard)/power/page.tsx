"use client";

import React from "react";
import Section from "@/components/layout/section";
import PageHeader from "@/components/layout/page-header";
import BaseChart from "@/components/charts/base-chart";
import TotalEnergyWidget from "@/components/widgets/total-energy-widget";
import { usePowerOverview, usePowerQuality, usePowerMeters } from "@/hooks/use-power";
import { Zap, Clock, Award, TrendingDown, PlugZap, Gauge, Waves, Percent } from "lucide-react";

const sectorColor: Record<string, string> = {
  industri: "#DC2626",
  komersial: "#475569",
  residensial: "#F59E0B",
};

export default function PowerPage() {
  const { data: overview } = usePowerOverview();
  const { data: quality } = usePowerQuality();
  const { data: meters } = usePowerMeters();

  const stats = [
    {
      label: "Total Energi",
      value: overview ? overview.totalEnergy.toLocaleString("id-ID") : "—",
      unit: "MWh",
      note: "5 substasiun aktif",
      icon: <Zap className="h-5 w-5 text-amber-500" />,
      bg: "bg-amber-50",
    },
    {
      label: "Beban Puncak",
      value: overview ? overview.peakLoadKw.toLocaleString("id-ID") : "—",
      unit: "kW",
      note: overview ? `Pukul ${overview.peakLoadAt} WIB` : "—",
      icon: <Clock className="h-5 w-5 text-orange-500" />,
      bg: "bg-orange-50",
    },
    {
      label: "Faktor Daya",
      value: overview?.avgPowerFactor ?? "—",
      unit: "",
      note: overview && overview.avgPowerFactor >= 0.95 ? "Optimal (> 0,95)" : "Perlu perbaikan",
      icon: <Award className="h-5 w-5 text-emerald-500" />,
      bg: "bg-emerald-50",
    },
    {
      label: "Susut Energi",
      value: overview?.avgLossPct ?? "—",
      unit: "%",
      note: overview && overview.avgLossPct < 2 ? "Di bawah ambang 2%" : "Di atas ambang 2%",
      icon: <TrendingDown className="h-5 w-5 text-brand-red" />,
      bg: "bg-red-50",
    },
  ];

  const qualityTiles = quality
    ? [
        { label: "Tegangan", value: quality.voltage.toFixed(1).replace(".", ","), unit: "V", pct: Math.min(100, Math.round((quality.voltage / 240) * 100)), icon: <PlugZap className="h-4 w-4" /> },
        { label: "Arus", value: quality.current.toFixed(1).replace(".", ","), unit: "A", pct: Math.min(100, Math.round((quality.current / 70) * 100)), icon: <Gauge className="h-4 w-4" /> },
        { label: "Frekuensi", value: quality.frequency.toFixed(1).replace(".", ","), unit: "Hz", pct: 100, icon: <Waves className="h-4 w-4" /> },
        { label: "Power Factor", value: quality.powerFactor.toFixed(2).replace(".", ","), unit: "", pct: Math.round(quality.powerFactor * 100), icon: <Percent className="h-4 w-4" /> },
      ]
    : [];

  const loadOption = {
    grid: { left: "2%", right: "2%", bottom: "3%", top: "12%", containLabel: true },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: (overview?.loadCurve ?? []).map((c) => c.hour),
      axisLabel: { fontFamily: "Inter, sans-serif", fontSize: 12, color: "#94A3B8" },
      axisLine: { lineStyle: { color: "#E2E8F0" } },
    },
    yAxis: {
      type: "value",
      axisLabel: { fontFamily: "Inter, sans-serif", fontSize: 12, color: "#94A3B8" },
      splitLine: { lineStyle: { color: "#F1F5F9" } },
    },
    tooltip: { trigger: "axis", textStyle: { fontFamily: "Inter, sans-serif", fontSize: 13 } },
    series: [
      {
        name: "Beban Hari Ini",
        data: (overview?.loadCurve ?? []).map((c) => c.powerKw),
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
    ],
  };

  const sectors = overview?.sectors ?? [];
  const donutOption = {
    tooltip: { trigger: "item", formatter: "{b}: {c} MWh ({d}%)", textStyle: { fontFamily: "Inter, sans-serif", fontSize: 13 } },
    color: sectors.map((s) => sectorColor[s.sector] ?? "#94A3B8"),
    series: [
      {
        type: "pie",
        radius: ["58%", "82%"],
        center: ["50%", "50%"],
        label: { show: false },
        labelLine: { show: false },
        data: sectors.map((s) => ({ value: s.energy, name: s.sector })),
      },
    ],
  };

  return (
    <div className="space-y-6 pb-4">
      <PageHeader
        title="Energy Monitoring"
        subtitle="Pemantauan konsumsi listrik, profil beban & kualitas daya nasional"
        right={
          <span className="flex items-center gap-1.5 bg-amber-50 text-amber-600 text-[12px] font-bold px-2.5 py-1 rounded-full border border-amber-100 uppercase tracking-wider">
            <Zap className="h-3 w-3" /> {meters ? `${meters.length} Power Meter Aktif` : "Memuat..."}
          </span>
        }
      />

      {/* 1. Ringkasan */}
      <Section num={1} title="Ringkasan Energi">
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

      {/* 2. Profil Beban & Sektor */}
      <Section num={2} title="Profil Beban Harian & Distribusi Sektor">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 bg-white/60 backdrop-blur-md border border-slate-300/80 rounded-2xl p-5 shadow-sm h-[380px] flex flex-col">
            <h3 className="font-bold text-slate-800 text-sm mb-2">Kurva Beban 24 Jam</h3>
            <div className="flex-1 min-h-0">
              <BaseChart option={loadOption} className="w-full h-full" />
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-md border border-slate-300/80 rounded-2xl p-5 shadow-sm h-[380px] flex flex-col">
            <h3 className="font-bold text-slate-700 text-[13px] tracking-wider uppercase border-b border-slate-100 pb-2">
              Energi per Sektor
            </h3>
            <div className="relative h-[170px] mt-2">
              <BaseChart option={donutOption} className="w-full h-full" />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center leading-none">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Total</span>
                <span className="text-base font-extrabold text-slate-800 font-mono mt-1">
                  {overview?.totalEnergy.toLocaleString("id-ID") ?? "—"}
                </span>
                <span className="text-[11px] font-bold text-slate-500 mt-0.5">MWh</span>
              </div>
            </div>
            <div className="flex-1 flex flex-col justify-center gap-3 mt-2">
              {sectors.map((s) => (
                <div key={s.sector} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: sectorColor[s.sector] ?? "#94A3B8" }} />
                      <span className="text-[13px] font-bold text-slate-700 capitalize">Sektor {s.sector}</span>
                    </div>
                    <span className="text-[13px] font-extrabold text-slate-800 font-mono">{s.pct}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${s.pct}%`, backgroundColor: sectorColor[s.sector] ?? "#94A3B8" }} />
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
            {qualityTiles.map((q) => (
              <div key={q.label} className="bg-white/60 backdrop-blur-md border border-slate-300/80 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">{q.icon}</span>
                    <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wide">{q.label}</span>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5">Normal</span>
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

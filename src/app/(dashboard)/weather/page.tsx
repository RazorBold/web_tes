"use client";

import { RETENTION_LABEL } from "@/config/retention";
import React from "react";
import Section from "@/components/layout/section";
import PageHeader from "@/components/layout/page-header";
import BaseChart from "@/components/charts/base-chart";
import WeatherWidget from "@/components/widgets/weather-widget";
import { useWeatherOverview } from "@/hooks/use-weather";
import { Radio, Thermometer, CloudRain, Wind } from "lucide-react";

export default function WeatherPage() {
  const { data: overview } = useWeatherOverview();

  const tiles = [
    { label: "Suhu Rata-rata", value: overview?.avgTemp ?? "—", unit: "°C", icon: <Thermometer className="h-5 w-5 text-brand-red" />, bg: "bg-red-50" },
    { label: "Suhu Maksimum", value: overview?.maxTemp ?? "—", unit: "°C", icon: <Thermometer className="h-5 w-5 text-amber-500" />, bg: "bg-amber-50" },
    { label: "Curah Hujan (24 Jam)", value: overview?.dailyRainfall ?? "—", unit: "mm", icon: <CloudRain className="h-5 w-5 text-blue-500" />, bg: "bg-blue-50" },
    { label: "Kecepatan Angin", value: overview?.avgWindSpeed ?? "—", unit: "km/h", icon: <Wind className="h-5 w-5 text-emerald-500" />, bg: "bg-emerald-50" },
  ];

  const trendOption = {
    grid: { left: "2%", right: "2%", bottom: "3%", top: "16%", containLabel: true },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: (overview?.hourlyTemp ?? []).map((t) => t.time),
      axisLabel: { fontFamily: "Inter, sans-serif", fontSize: 12, color: "#94A3B8" },
      axisLine: { lineStyle: { color: "#E2E8F0" } },
    },
    yAxis: {
      type: "value",
      name: "°C",
      axisLabel: { fontFamily: "Inter, sans-serif", fontSize: 12, color: "#94A3B8" },
      splitLine: { lineStyle: { color: "#F1F5F9" } },
    },
    tooltip: { trigger: "axis", textStyle: { fontFamily: "Inter, sans-serif", fontSize: 13 } },
    series: [
      {
        name: "Suhu (°C)",
        data: (overview?.hourlyTemp ?? []).map((t) => t.temperature),
        type: "line",
        smooth: true,
        symbol: "circle",
        symbolSize: 6,
        itemStyle: { color: "#DC2626" },
        lineStyle: { color: "#DC2626", width: 3 },
        areaStyle: {
          color: {
            type: "linear", x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(220,38,38,0.14)" },
              { offset: 1, color: "rgba(220,38,38,0)" },
            ],
          },
        },
      },
    ],
  };

  const rainOption = {
    grid: { left: "2%", right: "2%", bottom: "3%", top: "12%", containLabel: true },
    xAxis: {
      type: "category",
      data: (overview?.dailyRainfall7d ?? []).map((d) =>
        new Date(d.date).toLocaleDateString("id-ID", { weekday: "short" })
      ),
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
        name: "Curah Hujan (mm)",
        data: (overview?.dailyRainfall7d ?? []).map((d) => d.rainfall),
        type: "bar",
        barWidth: 18,
        itemStyle: {
          color: {
            type: "linear", x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: "#3B82F6" },
              { offset: 1, color: "rgba(59,130,246,0.3)" },
            ],
          },
          borderRadius: [4, 4, 0, 0],
        },
      },
    ],
  };

  return (
    <div className="space-y-6 pb-4">
      <PageHeader
        title="Weather Station"
        subtitle="Pemantauan cuaca berbasis sensor IoT: suhu, curah hujan & arah angin"
        right={
          <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 text-[12px] font-bold px-2.5 py-1 rounded-full border border-emerald-100 uppercase tracking-wider">
            <Radio className="h-3 w-3" /> {overview?.station.name ?? "Memuat..."}
          </span>
        }
      />

      {/* 1. Kondisi Saat Ini */}
      <Section num={1} title="Kondisi Cuaca Saat Ini">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <WeatherWidget />
          <div className="xl:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tiles.map((t) => (
              <div key={t.label} className="bg-white/60 backdrop-blur-md border border-slate-300/80 rounded-2xl p-5 shadow-sm flex items-center gap-4">
                <div className={`h-12 w-12 rounded-xl ${t.bg} flex items-center justify-center flex-shrink-0`}>{t.icon}</div>
                <div>
                  <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wide block">{t.label}</span>
                  <h4 className="text-2xl font-extrabold text-slate-800 leading-none mt-1.5 flex items-baseline gap-1">
                    {t.value}
                    <span className="text-xs font-bold text-slate-400">{t.unit}</span>
                  </h4>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* 2. Tren */}
      <Section num={2} title="Tren Suhu & Curah Hujan">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="bg-white/60 backdrop-blur-md border border-slate-300/80 rounded-2xl p-5 shadow-sm h-[340px] flex flex-col">
            <h3 className="font-bold text-slate-800 text-sm mb-2">Suhu 24 Jam Terakhir</h3>
            <div className="flex-1 min-h-0">
              <BaseChart option={trendOption} className="w-full h-full" />
            </div>
          </div>
          <div className="bg-white/60 backdrop-blur-md border border-slate-300/80 rounded-2xl p-5 shadow-sm h-[340px] flex flex-col">
            <h3 className="font-bold text-slate-800 text-sm mb-2">Curah Hujan {RETENTION_LABEL} (mm)</h3>
            <div className="flex-1 min-h-0">
              <BaseChart option={rainOption} className="w-full h-full" />
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}

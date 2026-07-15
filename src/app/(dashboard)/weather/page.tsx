"use client";

import React from "react";
import Section from "@/components/layout/section";
import PageHeader from "@/components/layout/page-header";
import BaseChart from "@/components/charts/base-chart";
import WeatherWidget from "@/components/widgets/weather-widget";
import { CloudSun, Gauge, Eye, Sun, Thermometer } from "lucide-react";

const tiles = [
  { label: "Tekanan Udara", value: "1.012", unit: "hPa", icon: <Gauge className="h-5 w-5 text-blue-500" />, bg: "bg-blue-50" },
  { label: "Jarak Pandang", value: "8", unit: "km", icon: <Eye className="h-5 w-5 text-indigo-500" />, bg: "bg-indigo-50" },
  { label: "Indeks UV", value: "6", unit: "Sedang", icon: <Sun className="h-5 w-5 text-amber-500" />, bg: "bg-amber-50" },
  { label: "Titik Embun", value: "24", unit: "°C", icon: <Thermometer className="h-5 w-5 text-emerald-500" />, bg: "bg-emerald-50" },
];

const trendOption = {
  grid: { left: "2%", right: "2%", bottom: "3%", top: "16%", containLabel: true },
  xAxis: {
    type: "category",
    boundaryGap: false,
    data: ["00:00", "03:00", "06:00", "09:00", "12:00", "15:00", "18:00", "21:00"],
    axisLabel: { fontFamily: "Inter, sans-serif", fontSize: 10, color: "#94A3B8" },
    axisLine: { lineStyle: { color: "#E2E8F0" } },
  },
  yAxis: [
    {
      type: "value",
      name: "°C",
      axisLabel: { fontFamily: "Inter, sans-serif", fontSize: 10, color: "#94A3B8" },
      splitLine: { lineStyle: { color: "#F1F5F9" } },
    },
    {
      type: "value",
      name: "%",
      axisLabel: { fontFamily: "Inter, sans-serif", fontSize: 10, color: "#94A3B8" },
      splitLine: { show: false },
    },
  ],
  tooltip: { trigger: "axis", textStyle: { fontFamily: "Inter, sans-serif", fontSize: 11 } },
  legend: {
    data: ["Suhu (°C)", "Kelembapan (%)"],
    top: 0,
    textStyle: { fontFamily: "Inter, sans-serif", fontSize: 10, color: "#64748B" },
  },
  series: [
    {
      name: "Suhu (°C)",
      data: [25, 24.5, 25, 27, 29, 29.5, 27.5, 26],
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
    {
      name: "Kelembapan (%)",
      yAxisIndex: 1,
      data: [88, 90, 92, 84, 76, 73, 80, 86],
      type: "line",
      smooth: true,
      symbol: "none",
      lineStyle: { color: "#3B82F6", width: 2, type: "dashed" },
    },
  ],
};

const rainOption = {
  grid: { left: "2%", right: "2%", bottom: "3%", top: "12%", containLabel: true },
  xAxis: {
    type: "category",
    data: ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"],
    axisLabel: { fontFamily: "Inter, sans-serif", fontSize: 10, color: "#94A3B8" },
    axisLine: { lineStyle: { color: "#E2E8F0" } },
  },
  yAxis: {
    type: "value",
    axisLabel: { fontFamily: "Inter, sans-serif", fontSize: 10, color: "#94A3B8" },
    splitLine: { lineStyle: { color: "#F1F5F9" } },
  },
  tooltip: { trigger: "axis", textStyle: { fontFamily: "Inter, sans-serif", fontSize: 11 } },
  series: [
    {
      name: "Curah Hujan (mm)",
      data: [12, 28, 6, 44, 18, 3, 22],
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

export default function WeatherPage() {
  return (
    <div className="space-y-6 pb-4">
      <PageHeader
        title="Weather Station"
        subtitle="Pemantauan cuaca terintegrasi BMKG untuk wilayah operasional"
        right={
          <span className="flex items-center gap-1.5 bg-blue-50 text-blue-600 text-[10px] font-bold px-2.5 py-1 rounded-full border border-blue-100 uppercase tracking-wider">
            <CloudSun className="h-3 w-3" /> Sumber: BMKG
          </span>
        }
      />

      {/* 1. Kondisi Saat Ini */}
      <Section num={1} title="Kondisi Cuaca Saat Ini">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <WeatherWidget />
          <div className="xl:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tiles.map((t) => (
              <div key={t.label} className="bg-white/45 backdrop-blur-md border border-white/70 rounded-2xl p-5 shadow-sm flex items-center gap-4">
                <div className={`h-12 w-12 rounded-xl ${t.bg} flex items-center justify-center flex-shrink-0`}>{t.icon}</div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">{t.label}</span>
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
      <Section num={2} title="Tren Suhu, Kelembapan & Curah Hujan">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="bg-white/45 backdrop-blur-md border border-white/70 rounded-2xl p-5 shadow-sm h-[340px] flex flex-col">
            <h3 className="font-bold text-slate-800 text-sm mb-2">Suhu & Kelembapan 24 Jam</h3>
            <div className="flex-1 min-h-0">
              <BaseChart option={trendOption} className="w-full h-full" />
            </div>
          </div>
          <div className="bg-white/45 backdrop-blur-md border border-white/70 rounded-2xl p-5 shadow-sm h-[340px] flex flex-col">
            <h3 className="font-bold text-slate-800 text-sm mb-2">Curah Hujan 7 Hari (mm)</h3>
            <div className="flex-1 min-h-0">
              <BaseChart option={rainOption} className="w-full h-full" />
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}

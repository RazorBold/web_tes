"use client";

import React from "react";
import Section from "@/components/layout/section";
import PageHeader from "@/components/layout/page-header";
import BaseChart from "@/components/charts/base-chart";
import KpiStats from "@/components/widgets/kpi-stats";
import CctvAnalyticsTabs from "@/components/widgets/cctv-analytics-tabs";
import { BarChart3 } from "lucide-react";

const compareOption = {
  grid: { left: "2%", right: "2%", bottom: "3%", top: "16%", containLabel: true },
  xAxis: {
    type: "category",
    data: ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"],
    axisLabel: { fontFamily: "Inter, sans-serif", fontSize: 10, color: "#94A3B8" },
    axisLine: { lineStyle: { color: "#E2E8F0" } },
  },
  yAxis: [
    {
      type: "value",
      name: "m³",
      axisLabel: { fontFamily: "Inter, sans-serif", fontSize: 10, color: "#94A3B8" },
      splitLine: { lineStyle: { color: "#F1F5F9" } },
    },
    {
      type: "value",
      name: "MWh",
      axisLabel: { fontFamily: "Inter, sans-serif", fontSize: 10, color: "#94A3B8" },
      splitLine: { show: false },
    },
  ],
  tooltip: { trigger: "axis", textStyle: { fontFamily: "Inter, sans-serif", fontSize: 11 } },
  legend: {
    data: ["Air (m³)", "Energi (MWh)"],
    top: 0,
    textStyle: { fontFamily: "Inter, sans-serif", fontSize: 10, color: "#64748B" },
  },
  series: [
    {
      name: "Air (m³)",
      data: [280, 310, 290, 340, 380, 410, 430],
      type: "bar",
      barWidth: 14,
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
    {
      name: "Energi (MWh)",
      yAxisIndex: 1,
      data: [820, 930, 901, 934, 1290, 1330, 1320],
      type: "line",
      smooth: true,
      symbol: "circle",
      symbolSize: 6,
      itemStyle: { color: "#F59E0B" },
      lineStyle: { color: "#F59E0B", width: 3 },
    },
  ],
};

const alertDistOption = {
  tooltip: { trigger: "item", formatter: "{b}: {c} lansiran ({d}%)", textStyle: { fontFamily: "Inter, sans-serif", fontSize: 11 } },
  color: ["#DC2626", "#3B82F6", "#F59E0B", "#475569", "#10B981"],
  legend: {
    orient: "vertical",
    right: 6,
    top: "center",
    itemWidth: 10,
    itemHeight: 10,
    textStyle: { fontFamily: "Inter, sans-serif", fontSize: 10, color: "#64748B" },
  },
  series: [
    {
      type: "pie",
      radius: ["52%", "78%"],
      center: ["38%", "50%"],
      label: { show: false },
      labelLine: { show: false },
      data: [
        { value: 4, name: "CCTV & AI" },
        { value: 2, name: "Water" },
        { value: 2, name: "Power" },
        { value: 1, name: "Fleet" },
        { value: 1, name: "TempHum" },
      ],
    },
  ],
};

export default function AnalyticsPage() {
  return (
    <div className="space-y-6 pb-4">
      <PageHeader
        title="Analytics"
        subtitle="Analitik lintas modul: konsumsi, tren & distribusi lansiran nasional"
        right={
          <span className="flex items-center gap-1.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold px-2.5 py-1 rounded-full border border-indigo-100 uppercase tracking-wider">
            <BarChart3 className="h-3 w-3" /> Data 7 Hari Terakhir
          </span>
        }
      />

      {/* 1. KPI Nasional (klik kartu untuk detail) */}
      <Section num={1} title="Ringkasan KPI Nasional">
        <KpiStats />
      </Section>

      {/* 2. Perbandingan Konsumsi */}
      <Section num={2} title="Perbandingan Konsumsi Air vs Energi">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 bg-white/45 backdrop-blur-md border border-white/70 rounded-2xl p-5 shadow-sm h-[360px] flex flex-col">
            <h3 className="font-bold text-slate-800 text-sm mb-2">Konsumsi Mingguan (Dual-Axis)</h3>
            <div className="flex-1 min-h-0">
              <BaseChart option={compareOption} className="w-full h-full" />
            </div>
          </div>
          <div className="bg-white/45 backdrop-blur-md border border-white/70 rounded-2xl p-5 shadow-sm h-[360px] flex flex-col">
            <h3 className="font-bold text-slate-800 text-sm mb-2">Distribusi Lansiran per Modul</h3>
            <div className="flex-1 min-h-0">
              <BaseChart option={alertDistOption} className="w-full h-full" />
            </div>
            <p className="text-[10px] font-semibold text-slate-400 pt-2 border-t border-slate-100">
              Total 10 lansiran aktif · CCTV &amp; AI penyumbang terbanyak.
            </p>
          </div>
        </div>
      </Section>

      {/* 3. Analitik CCTV */}
      <Section num={3} title="Analitik CCTV & AI">
        <CctvAnalyticsTabs />
      </Section>
    </div>
  );
}

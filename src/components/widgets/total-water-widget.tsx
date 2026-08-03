"use client";

import React from "react";
import BaseChart from "@/components/charts/base-chart";
import { Droplets, ArrowUpRight, BarChart2, Activity } from "lucide-react";
import { useWaterOverview, useWaterZones, useWaterMeters } from "@/hooks/use-water";

const dayLabel = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("id-ID", { weekday: "short" });

export default function TotalWaterWidget() {
  const { data: overview } = useWaterOverview();
  const { data: zones } = useWaterZones();
  const { data: meters } = useWaterMeters();

  const last7 = overview?.trend.slice(-7) ?? [];
  const trendPct =
    last7.length >= 2 && last7[0].volume > 0
      ? (((last7[last7.length - 1].volume - last7[0].volume) / last7[0].volume) * 100).toFixed(1)
      : "0.0";

  const avgPressure = zones?.length
    ? (zones.reduce((s, z) => s + z.pressureBar, 0) / zones.length).toFixed(1)
    : "—";
  const leakPct = zones?.length
    ? ((zones.filter((z) => z.status === "leak").length / zones.length) * 100).toFixed(1)
    : "—";
  const onlineMeters = meters?.filter((m) => m.status === "online").length ?? 0;

  const projectDetails = [
    { name: "Tekanan Aliran Rata-rata", val: `${avgPressure} Bar` },
    { name: "Kebocoran Jaringan", val: `${leakPct}%` },
    { name: "Meter Online", val: `${onlineMeters}/${meters?.length ?? 0}` },
  ];

  const chartOption = {
    grid: { left: "3%", right: "3%", bottom: "3%", top: "12%", containLabel: true },
    xAxis: {
      type: "category",
      data: last7.map((t) => dayLabel(t.date)),
      axisLabel: { fontFamily: "Inter, sans-serif", fontSize: 11, color: "#94A3B8" },
      axisLine: { lineStyle: { color: "#E2E8F0" } },
    },
    yAxis: {
      type: "value",
      axisLabel: { fontFamily: "Inter, sans-serif", fontSize: 11, color: "#94A3B8" },
      splitLine: { lineStyle: { color: "#F1F5F9" } },
    },
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(255, 255, 255, 0.95)",
      borderColor: "#E2E8F0",
      borderWidth: 1,
      textStyle: { color: "#1E293B", fontSize: 13 },
    },
    series: [
      {
        name: "Pemakaian Air",
        data: last7.map((t) => t.volume),
        type: "bar",
        barWidth: 16,
        itemStyle: {
          color: {
            type: "linear",
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: "#3B82F6" }, // blue
              { offset: 1, color: "rgba(59, 130, 246, 0.3)" },
            ],
          },
          borderRadius: [4, 4, 0, 0],
        },
      },
    ],
  };

  return (
    <div className="bg-white/60 backdrop-blur-md border border-slate-300/80 rounded-2xl p-5 shadow-sm flex flex-col h-[420px]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200/70 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100/50">
            <Droplets className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base leading-none">Total Penggunaan Air</h3>
            <p className="text-[12px] text-slate-400 font-semibold mt-1">Pemakaian debit air kubikasi harian</p>
          </div>
        </div>
        <span className="flex items-center gap-0.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded px-1.5 py-0.5">
          <ArrowUpRight className="h-3 w-3" />
          {trendPct}%
        </span>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3 flex items-center gap-2.5">
          <BarChart2 className="h-4 w-4 text-blue-500" />
          <div className="leading-tight">
            <span className="text-[11px] font-bold text-slate-400 block uppercase">Pemakaian Rata-rata</span>
            <span className="text-xs font-extrabold text-slate-700">{overview?.avgDaily ?? "—"} m³ / hari</span>
          </div>
        </div>
        <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3 flex items-center gap-2.5">
          <Activity className="h-4 w-4 text-emerald-500" />
          <div className="leading-tight">
            <span className="text-[11px] font-bold text-slate-400 block uppercase">Sensor Aliran</span>
            <span className="text-xs font-extrabold text-slate-700">
              Aktif ({meters?.length ? Math.round((onlineMeters / meters.length) * 100) : 0}%)
            </span>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="flex-1 min-h-0 mt-3 relative">
        <BaseChart option={chartOption} />
      </div>

      {/* Categories table */}
      <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-1.5">
        {projectDetails.map((item, i) => (
          <div key={i} className="flex justify-between items-center text-[12px]">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              <span className="font-bold text-slate-600 truncate max-w-[130px]">{item.name}</span>
            </div>
            <span className="font-mono font-bold text-slate-700">{item.val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

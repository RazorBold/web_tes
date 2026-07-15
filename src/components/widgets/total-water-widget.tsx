"use client";

import React from "react";
import BaseChart from "@/components/charts/base-chart";
import { Droplets, ArrowUpRight, BarChart2, Activity } from "lucide-react";

export default function TotalWaterWidget() {
  const chartOption = {
    grid: { left: "3%", right: "3%", bottom: "3%", top: "12%", containLabel: true },
    xAxis: {
      type: "category",
      data: ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"],
      axisLabel: { fontFamily: "Inter, sans-serif", fontSize: 9, color: "#94A3B8" },
      axisLine: { lineStyle: { color: "#E2E8F0" } },
    },
    yAxis: {
      type: "value",
      axisLabel: { fontFamily: "Inter, sans-serif", fontSize: 9, color: "#94A3B8" },
      splitLine: { lineStyle: { color: "#F1F5F9" } },
    },
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(255, 255, 255, 0.95)",
      borderColor: "#E2E8F0",
      borderWidth: 1,
      textStyle: { color: "#1E293B", fontSize: 11 },
    },
    series: [
      {
        name: "Pemakaian Air",
        data: [280, 310, 290, 340, 380, 410, 430],
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

  const projectDetails = [
    { name: "Proyek Green Nusantara", role: "Water Demand", val: "2,355 m³" },
    { name: "Tekanan Aliran", role: "Flow Pressure", val: "3.2 Bar" },
    { name: "Kebocoran Jaringan", role: "Leak Detection", val: "0.2% (Min)" },
  ];

  return (
    <div className="bg-white/45 backdrop-blur-md border border-white/70 rounded-2xl p-5 shadow-sm flex flex-col h-[420px]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200/70 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100/50">
            <Droplets className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base leading-none">Total Penggunaan Air</h3>
            <p className="text-[10px] text-slate-400 font-semibold mt-1">Pemakaian debit air kubikasi harian</p>
          </div>
        </div>
        <span className="flex items-center gap-0.5 text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded px-1.5 py-0.5">
          <ArrowUpRight className="h-3 w-3" />
          +6.2%
        </span>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3 flex items-center gap-2.5">
          <BarChart2 className="h-4 w-4 text-blue-500" />
          <div className="leading-tight">
            <span className="text-[8.5px] font-bold text-slate-400 block uppercase">Pemakaian Rata-rata</span>
            <span className="text-xs font-extrabold text-slate-700">335 m³ / hari</span>
          </div>
        </div>
        <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3 flex items-center gap-2.5">
          <Activity className="h-4 w-4 text-emerald-500" />
          <div className="leading-tight">
            <span className="text-[8.5px] font-bold text-slate-400 block uppercase">Sensor Aliran</span>
            <span className="text-xs font-extrabold text-slate-700">Aktif (100%)</span>
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
          <div key={i} className="flex justify-between items-center text-[10.5px]">
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

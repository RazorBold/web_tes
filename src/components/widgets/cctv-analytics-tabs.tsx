"use client";

import React, { useState } from "react";
import BaseChart from "@/components/charts/base-chart";
import { ArrowUpRight, ArrowDownRight, Video } from "lucide-react";

interface TabData {
  today: number;
  avgPerHour: number;
  trend: string;
  trendUp: boolean;
  chartData: number[];
  chartColor: string;
  listTitle: string;
  listItems: { name: string; count: number }[];
}

const tabDataMap: Record<string, TabData> = {
  "People Counting": {
    today: 12458,
    avgPerHour: 519,
    trend: "12,5%",
    trendUp: true,
    chartData: [420, 680, 1120, 1240, 1180, 920, 480],
    chartColor: "#DC2626", // brand-red
    listTitle: "Area Terbanyak",
    listItems: [
      { name: "Lobby", count: 3245 },
      { name: "Main Gate", count: 2876 },
      { name: "Koridor", count: 2120 },
      { name: "Parkir Area", count: 1987 },
      { name: "Lantai Kantor", count: 1245 },
    ],
  },
  "People Surveillance": {
    today: 36,
    avgPerHour: 1.5,
    trend: "-18,2%",
    trendUp: false,
    chartData: [3, 6, 8, 12, 4, 2, 1],
    chartColor: "#F59E0B", // amber
    listTitle: "Daftar Lansiran",
    listItems: [
      { name: "Kerumunan", count: 12 },
      { name: "Akses Terlarang", count: 9 },
      { name: "Waktu Diam Lama", count: 6 },
      { name: "Penyusupan", count: 5 },
      { name: "Pelanggaran APD", count: 4 },
    ],
  },
};

const mockHourlyLabels = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"];
const tabs = ["People Counting", "People Surveillance"];
const fmt = (n: number) => n.toLocaleString("en-US");

export default function CctvAnalyticsTabs() {
  const [activeTab, setActiveTab] = useState("People Counting");
  const data = tabDataMap[activeTab];

  const option = {
    grid: { left: "3%", right: "4%", bottom: "3%", top: "12%", containLabel: true },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: mockHourlyLabels,
      axisLabel: { fontFamily: "Inter, sans-serif", fontSize: 9, color: "#94A3B8" },
      axisLine: { lineStyle: { color: "#E2E8F0" } },
    },
    yAxis: {
      type: "value",
      axisLabel: { fontFamily: "Inter, sans-serif", fontSize: 9, color: "#94A3B8" },
      splitLine: { lineStyle: { color: "#F1F5F9" } },
    },
    tooltip: { trigger: "axis", textStyle: { fontFamily: "Inter, sans-serif", fontSize: 11 } },
    series: [
      {
        data: data.chartData,
        type: "line",
        smooth: true,
        symbol: "circle",
        symbolSize: 6,
        itemStyle: { color: data.chartColor },
        lineStyle: { color: data.chartColor, width: 3 },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: `${data.chartColor}33` },
              { offset: 1, color: `${data.chartColor}01` },
            ],
          },
        },
      },
    ],
  };

  return (
    <div className="bg-white/45 backdrop-blur-md border border-white/70 rounded-2xl p-5 shadow-sm flex flex-col gap-4 h-[420px]">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="h-9 w-9 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
          <Video className="h-5 w-5 text-brand-red" />
        </div>
        <h3 className="font-bold text-slate-800 text-base">Analitik CCTV &amp; AI</h3>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-100">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-2 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === tab
                ? "bg-white text-brand-red shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Stats + chart + areas */}
      <div className="flex-1 flex gap-4 overflow-hidden min-h-0">
        {/* Left: number + chart */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-baseline gap-2">
                <h4 className="text-2xl font-extrabold text-slate-800 tracking-tight font-mono">
                  {fmt(data.today)}
                </h4>
                {data.trendUp ? (
                  <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded px-1 py-0.5 flex items-center gap-0.5">
                    <ArrowUpRight className="h-3 w-3" />
                    {data.trend}
                  </span>
                ) : (
                  <span className="text-[9px] font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded px-1 py-0.5 flex items-center gap-0.5">
                    <ArrowDownRight className="h-3 w-3" />
                    {data.trend}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-semibold text-slate-400">Hari ini</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-extrabold text-slate-700 font-mono block">
                {data.avgPerHour}
              </span>
              <span className="text-[10px] font-semibold text-slate-400">Rata-rata / jam</span>
            </div>
          </div>
          <div className="flex-1 min-h-0 mt-1">
            <BaseChart option={option} className="w-full h-full" />
          </div>
        </div>

        {/* Right: top areas */}
        <div className="w-40 border-l border-slate-100 pl-4 flex flex-col flex-shrink-0">
          <h4 className="font-bold text-slate-700 text-[10px] tracking-wider uppercase pb-2 mb-1 border-b border-slate-100 truncate">
            {data.listTitle}
          </h4>
          <div className="space-y-3 mt-2 overflow-y-auto scrollbar-thin pr-0.5">
            {data.listItems.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold text-slate-600 truncate max-w-[70%]">
                    {idx + 1}. {item.name}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 font-mono flex-shrink-0">
                    {fmt(item.count)}
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(item.count / data.listItems[0].count) * 100}%`,
                      backgroundColor: data.chartColor,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


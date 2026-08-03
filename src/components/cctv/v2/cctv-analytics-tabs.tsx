"use client";

import React, { useState } from "react";
import BaseChart from "@/components/charts/base-chart";
import {
  ArrowUpRight,
  ArrowDownRight,
  Video,
  Mars,
  Venus,
  Smile,
  Meh,
  Frown,
  Angry,
  type LucideIcon,
} from "lucide-react";

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
    chartColor: "#10B981", // emerald
    listTitle: "Area Terbanyak",
    listItems: [
      { name: "Lobby", count: 3245 },
      { name: "Main Gate", count: 2876 },
      { name: "Koridor", count: 2120 },
      { name: "Parkir Area", count: 1987 },
      { name: "Lantai Kantor", count: 1245 },
    ],
  },
  "Deteksi Kerumunan": {
    today: 36,
    avgPerHour: 1.5,
    trend: "-18,2%",
    trendUp: false,
    chartData: [3, 6, 8, 12, 4, 2, 1],
    chartColor: "#DC2626", // brand-red
    listTitle: "Daftar Lansiran",
    listItems: [
      { name: "Kerumunan", count: 12 },
      { name: "Akses Terlarang", count: 9 },
      { name: "Waktu Diam Lama", count: 6 },
      { name: "Penyusupan", count: 5 },
      { name: "Pelanggaran APD", count: 4 },
    ],
  },
  "Heatmap Zona": {
    today: 3180,
    avgPerHour: 132,
    trend: "8,7%",
    trendUp: true,
    chartData: [30, 55, 80, 95, 100, 70, 40],
    chartColor: "#F97316", // orange
    listTitle: "Zona Terpanas",
    listItems: [
      { name: "Pintu Masuk", count: 2840 },
      { name: "Lobby Tengah", count: 2210 },
      { name: "Area Kasir", count: 1560 },
      { name: "Koridor Timur", count: 980 },
    ],
  },
};

/** Gender & Mood digabung jadi 1 kartu — output berupa angka & proporsi, bukan grafik. */
const GENDER_MOOD_TAB = "Gender & Mood";

interface Segment {
  name: string;
  count: number;
  color: string;
  Icon: LucideIcon;
}

const genderMood: {
  today: number;
  avgPerHour: number;
  trend: string;
  trendUp: boolean;
  gender: Segment[];
  moods: Segment[];
} = {
  today: 8412,
  avgPerHour: 350,
  trend: "4,1%",
  trendUp: true,
  gender: [
    { name: "Pria", count: 5127, color: "#3B82F6", Icon: Mars },
    { name: "Wanita", count: 3285, color: "#EC4899", Icon: Venus },
  ],
  moods: [
    { name: "Senang", count: 4630, color: "#10B981", Icon: Smile },
    { name: "Netral", count: 2740, color: "#64748B", Icon: Meh },
    { name: "Sedih", count: 700, color: "#3B82F6", Icon: Frown },
    { name: "Marah", count: 342, color: "#DC2626", Icon: Angry },
  ],
};

const mockHourlyLabels = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00"];
const tabs = ["People Counting", "Deteksi Kerumunan", GENDER_MOOD_TAB, "Heatmap Zona"];
const fmt = (n: number) => n.toLocaleString("en-US");
const pct = (n: number, total: number) => ((n / total) * 100).toFixed(1).replace(".", ",");

function TrendBadge({ trend, up }: { trend: string; up: boolean }) {
  return up ? (
    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded px-1.5 py-0.5 flex items-center gap-0.5">
      <ArrowUpRight className="h-3.5 w-3.5" />
      {trend}
    </span>
  ) : (
    <span className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded px-1.5 py-0.5 flex items-center gap-0.5">
      <ArrowDownRight className="h-3.5 w-3.5" />
      {trend}
    </span>
  );
}

function SummaryRow({
  today,
  trend,
  trendUp,
  avgPerHour,
  label,
}: {
  today: number;
  trend: string;
  trendUp: boolean;
  avgPerHour: number;
  label: string;
}) {
  return (
    <div className="flex items-start justify-between flex-shrink-0">
      <div>
        <div className="flex items-baseline gap-2">
          <h4 className="text-2xl font-extrabold text-slate-800 tracking-tight font-mono">{fmt(today)}</h4>
          <TrendBadge trend={trend} up={trendUp} />
        </div>
        <span className="text-xs font-semibold text-slate-400">{label}</span>
      </div>
      <div className="text-right">
        <span className="text-base font-extrabold text-slate-700 font-mono block">{avgPerHour}</span>
        <span className="text-xs font-semibold text-slate-400">Rata-rata / jam</span>
      </div>
    </div>
  );
}

function GenderMoodPanel() {
  const totalGender = genderMood.gender.reduce((sum, g) => sum + g.count, 0);
  const totalMood = genderMood.moods.reduce((sum, m) => sum + m.count, 0);
  const dominant = genderMood.moods.reduce((a, b) => (b.count > a.count ? b : a));
  const positive = genderMood.moods[0].count;

  return (
    <div className="flex-1 flex flex-col gap-3 min-h-0">
      <SummaryRow
        today={genderMood.today}
        trend={genderMood.trend}
        trendUp={genderMood.trendUp}
        avgPerHour={genderMood.avgPerHour}
        label="Wajah teranalisa hari ini"
      />

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-3 overflow-y-auto scrollbar-thin pr-0.5">
        {/* Gender */}
        <div className="rounded-xl border border-slate-200 bg-white/70 p-3.5 flex flex-col">
          <div className="flex items-center justify-between gap-2 pb-2 mb-2.5 border-b border-slate-100">
            <h5 className="font-bold text-slate-700 text-xs tracking-wider uppercase truncate">Deteksi Gender</h5>
            <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 flex-shrink-0">
              FaceAttr-R50
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {genderMood.gender.map((g) => (
              <div
                key={g.name}
                className="rounded-lg border p-2.5 flex flex-col gap-1"
                style={{ borderColor: `${g.color}33`, backgroundColor: `${g.color}0F` }}
              >
                <span
                  className="h-8 w-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${g.color}24`, color: g.color }}
                >
                  <g.Icon className="h-4 w-4" />
                </span>
                <span className="text-[12px] font-extrabold text-slate-500 uppercase tracking-wide">{g.name}</span>
                <span className="text-xl font-extrabold font-mono text-slate-800 leading-none">{fmt(g.count)}</span>
                <span className="text-[13px] font-extrabold" style={{ color: g.color }}>
                  {pct(g.count, totalGender)}%
                </span>
              </div>
            ))}
          </div>

          <div className="mt-auto pt-3">
            <div className="flex w-full h-2.5 rounded-full overflow-hidden bg-slate-100">
              {genderMood.gender.map((g) => (
                <div
                  key={g.name}
                  className="h-full"
                  style={{ width: `${(g.count / totalGender) * 100}%`, backgroundColor: g.color }}
                />
              ))}
            </div>
            <span className="text-[12px] font-semibold text-slate-400 block mt-1.5">
              Rasio Pria : Wanita — {pct(genderMood.gender[0].count, totalGender)}% :{" "}
              {pct(genderMood.gender[1].count, totalGender)}%
            </span>
          </div>
        </div>

        {/* Mood */}
        <div className="rounded-xl border border-slate-200 bg-white/70 p-3.5 flex flex-col">
          <div className="flex items-center justify-between gap-2 pb-2 mb-2.5 border-b border-slate-100">
            <h5 className="font-bold text-slate-700 text-xs tracking-wider uppercase truncate">Deteksi Mood</h5>
            <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 flex-shrink-0">
              FER-Net v3
            </span>
          </div>

          <div className="space-y-2.5">
            {genderMood.moods.map((m) => (
              <div key={m.name} className="flex items-center gap-2.5">
                <span
                  className="h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${m.color}1F`, color: m.color }}
                >
                  <m.Icon className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs font-bold text-slate-600 truncate">{m.name}</span>
                    <span className="text-[13px] font-mono font-bold text-slate-500 flex-shrink-0">
                      {fmt(m.count)} · {pct(m.count, totalMood)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(m.count / totalMood) * 100}%`, backgroundColor: m.color }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-auto pt-3 flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 text-[12px] font-extrabold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-600 border-emerald-100">
              <dominant.Icon className="h-3 w-3" /> Dominan: {dominant.name}
            </span>
            <span className="inline-flex items-center text-[12px] font-extrabold px-2 py-0.5 rounded-full border bg-slate-50 text-slate-500 border-slate-200">
              Indeks positif {pct(positive, totalMood)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function TrendPanel({ data }: { data: TabData }) {
  const option = {
    grid: { left: "3%", right: "4%", bottom: "3%", top: "12%", containLabel: true },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: mockHourlyLabels,
      axisLabel: { fontFamily: "Inter, sans-serif", fontSize: 11, color: "#94A3B8" },
      axisLine: { lineStyle: { color: "#E2E8F0" } },
    },
    yAxis: {
      type: "value",
      axisLabel: { fontFamily: "Inter, sans-serif", fontSize: 11, color: "#94A3B8" },
      splitLine: { lineStyle: { color: "#F1F5F9" } },
    },
    tooltip: { trigger: "axis", textStyle: { fontFamily: "Inter, sans-serif", fontSize: 13 } },
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
    <div className="flex-1 flex gap-4 overflow-hidden min-h-0">
      {/* Left: number + chart */}
      <div className="flex-1 flex flex-col min-w-0">
        <SummaryRow
          today={data.today}
          trend={data.trend}
          trendUp={data.trendUp}
          avgPerHour={data.avgPerHour}
          label="Hari ini"
        />
        <div className="flex-1 min-h-0 mt-1">
          <BaseChart option={option} className="w-full h-full" />
        </div>
      </div>

      {/* Right: top areas */}
      <div className="w-48 border-l border-slate-100 pl-4 flex flex-col flex-shrink-0">
        <h4 className="font-bold text-slate-700 text-xs tracking-wider uppercase pb-2 mb-1 border-b border-slate-100 truncate">
          {data.listTitle}
        </h4>
        <div className="space-y-3 mt-2 overflow-y-auto scrollbar-thin pr-0.5">
          {data.listItems.map((item, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-slate-600 truncate max-w-[70%]">
                  {idx + 1}. {item.name}
                </span>
                <span className="text-xs font-bold text-slate-500 font-mono flex-shrink-0">{fmt(item.count)}</span>
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
  );
}

export default function CctvAnalyticsTabs() {
  const [activeTab, setActiveTab] = useState("People Counting");
  const data = tabDataMap[activeTab];

  return (
    <div className="bg-white/60 backdrop-blur-md border border-slate-300/80 rounded-2xl p-5 shadow-sm flex flex-col gap-4 h-[420px] lg:h-full">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="h-9 w-9 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
          <Video className="h-5 w-5 text-brand-red" />
        </div>
        <h3 className="font-bold text-slate-800 text-base">Analitik CCTV &amp; AI</h3>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-100 overflow-x-auto scrollbar-thin flex-shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-shrink-0 px-3 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab ? "bg-white text-brand-red shadow-sm" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === GENDER_MOOD_TAB || !data ? <GenderMoodPanel /> : <TrendPanel data={data} />}
    </div>
  );
}

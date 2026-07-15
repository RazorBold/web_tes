"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Droplets,
  Zap,
  Truck,
  Waves,
  ArrowUp,
  X,
  Clock,
  Compass,
  TrendingUp,
  Activity,
  Award,
  ChevronRight,
} from "lucide-react";
import BaseChart from "@/components/charts/base-chart";

/* Lightweight smooth SVG sparkline (no chart library needed) */
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const w = 120;
  const h = 44;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((d, i) => [
    (i / (data.length - 1)) * w,
    h - 4 - ((d - min) / range) * (h - 10),
  ]);

  let line = `M ${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const mx = (x0 + x1) / 2;
    const my = (y0 + y1) / 2;
    line += ` Q ${x0.toFixed(1)},${y0.toFixed(1)} ${mx.toFixed(1)},${my.toFixed(1)}`;
  }
  line += ` L ${pts[pts.length - 1][0].toFixed(1)},${pts[pts.length - 1][1].toFixed(1)}`;
  const area = `${line} L ${w},${h} L 0,${h} Z`;
  const id = React.useId();

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface StatCard {
  id: "water" | "energy" | "fleet";
  title: string;
  value: string;
  unit: string;
  sub: string;
  trend: string;
  icon: React.ReactNode;
  iconBg: string;
  spark: number[];
  sparkColor: string;
}

const cards: StatCard[] = [
  {
    id: "water",
    title: "Total Penggunaan Air",
    value: "9,265",
    unit: "m³",
    sub: "Dibanding bulan lalu",
    trend: "+6.2%",
    icon: <Droplets className="h-5 w-5 text-blue-500" />,
    iconBg: "bg-blue-50",
    spark: [30, 33, 31, 36, 38, 41, 44, 49],
    sparkColor: "#3B82F6",
  },
  {
    id: "energy",
    title: "Total Energi",
    value: "6,759.13",
    unit: "MWh",
    sub: "Dibanding bulan lalu",
    trend: "+1.8%",
    icon: <Zap className="h-5 w-5 text-amber-500" />,
    iconBg: "bg-amber-50",
    spark: [40, 42, 41, 45, 50, 52, 58, 61],
    sparkColor: "#F59E0B",
  },
  {
    id: "fleet",
    title: "Total Kendaraan",
    value: "124",
    unit: "Unit",
    sub: "Sedang aktif",
    trend: "+12.5%",
    icon: <Truck className="h-5 w-5 text-indigo-500" />,
    iconBg: "bg-indigo-50",
    spark: [10, 22, 18, 30, 40, 38, 54, 62],
    sparkColor: "#10B981",
  },
];

export default function KpiStats() {
  const [selectedModal, setSelectedModal] = useState<null | "water" | "energy" | "fleet" | "flood">(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // 1. Refined Water Modal Content (Premium Leaderboard + Clean Borderless Graph)
  const renderWaterModal = () => {
    const waterChartOption = {
      grid: { left: "2%", right: "2%", bottom: "3%", top: "8%", containLabel: true },
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
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { fontFamily: "Inter, sans-serif", fontSize: 10, color: "#94A3B8" },
        splitLine: { lineStyle: { color: "#F1F5F9" } },
      },
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        borderColor: "#E2E8F0",
        borderWidth: 1,
        textStyle: { color: "#1E293B", fontSize: 11 },
        shadowBlur: 10,
        shadowColor: "rgba(0,0,0,0.05)",
      },
      series: [
        {
          name: "Debit Air",
          data: [280, 310, 290, 340, 380, 410, 430, 490],
          type: "line",
          smooth: true,
          symbol: "circle",
          symbolSize: 6,
          itemStyle: { color: "#3B82F6", borderWidth: 2, borderColor: "#fff" },
          lineStyle: { width: 3 },
          areaStyle: {
            color: {
              type: "linear",
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: "rgba(59, 130, 246, 0.18)" },
                { offset: 1, color: "rgba(59, 130, 246, 0.005)" },
              ],
            },
          },
        },
      ],
    };

    const topCustomers = [
      { name: "PT. Sinar Abadi Utama", zone: "Jakarta Pusat", usage: 540 },
      { name: "Mall Nusantara Plaza", zone: "Jakarta Pusat", usage: 485 },
      { name: "Hotel Sentosa Indah", zone: "Jakarta Selatan", usage: 410 },
      { name: "Apartemen Green Garden", zone: "Jakarta Barat", usage: 390 },
      { name: "Resto Selera Rakyat", zone: "Jakarta Timur", usage: 315 },
      { name: "Pabrik Maju Jaya Tekstil", zone: "Bekasi", usage: 280 },
      { name: "RS Medika Nusantara", zone: "Jakarta Pusat", usage: 265 },
      { name: "Univ Indonesia Depok", zone: "Depok", usage: 240 },
      { name: "PT. Kreasi Baru Mandiri", zone: "Jakarta Pusat", usage: 215 },
      { name: "Kantor Pemerintahan RI", zone: "Jakarta Pusat", usage: 195 },
    ];

    const getRankStyle = (index: number) => {
      switch (index) {
        case 0:
          return "bg-amber-500/10 text-amber-600 ring-2 ring-amber-500/20";
        case 1:
          return "bg-slate-400/10 text-slate-500 ring-2 ring-slate-400/20";
        case 2:
          return "bg-amber-700/10 text-amber-800 ring-2 ring-amber-700/20";
        default:
          return "bg-slate-50 text-slate-400";
      }
    };

    return (
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center shadow-sm flex-shrink-0">
            <Droplets className="h-6 w-6 text-blue-500" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-800 leading-tight">Detail Penggunaan Air</h3>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
              Analisis konsumsi debit air harian dan daftar 10 pelanggan teratas nasional.
            </p>
          </div>
        </div>

        {/* Content split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Column: Line Chart */}
          <div className="lg:col-span-7 bg-slate-50/40 rounded-2xl p-5 border border-slate-100 flex flex-col h-[330px] shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)]">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase">
                Tren Penggunaan 15 Hari Terakhir
              </span>
              <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-0.5">
                <ArrowUp className="h-3 w-3" /> +6.2% vs Bulan Lalu
              </span>
            </div>
            <div className="flex-1 w-full h-full relative">
              <BaseChart option={waterChartOption} />
            </div>
          </div>

          {/* Right Column: Leaderboard Table */}
          <div className="lg:col-span-5 bg-slate-50/40 rounded-2xl p-5 border border-slate-100 flex flex-col h-[330px] shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)]">
            <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase mb-3 block">
              Top 10 Pelanggan Terbesar
            </span>
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
              {topCustomers.map((c, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-100 hover:shadow-sm hover:border-slate-200 transition-all text-xs"
                >
                  <div className="flex items-center gap-3 max-w-[70%]">
                    <span className={`h-5 w-5 rounded-full font-extrabold text-[9px] flex items-center justify-center flex-shrink-0 ${getRankStyle(i)}`}>
                      {i + 1}
                    </span>
                    <div className="truncate">
                      <span className="font-bold text-slate-700 block truncate leading-tight">{c.name}</span>
                      <span className="text-[9px] font-bold text-slate-400 block mt-0.5">{c.zone}</span>
                    </div>
                  </div>
                  <span className="font-extrabold text-slate-800 font-mono flex items-baseline gap-0.5">
                    {c.usage}
                    <span className="text-[9px] text-slate-400 font-sans font-bold">m³</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 2. Refined Energy Modal Content
  const renderEnergyModal = () => {
    const energyChartOption = {
      grid: { left: "2%", right: "4%", bottom: "3%", top: "6%", containLabel: true },
      xAxis: {
        type: "value",
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { fontFamily: "Inter, sans-serif", fontSize: 10, color: "#94A3B8" },
        splitLine: { lineStyle: { color: "#F1F5F9" } },
      },
      yAxis: {
        type: "category",
        data: ["Thamrin", "Kuningan", "Rasuna Said", "Gatot Subroto", "Sudirman"],
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { fontFamily: "Inter, sans-serif", fontSize: 10, color: "#94A3B8" },
      },
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        borderColor: "#E2E8F0",
        borderWidth: 1,
        textStyle: { color: "#1E293B", fontSize: 11 },
        shadowBlur: 10,
        shadowColor: "rgba(0,0,0,0.05)",
      },
      series: [
        {
          name: "Konsumsi Listrik",
          data: [680, 820, 980, 1210, 1450],
          type: "bar",
          itemStyle: {
            color: {
              type: "linear",
              x: 0, y: 0, x2: 1, y2: 0,
              colorStops: [
                { offset: 0, color: "#FBBF24" },
                { offset: 1, color: "#F59E0B" },
              ],
            },
            borderRadius: [0, 4, 4, 0],
          },
          barWidth: 14,
        },
      ],
    };

    const energyLosses = [
      { title: "Substasiun Sudirman Utama", usage: "1,450 MWh", loss: "1.2%" },
      { title: "Gardu Hub Gatot Subroto", usage: "1,210 MWh", loss: "1.8%" },
      { title: "Panel Pusat Rasuna Said", usage: "980 MWh", loss: "2.1%" },
      { title: "Kuningan Smart Hub", usage: "820 MWh", loss: "1.5%" },
      { title: "Sub-Panel Distribusi Thamrin", usage: "680 MWh", loss: "2.5%" },
    ];

    return (
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center shadow-sm flex-shrink-0">
            <Zap className="h-6 w-6 text-amber-500" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-800 leading-tight">Detail Konsumsi Energi</h3>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
              Analisis beban penggunaan energi substasiun kelistrikan serta losses jaringan distribusi.
            </p>
          </div>
        </div>

        {/* Content Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Column: Horizontal Bar Chart */}
          <div className="lg:col-span-7 bg-slate-50/40 rounded-2xl p-5 border border-slate-100 flex flex-col h-[330px] shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)]">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase">
                Top Tier 5 kWh Terbanyak (Substasiun)
              </span>
              <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-0.5">
                <ArrowUp className="h-3 w-3" /> +1.8% vs Bulan Lalu
              </span>
            </div>
            <div className="flex-1 w-full h-full relative">
              <BaseChart option={energyChartOption} />
            </div>
          </div>

          {/* Right Column: Losses & Efficiency List */}
          <div className="lg:col-span-5 bg-slate-50/40 rounded-2xl p-5 border border-slate-100 flex flex-col h-[330px] shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)]">
            <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase mb-3 block">
              Rincian Efisiensi & Losses Distribusi
            </span>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
              {energyLosses.map((item, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-white border border-slate-100 hover:shadow-sm hover:border-slate-200 transition-all flex justify-between items-center text-xs"
                >
                  <div className="max-w-[70%]">
                    <span className="font-bold text-slate-700 block leading-tight truncate">{item.title}</span>
                    <span className="text-[9.5px] font-bold text-slate-400 mt-1 block">Konsumsi: {item.usage}</span>
                  </div>
                  <div className="text-right leading-none">
                    <span className="text-[9px] font-bold text-slate-400 block uppercase">Loss Rate</span>
                    <span className="text-xs font-extrabold text-brand-red font-mono mt-1 block">{item.loss}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 3. Refined Fleet Modal Content
  const renderFleetModal = () => {
    const topVehicles = [
      { plate: "B 9876 ABC", type: "Heavy Truck 12", driver: "Budi Santoso", distance: 254, hours: 9.8 },
      { plate: "B 1234 XYZ", type: "Box Van 07", driver: "Ahmad Yani", distance: 210, hours: 8.5 },
      { plate: "B 5432 LPT", type: "Utility Truck 05", driver: "Adi Wijaya", distance: 185, hours: 7.6 },
      { plate: "B 7777 VVV", type: "Passenger Car 03", driver: "Deni Setiawan", distance: 142, hours: 5.8 },
      { plate: "B 6655 KKK", type: "Service Truck 08", driver: "Eko Prasetyo", distance: 130, hours: 5.5 },
    ];

    return (
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center shadow-sm flex-shrink-0">
            <Truck className="h-6 w-6 text-indigo-500" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-800 leading-tight">Statistik & Utilitas Armada</h3>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
              Metrik operasional kendaraan harian, utilitas perjalanan, dan jam aktif pengemudi.
            </p>
          </div>
        </div>

        {/* Content Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Column: Stats KPI Summaries */}
          <div className="lg:col-span-5 flex flex-col gap-4 h-[330px]">
            {/* KPI 1 */}
            <div className="flex-1 bg-gradient-to-br from-white to-slate-50/20 border border-slate-100 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
              <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center shadow-inner flex-shrink-0">
                <Clock className="h-6 w-6 text-indigo-500" />
              </div>
              <div className="leading-tight">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Rata-Rata Jam Kerja</span>
                <h4 className="text-xl font-extrabold text-slate-800 font-mono mt-1">8.4 jam <span className="text-xs font-bold text-slate-400">/ hari</span></h4>
                <span className="text-[9.5px] font-bold text-emerald-500 bg-emerald-50 border border-emerald-100 rounded px-1.5 py-0.5 mt-2 inline-block">Utilitas Optimal (92%)</span>
              </div>
            </div>

            {/* KPI 2 */}
            <div className="flex-1 bg-gradient-to-br from-white to-slate-50/20 border border-slate-100 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
              <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center shadow-inner flex-shrink-0">
                <Compass className="h-6 w-6 text-emerald-500" />
              </div>
              <div className="leading-tight">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Rata-Rata Jarak Tempuh</span>
                <h4 className="text-xl font-extrabold text-slate-800 font-mono mt-1">148.6 km <span className="text-xs font-bold text-slate-400">/ hari</span></h4>
                <span className="text-[9.5px] font-bold text-slate-400 mt-2 block">Target Rute: 150 km/hari</span>
              </div>
            </div>
          </div>

          {/* Right Column: Fleet Leaderboard */}
          <div className="lg:col-span-7 bg-slate-50/40 rounded-2xl p-5 border border-slate-100 flex flex-col h-[330px] shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)]">
            <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase mb-3 block">
              Top 5 Utilitas Jarak Perjalanan Terjauh
            </span>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
              {topVehicles.map((item, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-white border border-slate-100 hover:shadow-sm hover:border-slate-200 transition-all flex justify-between items-center text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="h-5.5 w-5.5 rounded-full bg-indigo-50 text-indigo-600 font-extrabold text-[10px] flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </span>
                    <div>
                      <span className="font-bold text-slate-800 block leading-tight">{item.plate} ({item.type})</span>
                      <span className="text-[9.5px] font-bold text-slate-400 mt-1 block">Pengemudi: {item.driver}</span>
                    </div>
                  </div>
                  <div className="text-right leading-none">
                    <span className="text-xs font-extrabold text-slate-800 font-mono block">{item.distance} km</span>
                    <span className="text-[9px] font-bold text-slate-400 block mt-1">{item.hours} jam aktif</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };  // 4. Flood Modal Content
  const renderFloodModal = () => {
    const floodChartOption = {
      grid: { left: "2%", right: "2%", bottom: "3%", top: "8%", containLabel: true },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: ["10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00"],
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { fontFamily: "Inter, sans-serif", fontSize: 10, color: "#94A3B8" },
      },
      yAxis: {
        type: "value",
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { fontFamily: "Inter, sans-serif", fontSize: 10, color: "#94A3B8" },
        splitLine: { lineStyle: { color: "#F1F5F9" } },
      },
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        borderColor: "#E2E8F0",
        borderWidth: 1,
        textStyle: { color: "#1E293B", fontSize: 11 },
        shadowBlur: 10,
        shadowColor: "rgba(0,0,0,0.05)",
      },
      series: [
        {
          name: "Level Air",
          data: [1.1, 1.3, 1.45, 1.7, 1.85, 1.9, 1.85],
          type: "line",
          smooth: true,
          symbol: "circle",
          symbolSize: 6,
          itemStyle: { color: "#3B82F6", borderWidth: 2, borderColor: "#fff" },
          lineStyle: { width: 3 },
          areaStyle: {
            color: {
              type: "linear",
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: "rgba(59, 130, 246, 0.18)" },
                { offset: 1, color: "rgba(59, 130, 246, 0.005)" },
              ],
            },
          },
        },
      ],
    };

    const floodGates = [
      { name: "Pintu Air Manggarai", level: "1.85 m", status: "Waspada (Siaga II)", type: "warn" },
      { name: "Pintu Air Karet", level: "2.10 m", status: "Waspada (Siaga II)", type: "warn" },
      { name: "Pintu Air Angke Hulu", level: "3.20 m", status: "Bahaya (Siaga I)", type: "danger" },
      { name: "Pintu Air Pasar Ikan", level: "1.40 m", status: "Wajar (Siaga III)", type: "normal" },
      { name: "Pintu Air Sunter Hulu", level: "0.90 m", status: "Normal (Siaga IV)", type: "good" },
    ];

    const getStatusColor = (type: string) => {
      switch (type) {
        case "danger":
          return "text-brand-red bg-red-50 border-red-100";
        case "warn":
          return "text-amber-750 bg-amber-50 border-amber-100";
        case "normal":
          return "text-sky-700 bg-sky-50 border-sky-100";
        default:
          return "text-emerald-700 bg-emerald-50 border-emerald-100";
      }
    };

    return (
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center shadow-sm flex-shrink-0">
            <Waves className="h-6 w-6 text-blue-500" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-800 leading-tight">Detail Pemantauan Tinggi Air &amp; Banjir</h3>
            <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
              Data telemetri tingkat siaga banjir pintu air wilayah Jakarta secara real-time.
            </p>
          </div>
        </div>

        {/* Content split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Column: Line Chart */}
          <div className="lg:col-span-7 bg-slate-50/40 rounded-2xl p-5 border border-slate-100 flex flex-col h-[330px] shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)]">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase">
                Tren Tinggi Air Manggarai (24 Jam)
              </span>
              <span className="text-[10px] font-bold text-amber-600 flex items-center gap-0.5">
                Status: Waspada
              </span>
            </div>
            <div className="flex-1 w-full h-full relative">
              <BaseChart option={floodChartOption} />
            </div>
          </div>

          {/* Right Column: Flood Gates Table */}
          <div className="lg:col-span-5 bg-slate-50/40 rounded-2xl p-5 border border-slate-100 flex flex-col h-[330px] shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)]">
            <span className="text-[10px] font-extrabold text-slate-400 tracking-wider uppercase mb-3 block">
              Daftar Siaga Pintu Air Jakarta
            </span>
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
              {floodGates.map((g, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-100 hover:shadow-sm hover:border-slate-200 transition-all text-xs"
                >
                  <div className="max-w-[70%]">
                    <span className="font-bold text-slate-700 block leading-tight truncate">{g.name}</span>
                    <span className={`inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded border mt-1.5 ${getStatusColor(g.type)}`}>
                      {g.status}
                    </span>
                  </div>
                  <span className="font-extrabold text-slate-800 font-mono text-right flex-shrink-0 text-sm">
                    {g.level}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
      {cards.map((c) => (
        <div
          key={c.title}
          onClick={() => setSelectedModal(c.id)}
          className="bg-white/45 backdrop-blur-md border border-white/70 rounded-2xl p-5 shadow-sm flex flex-col justify-between h-[150px] hover:shadow-md transition-shadow cursor-pointer hover:border-slate-300"
        >
          {/* Top: icon + title + trend */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`h-9 w-9 rounded-xl ${c.iconBg} flex items-center justify-center flex-shrink-0`}>
                {c.icon}
              </div>
              <span className="text-[13px] font-bold text-slate-600 truncate">{c.title}</span>
            </div>
            <span className="flex items-center gap-0.5 text-[10px] font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full px-1.5 py-0.5 flex-shrink-0">
              <ArrowUp className="h-3 w-3" />
              {c.trend}
            </span>
          </div>

          {/* Bottom: value + sparkline */}
          <div className="flex items-end justify-between gap-3 mt-3">
            <div className="min-w-0">
              <h4 className="text-[23px] font-extrabold text-slate-800 tracking-tight leading-none flex items-baseline gap-0.5">
                {c.value}
                <span className="text-[11px] font-extrabold text-slate-400 font-sans ml-0.5">{c.unit}</span>
              </h4>
              <span className="text-[11px] font-bold text-slate-400 mt-2 block">{c.sub}</span>
            </div>
            <div className="w-[105px] h-10 flex-shrink-0">
              <Sparkline data={c.spark} color={c.sparkColor} />
            </div>
          </div>
        </div>
      ))}

      {/* Ketinggian Air (variant) */}
      <div
        onClick={() => setSelectedModal("flood")}
        className="bg-white/45 backdrop-blur-md border border-white/70 rounded-2xl p-5 shadow-sm flex flex-col justify-between h-[150px] hover:shadow-md transition-shadow cursor-pointer hover:border-slate-300"
      >
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Waves className="h-5 w-5 text-blue-500" />
          </div>
          <span className="text-[13px] font-bold text-slate-600 truncate">Ketinggian Air</span>
        </div>

        <div className="flex items-end justify-between gap-3 mt-3">
          <div>
            <div className="flex items-center gap-2 leading-none">
              <h4 className="text-[23px] font-extrabold text-slate-800 tracking-tight leading-none flex items-baseline">
                1.85
                <span className="text-xs font-bold text-slate-400 ml-1 font-sans">m</span>
              </h4>
              <span className="text-[10px] font-extrabold text-amber-700 bg-amber-50 border border-amber-100 rounded-full px-2 py-0.5">
                Waspada
              </span>
            </div>
            <span className="text-[11px] font-bold text-slate-400 mt-2 block">Pintu Air Manggarai</span>
          </div>
          <Waves className="h-11 w-11 text-blue-500/15 flex-shrink-0" />
        </div>
      </div>

      {/* Backdrop Modal Overlay (portaled to body so it escapes the glass section's containing block) */}
      {selectedModal && mounted && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedModal(null);
            }
          }}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-md z-[60] flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl w-full max-w-4xl p-7 flex flex-col relative animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
            {/* Indonesian flag accent strip top */}
            <div className="absolute top-0 inset-x-0 h-1 flex flex-col">
              <div className="h-0.5 bg-brand-red w-full"></div>
              <div className="h-0.5 bg-white w-full"></div>
            </div>

            {/* Close Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedModal(null);
              }}
              className="absolute top-5 right-5 h-8 w-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-all border border-slate-100 z-10"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Modal Content */}
            <div className="mt-1">
              {selectedModal === "water" && renderWaterModal()}
              {selectedModal === "energy" && renderEnergyModal()}
              {selectedModal === "fleet" && renderFleetModal()}
              {selectedModal === "flood" && renderFloodModal()}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

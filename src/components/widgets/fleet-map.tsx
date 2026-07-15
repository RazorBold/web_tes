"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import { Truck, Car, ArrowRight, X } from "lucide-react";

// Load Leaflet map on client-side only (avoid SSR window error)
const DynamicMap = dynamic(() => import("@/components/maps/base-map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center text-xs text-slate-400 font-bold border border-slate-100 rounded-lg animate-pulse">
      <span className="h-6 w-6 border-2 border-slate-300 border-t-brand-red rounded-full animate-spin mb-2"></span>
      Loading Interactive Map...
    </div>
  ),
});

interface ActivityItem {
  id: string;
  name: string;
  plate: string;
  location: string;
  time: string;
  type: "transit" | "idle" | "maint";
}

const activities: ActivityItem[] = [
  { id: "1", name: "Daihatsu Sigra", plate: "B 1234 SKA", location: "Sedang berjalan - Sudirman", time: "2 mnt lalu", type: "transit" },
  { id: "2", name: "Hyundai Ioniq 5", plate: "B 9876 DPT", location: "Tiba di Gudang Utama", time: "5 mnt lalu", type: "transit" },
  { id: "3", name: "Toyota Hilux", plate: "B 5432 LPT", location: "Melakukan pengisian BBM", time: "12 mnt lalu", type: "idle" },
  { id: "4", name: "Mitsubishi Fuso", plate: "B 6655 KKK", location: "Servis Rutin di Bengkel", time: "18 mnt lalu", type: "maint" },
  { id: "5", name: "Honda HR-V", plate: "B 8821 PPK", location: "Sedang berjalan - Thamrin", time: "22 mnt lalu", type: "transit" },
  { id: "6", name: "Suzuki Carry", plate: "B 7731 WQA", location: "Bongkar Muat Barang - Kuningan", time: "30 mnt lalu", type: "idle" },
  { id: "7", name: "Toyota Avanza", plate: "B 2291 TTT", location: "Sedang berjalan - Gatot Subroto", time: "35 mnt lalu", type: "transit" },
  { id: "8", name: "Hino Ranger", plate: "B 9081 FFA", location: "Parkir di Loading Dock B", time: "42 mnt lalu", type: "idle" },
  { id: "9", name: "Wuling Air EV", plate: "B 3341 XYZ", location: "Pengisian Baterai - Mall Senayan", time: "50 mnt lalu", type: "idle" },
  { id: "10", name: "Isuzu Elf", plate: "B 4412 RTY", location: "Perbaikan Kelistrikan Jaringan", time: "1 jam lalu", type: "maint" },
];

const kpis = [
  { label: "Total", value: "124", dot: "bg-slate-400", bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-800" },
  { label: "Berjalan", value: "86", dot: "bg-emerald-500", bg: "bg-emerald-50/60", border: "border-emerald-100", text: "text-emerald-600" },
  { label: "Idle", value: "21", dot: "bg-amber-500", bg: "bg-amber-50/60", border: "border-amber-100", text: "text-amber-600" },
  { label: "Perawatan", value: "17", dot: "bg-brand-red", bg: "bg-red-50/60", border: "border-red-100", text: "text-brand-red" },
];

const dotColor = (type: ActivityItem["type"]) =>
  type === "transit" ? "bg-emerald-500" : type === "idle" ? "bg-amber-500" : "bg-brand-red";

export default function FleetMap() {
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="bg-white/45 backdrop-blur-md border border-white/70 rounded-2xl p-6 shadow-sm flex flex-col gap-4 h-[420px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0 shadow-sm border border-red-100/50">
            <Truck className="h-5 w-5 text-brand-red" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base leading-none">
              Fleet Tracking
            </h3>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              Pemantauan armada real-time
            </p>
          </div>
        </div>

        <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 text-[9px] font-bold px-2.5 py-1 rounded-full border border-emerald-100 uppercase tracking-wider">
          <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
          Live
        </span>
      </div>

      {/* KPI strip (4 columns) */}
      <div className="grid grid-cols-4 gap-2.5">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className={`rounded-lg border ${kpi.border} ${kpi.bg} px-3 py-2 flex flex-col gap-1.5`}
          >
            <div className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full flex-shrink-0 ${kpi.dot}`}></span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                {kpi.label}
              </span>
            </div>
            <span className={`text-lg font-extrabold font-mono leading-none ${kpi.text}`}>
              {kpi.value}
            </span>
          </div>
        ))}
      </div>

      {/* Main split: map + activity */}
      <div className="flex-1 flex gap-5 overflow-hidden">
        {/* Leaflet Dynamic Map */}
        <div
          onClick={() => setIsMapOpen(true)}
          className="flex-1 h-full min-w-0 rounded-xl overflow-hidden border border-slate-200 shadow-inner relative cursor-pointer group"
        >
          <DynamicMap />
          <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/15 transition-all flex items-center justify-center pointer-events-none">
            <span className="bg-white/95 text-slate-800 font-bold text-[10px] px-3 py-1.5 rounded-full shadow-lg border border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
              🔍 Klik untuk Perbesar Map
            </span>
          </div>
        </div>

        {/* Recent Activity Panel */}
        <div className="w-60 h-full flex flex-col border-l border-slate-100 pl-5 flex-shrink-0">
          <h4 className="font-bold text-slate-700 text-[11px] tracking-wider uppercase pb-2.5 mb-1 border-b border-slate-100">
            Aktivitas Terbaru
          </h4>
          <div className="flex-1 overflow-y-auto -mr-2 pr-2 divide-y divide-slate-100 scrollbar-thin">
            {activities.map((item) => (
              <div
                key={item.id}
                onClick={() => setIsMapOpen(true)}
                className="flex gap-2.5 items-start py-2.5 px-1.5 -mx-1.5 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
              >
                {/* Vehicle icon per status */}
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${
                  item.type === "transit"
                    ? "bg-emerald-50 text-emerald-600 border-emerald-100/50"
                    : item.type === "idle"
                    ? "bg-amber-50 text-amber-600 border-amber-100/50"
                    : "bg-red-50 text-brand-red border-red-100/50"
                } mt-0.5`}>
                  {item.name.toLowerCase().includes("sigra") || item.name.toLowerCase().includes("ioniq") ? (
                    <Car className="h-4 w-4" />
                  ) : (
                    <Truck className="h-4 w-4" />
                  )}
                </div>
                <div className="min-w-0 w-full">
                  <div className="flex justify-between items-baseline gap-2">
                    <span className="font-bold text-slate-800 text-xs truncate leading-none">
                      {item.name}
                    </span>
                    <span className="text-[9px] font-semibold text-slate-400 font-mono flex-shrink-0">
                      {item.time}
                    </span>
                  </div>
                  <span className="text-[9.5px] font-bold text-slate-400 block mt-1">
                    {item.plate}
                  </span>
                  <span className="text-[10.5px] text-slate-500 truncate block mt-0.5">
                    {item.location}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setIsMapOpen(true)}
            className="text-[10px] font-bold text-brand-red hover:text-brand-red-hover transition-colors flex items-center justify-center gap-1 border-t border-slate-100 pt-3 mt-2 cursor-pointer w-full"
          >
            Lihat Semua <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Full-screen Map Modal Overlay */}
      {isMapOpen && mounted && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsMapOpen(false);
            }
          }}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-md z-[60] flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl w-full max-w-5xl h-[80vh] p-6 flex flex-col relative animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
            {/* Indonesian flag accent strip top */}
            <div className="absolute top-0 inset-x-0 h-1 flex flex-col">
              <div className="h-0.5 bg-brand-red w-full"></div>
              <div className="h-0.5 bg-white w-full"></div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setIsMapOpen(false)}
              className="absolute top-5 right-5 h-8 w-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-all border border-slate-100 z-10 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Modal Title */}
            <div className="mb-4">
              <h3 className="text-base font-extrabold text-slate-800 leading-tight">
                Peta Pelacakan Armada Real-time
              </h3>
              <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                Pantau lokasi kendaraan Daihatsu, Hyundai, Toyota, dan Mitsubishi secara presisi di seluruh rute Indonesia.
              </p>
            </div>

            {/* Large Leaflet Map inside Modal */}
            <div className="flex-1 w-full h-full rounded-2xl overflow-hidden border border-slate-100 shadow-inner relative">
              <DynamicMap />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}


"use client";

import React from "react";
import dynamic from "next/dynamic";
import Section from "@/components/layout/section";
import PageHeader from "@/components/layout/page-header";
import { Truck, MapPin, Route, Timer } from "lucide-react";

const DynamicMap = dynamic(() => import("@/components/maps/base-map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center text-xs text-slate-400 font-bold rounded-xl">
      <span className="h-6 w-6 border-2 border-slate-300 border-t-brand-red rounded-full animate-spin mb-2" />
      Memuat Peta Armada...
    </div>
  ),
});

const kpis = [
  { label: "Total Armada", value: "124", dot: "bg-slate-400", text: "text-slate-800", bg: "bg-white/45 border-white/70" },
  { label: "Berjalan", value: "86", dot: "bg-emerald-500", text: "text-emerald-600", bg: "bg-emerald-50/60 border-emerald-100" },
  { label: "Idle", value: "21", dot: "bg-amber-500", text: "text-amber-600", bg: "bg-amber-50/60 border-amber-100" },
  { label: "Perawatan", value: "17", dot: "bg-brand-red", text: "text-brand-red", bg: "bg-red-50/60 border-red-100" },
];

const activities = [
  { name: "Daihatsu Sigra", plate: "B 1234 SKA", note: "Sedang berjalan - Sudirman", time: "2 mnt lalu", type: "transit" },
  { name: "Hyundai Ioniq 5", plate: "B 9876 DPT", note: "Tiba di Gudang Utama", time: "5 mnt lalu", type: "transit" },
  { name: "Toyota Hilux", plate: "B 5432 LPT", note: "Melakukan pengisian BBM", time: "12 mnt lalu", type: "idle" },
  { name: "Mitsubishi Xpander", plate: "B 2201 TLK", note: "Rute selesai", time: "18 mnt lalu", type: "maint" },
];

const vehicles = [
  { plate: "B 9876 ABC", type: "Heavy Truck 12", driver: "Budi Santoso", status: "Berjalan", distance: "254 km", hours: "9,8 jam" },
  { plate: "B 1234 XYZ", type: "Box Van 07", driver: "Ahmad Yani", status: "Berjalan", distance: "210 km", hours: "8,5 jam" },
  { plate: "B 5432 LPT", type: "Utility Truck 05", driver: "Adi Wijaya", status: "Idle", distance: "185 km", hours: "7,6 jam" },
  { plate: "B 7777 VVV", type: "Passenger Car 03", driver: "Deni Setiawan", status: "Berjalan", distance: "142 km", hours: "5,8 jam" },
  { plate: "B 6655 KKK", type: "Service Truck 08", driver: "Eko Prasetyo", status: "Perawatan", distance: "130 km", hours: "5,5 jam" },
  { plate: "B 2201 TLK", type: "Mitsubishi Xpander", driver: "Rian Hidayat", status: "Idle", distance: "98 km", hours: "4,2 jam" },
];

const statusChip = (s: string) =>
  s === "Berjalan"
    ? "bg-emerald-50 text-emerald-600 border-emerald-100"
    : s === "Idle"
    ? "bg-amber-50 text-amber-600 border-amber-100"
    : "bg-red-50 text-brand-red border-red-100";

const dotColor = (t: string) =>
  t === "transit" ? "bg-emerald-500" : t === "idle" ? "bg-amber-500" : "bg-brand-red";

export default function FleetPage() {
  return (
    <div className="space-y-6 pb-4">
      <PageHeader
        title="Fleet Tracking"
        subtitle="Pelacakan armada kendaraan operasional secara real-time di seluruh Indonesia"
        right={
          <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-100 uppercase tracking-wider">
            <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" /> GPS Live · 30 detik
          </span>
        }
      />

      {/* 1. Status Armada */}
      <Section num={1} title="Status Armada">
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {kpis.map((k) => (
            <div key={k.label} className={`rounded-2xl border backdrop-blur-md p-5 shadow-sm ${k.bg}`}>
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${k.dot}`} />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{k.label}</span>
              </div>
              <h4 className={`text-3xl font-extrabold font-mono leading-none mt-3 ${k.text}`}>{k.value}</h4>
              <span className="text-[10px] font-semibold text-slate-400 block mt-2">unit kendaraan</span>
            </div>
          ))}
        </div>
      </Section>

      {/* 2. Peta & Aktivitas */}
      <Section num={2} title="Peta Pelacakan Real-time">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 bg-white/45 backdrop-blur-md border border-white/70 rounded-2xl p-4 shadow-sm h-[440px]">
            <div className="w-full h-full rounded-xl overflow-hidden border border-slate-200 shadow-inner relative">
              <DynamicMap />
            </div>
          </div>

          <div className="bg-white/45 backdrop-blur-md border border-white/70 rounded-2xl p-5 shadow-sm h-[440px] flex flex-col">
            <h3 className="font-bold text-slate-700 text-[11px] tracking-wider uppercase border-b border-slate-100 pb-2.5">
              Aktivitas Terbaru
            </h3>
            <div className="flex-1 divide-y divide-slate-100 overflow-y-auto">
              {activities.map((a) => (
                <div key={a.plate} className="flex gap-3 items-start py-3">
                  <span className="relative flex-shrink-0 mt-1">
                    <span className={`block h-2.5 w-2.5 rounded-full ${dotColor(a.type)}`} />
                    {a.type === "transit" && (
                      <span className={`absolute inset-0 h-2.5 w-2.5 rounded-full ${dotColor(a.type)} opacity-40 animate-ping`} />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between items-baseline gap-2">
                      <span className="font-bold text-slate-800 text-xs truncate">{a.name}</span>
                      <span className="text-[9px] font-semibold text-slate-400 font-mono flex-shrink-0">{a.time}</span>
                    </div>
                    <span className="text-[10px] font-mono font-semibold text-slate-400 block mt-0.5">{a.plate}</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">{a.note}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
              <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-2.5 flex items-center gap-2">
                <Route className="h-4 w-4 text-brand-red" />
                <div className="leading-tight">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Jarak Hari Ini</span>
                  <span className="text-xs font-extrabold text-slate-700">1.019 km</span>
                </div>
              </div>
              <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-2.5 flex items-center gap-2">
                <Timer className="h-4 w-4 text-brand-red" />
                <div className="leading-tight">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Jam Operasi</span>
                  <span className="text-xs font-extrabold text-slate-700">41,4 jam</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* 3. Daftar Kendaraan */}
      <Section num={3} title="Daftar Kendaraan Aktif">
        <div className="bg-white/45 backdrop-blur-md border border-white/70 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200/70 bg-slate-50/50">
                  {["Kendaraan", "Plat Nomor", "Pengemudi", "Status", "Jarak Hari Ini", "Jam Operasi"].map((h) => (
                    <th key={h} className="px-5 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vehicles.map((v) => (
                  <tr key={v.plate} className="hover:bg-white/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <span className="h-8 w-8 rounded-lg bg-red-50 text-brand-red flex items-center justify-center flex-shrink-0">
                          <Truck className="h-4 w-4" />
                        </span>
                        <span className="text-xs font-bold text-slate-800 whitespace-nowrap">{v.type}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs font-mono font-bold text-slate-600 whitespace-nowrap">{v.plate}</td>
                    <td className="px-5 py-3.5 text-xs font-semibold text-slate-600 whitespace-nowrap">{v.driver}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${statusChip(v.status)}`}>
                        {v.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs font-mono font-bold text-slate-700 whitespace-nowrap">{v.distance}</td>
                    <td className="px-5 py-3.5 text-xs font-mono font-bold text-slate-700 whitespace-nowrap">{v.hours}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-slate-200/70 flex items-center justify-between text-[10px] font-semibold text-slate-400">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" /> Area operasi: Jabodetabek
            </span>
            <span>Menampilkan 6 dari 124 kendaraan</span>
          </div>
        </div>
      </Section>
    </div>
  );
}

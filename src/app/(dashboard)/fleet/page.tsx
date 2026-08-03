"use client";

import React from "react";
import dynamic from "next/dynamic";
import Section from "@/components/layout/section";
import PageHeader from "@/components/layout/page-header";
import { useFleetVehicles, useFleetOverview } from "@/hooks/use-fleet";
import { timeAgo } from "@/lib/format";
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

const statusLabel = (status: string) =>
  status === "moving" ? "Berjalan" : status === "idle" ? "Idle" : "Perawatan";

const statusChip = (status: string) =>
  status === "moving"
    ? "bg-emerald-50 text-emerald-600 border-emerald-100"
    : status === "idle"
    ? "bg-amber-50 text-amber-600 border-amber-100"
    : "bg-red-50 text-brand-red border-red-100";

const dotColor = (status: string) =>
  status === "moving" ? "bg-emerald-500" : status === "idle" ? "bg-amber-500" : "bg-brand-red";

export default function FleetPage() {
  const { data: vehicles } = useFleetVehicles();
  const { data: overview } = useFleetOverview();

  const kpis = [
    { label: "Total Armada", value: overview?.total ?? "—", dot: "bg-slate-400", text: "text-slate-800", bg: "bg-white/45 border-white/70" },
    { label: "Berjalan", value: overview?.moving ?? "—", dot: "bg-emerald-500", text: "text-emerald-600", bg: "bg-emerald-50/60 border-emerald-100" },
    { label: "Idle", value: overview?.idle ?? "—", dot: "bg-amber-500", text: "text-amber-600", bg: "bg-amber-50/60 border-amber-100" },
    { label: "Perawatan", value: overview?.maintenance ?? "—", dot: "bg-brand-red", text: "text-brand-red", bg: "bg-red-50/60 border-red-100" },
  ];

  const activities = (vehicles ?? []).slice(0, 4);
  const vehicleRows = vehicles ?? [];

  return (
    <div className="space-y-6 pb-4">
      <PageHeader
        title="Fleet Tracking"
        subtitle="Pelacakan armada kendaraan operasional secara real-time di seluruh Indonesia"
        right={
          <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 text-[12px] font-bold px-2.5 py-1 rounded-full border border-emerald-100 uppercase tracking-wider">
            <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" /> GPS Live
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
                <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wide">{k.label}</span>
              </div>
              <h4 className={`text-3xl font-extrabold font-mono leading-none mt-3 ${k.text}`}>{k.value}</h4>
              <span className="text-[12px] font-semibold text-slate-400 block mt-2">unit kendaraan</span>
            </div>
          ))}
        </div>
      </Section>

      {/* 2. Peta & Aktivitas */}
      <Section num={2} title="Peta Pelacakan Real-time">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 bg-white/60 backdrop-blur-md border border-slate-300/80 rounded-2xl p-4 shadow-sm h-[440px]">
            <div className="w-full h-full rounded-xl overflow-hidden border border-slate-200 shadow-inner relative">
              <DynamicMap />
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-md border border-slate-300/80 rounded-2xl p-5 shadow-sm h-[440px] flex flex-col">
            <h3 className="font-bold text-slate-700 text-[13px] tracking-wider uppercase border-b border-slate-100 pb-2.5">
              Aktivitas Terbaru
            </h3>
            <div className="flex-1 divide-y divide-slate-100 overflow-y-auto">
              {activities.map((a) => (
                <div key={a.id} className="flex gap-3 items-start py-3">
                  <span className="relative flex-shrink-0 mt-1">
                    <span className={`block h-2.5 w-2.5 rounded-full ${dotColor(a.status)}`} />
                    {a.status === "moving" && (
                      <span className={`absolute inset-0 h-2.5 w-2.5 rounded-full ${dotColor(a.status)} opacity-40 animate-ping`} />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between items-baseline gap-2">
                      <span className="font-bold text-slate-800 text-xs truncate">{a.type}</span>
                      <span className="text-[11px] font-semibold text-slate-400 font-mono flex-shrink-0">{timeAgo(a.updatedAt)}</span>
                    </div>
                    <span className="text-[12px] font-mono font-semibold text-slate-400 block mt-0.5">{a.plate}</span>
                    <span className="text-[12px] text-slate-500 block mt-0.5">
                      {statusLabel(a.status)}{a.driverName ? ` · ${a.driverName}` : ""}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
              <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-2.5 flex items-center gap-2">
                <Route className="h-4 w-4 text-brand-red" />
                <div className="leading-tight">
                  <span className="text-[11px] font-bold text-slate-400 uppercase block">Jarak Hari Ini</span>
                  <span className="text-xs font-extrabold text-slate-700">
                    {overview ? `${overview.totalDistanceTodayKm.toLocaleString("id-ID")} km` : "—"}
                  </span>
                </div>
              </div>
              <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-2.5 flex items-center gap-2">
                <Timer className="h-4 w-4 text-brand-red" />
                <div className="leading-tight">
                  <span className="text-[11px] font-bold text-slate-400 uppercase block">Jam Operasi</span>
                  <span className="text-xs font-extrabold text-slate-700">
                    {overview ? `${overview.totalHoursActiveToday.toLocaleString("id-ID")} jam` : "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* 3. Daftar Kendaraan */}
      <Section num={3} title="Daftar Kendaraan Aktif">
        <div className="bg-white/60 backdrop-blur-md border border-slate-300/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200/70 bg-slate-50/50">
                  {["Kendaraan", "Plat Nomor", "Pengemudi", "Status", "Jarak Hari Ini", "Jam Operasi"].map((h) => (
                    <th key={h} className="px-5 py-3 text-[12px] font-extrabold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vehicleRows.map((v) => (
                  <tr key={v.id} className="hover:bg-white/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <span className="h-8 w-8 rounded-lg bg-red-50 text-brand-red flex items-center justify-center flex-shrink-0">
                          <Truck className="h-4 w-4" />
                        </span>
                        <span className="text-xs font-bold text-slate-800 whitespace-nowrap">{v.type}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs font-mono font-bold text-slate-600 whitespace-nowrap">{v.plate}</td>
                    <td className="px-5 py-3.5 text-xs font-semibold text-slate-600 whitespace-nowrap">{v.driverName ?? "—"}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex text-[12px] font-extrabold px-2 py-0.5 rounded-full border ${statusChip(v.status)}`}>
                        {statusLabel(v.status)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs font-mono font-bold text-slate-700 whitespace-nowrap">{v.distanceTodayKm} km</td>
                    <td className="px-5 py-3.5 text-xs font-mono font-bold text-slate-700 whitespace-nowrap">{v.hoursActiveToday} jam</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-slate-200/70 flex items-center justify-between text-[12px] font-semibold text-slate-400">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" /> Area operasi: Jabodetabek
            </span>
            <span>Menampilkan {vehicleRows.length} kendaraan</span>
          </div>
        </div>
      </Section>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import Section from "@/components/layout/section";
import PageHeader from "@/components/layout/page-header";
import { useDevices } from "@/hooks/use-devices";
import { timeAgo } from "@/lib/format";
import { HardDrive, Wifi, WifiOff, BatteryLow, Search, Droplets, Zap, Video, Waves, ThermometerSun, Truck } from "lucide-react";

const typeIcon = (t: string) => {
  if (t.includes("Water")) return <Droplets className="h-4 w-4" />;
  if (t.includes("Power")) return <Zap className="h-4 w-4" />;
  if (t.includes("CCTV")) return <Video className="h-4 w-4" />;
  if (t.includes("Flood")) return <Waves className="h-4 w-4" />;
  if (t.includes("GPS")) return <Truck className="h-4 w-4" />;
  return <ThermometerSun className="h-4 w-4" />;
};

const batteryColor = (b: number) => (b > 50 ? "bg-emerald-500" : b > 20 ? "bg-amber-500" : "bg-brand-red");

export default function DevicesPage() {
  const { data: devices } = useDevices();
  const [q, setQ] = useState("");

  const all = devices ?? [];
  const list = all.filter(
    (d) =>
      d.id.toLowerCase().includes(q.toLowerCase()) ||
      d.type.toLowerCase().includes(q.toLowerCase()) ||
      d.location.toLowerCase().includes(q.toLowerCase())
  );

  const onlineCount = all.filter((d) => d.status === "online").length;
  const offlineCount = all.filter((d) => d.status === "offline").length;
  const lowBatteryCount = all.filter((d) => d.battery != null && d.battery < 20).length;
  const onlinePct = all.length ? ((onlineCount / all.length) * 100).toFixed(1) : "0";

  const tiles = [
    { label: "Total Perangkat", value: all.length, icon: <HardDrive className="h-5 w-5 text-slate-500" />, bg: "bg-slate-100" },
    { label: "Online", value: onlineCount, icon: <Wifi className="h-5 w-5 text-emerald-500" />, bg: "bg-emerald-50" },
    { label: "Offline", value: offlineCount, icon: <WifiOff className="h-5 w-5 text-brand-red" />, bg: "bg-red-50" },
    { label: "Baterai Lemah", value: lowBatteryCount, icon: <BatteryLow className="h-5 w-5 text-amber-500" />, bg: "bg-amber-50" },
  ];

  return (
    <div className="space-y-6 pb-4">
      <PageHeader
        title="Devices"
        subtitle="Inventaris & kesehatan seluruh perangkat IoT di lapangan"
        right={
          <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 text-[12px] font-bold px-2.5 py-1 rounded-full border border-emerald-100 uppercase tracking-wider">
            <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" /> {onlinePct}% Online
          </span>
        }
      />

      {/* 1. Ringkasan */}
      <Section num={1} title="Kesehatan Perangkat">
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {tiles.map((t) => (
            <div key={t.label} className="bg-white/60 backdrop-blur-md border border-slate-300/80 rounded-2xl p-5 shadow-sm flex items-center gap-4">
              <div className={`h-11 w-11 rounded-xl ${t.bg} flex items-center justify-center flex-shrink-0`}>{t.icon}</div>
              <div>
                <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wide block">{t.label}</span>
                <h4 className="text-2xl font-extrabold text-slate-800 font-mono leading-none mt-1">{t.value}</h4>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* 2. Inventaris */}
      <Section num={2} title="Inventaris Perangkat">
        <div className="bg-white/60 backdrop-blur-md border border-slate-300/80 rounded-2xl shadow-sm overflow-hidden">
          {/* Search */}
          <div className="px-5 py-3.5 border-b border-slate-200/70 bg-slate-50/50">
            <div className="relative max-w-sm">
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Cari ID, tipe, atau lokasi perangkat..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red placeholder-slate-400 text-slate-700"
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200/70">
                  {["Perangkat", "Tipe", "Lokasi", "Status", "Baterai", "Sinyal", "Update Terakhir"].map((h) => (
                    <th key={h} className="px-5 py-3 text-[12px] font-extrabold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {list.map((d) => (
                  <tr key={d.id} className="hover:bg-white/60 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          d.status === "online" ? "bg-red-50 text-brand-red" : "bg-slate-100 text-slate-400"
                        }`}>
                          {typeIcon(d.type)}
                        </span>
                        <span className="text-xs font-mono font-extrabold text-slate-800 whitespace-nowrap">{d.id}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs font-semibold text-slate-600 whitespace-nowrap">{d.type}</td>
                    <td className="px-5 py-3 text-xs font-semibold text-slate-500 whitespace-nowrap">{d.location}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1.5 text-[12px] font-extrabold px-2 py-0.5 rounded-full border ${
                        d.status === "online"
                          ? "text-emerald-600 bg-emerald-50 border-emerald-100"
                          : "text-brand-red bg-red-50 border-red-200"
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${d.status === "online" ? "bg-emerald-500" : "bg-brand-red"}`} />
                        {d.status === "online" ? "Online" : "Offline"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {d.battery === null ? (
                        <span className="text-[12px] font-semibold text-slate-400">AC Power</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="w-14 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${batteryColor(d.battery)}`} style={{ width: `${d.battery}%` }} />
                          </div>
                          <span className="text-[12px] font-mono font-bold text-slate-600">{d.battery}%</span>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs font-mono font-bold text-slate-500 whitespace-nowrap">{d.signal}</td>
                    <td className="px-5 py-3 text-[13px] font-semibold text-slate-400 whitespace-nowrap">{timeAgo(d.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-slate-200/70 text-[12px] font-semibold text-slate-400">
            Menampilkan {list.length} dari {all.length} perangkat terdaftar
          </div>
        </div>
      </Section>
    </div>
  );
}

"use client";

import React from "react";
import Section from "@/components/layout/section";
import PageHeader from "@/components/layout/page-header";
import EnvironmentGrid from "@/components/widgets/environment-grid";
import { roomThresholds } from "@/config/theme";
import { ThermometerSun, Server, Warehouse, Briefcase, Snowflake, FlaskConical, DoorClosed } from "lucide-react";

const rooms = [
  { name: "Server Room", temp: "22,1°C", hum: "45%", status: "Normal", ok: true, icon: <Server className="h-5 w-5" /> },
  { name: "Gudang A", temp: "28,4°C", hum: "65%", status: "Waspada", ok: false, icon: <Warehouse className="h-5 w-5" /> },
  { name: "Office Lt. 1", temp: "24,0°C", hum: "55%", status: "Normal", ok: true, icon: <Briefcase className="h-5 w-5" /> },
  { name: "Cold Storage", temp: "-2,1°C", hum: "88%", status: "Normal", ok: true, icon: <Snowflake className="h-5 w-5" /> },
  { name: "Laboratorium", temp: "20,5°C", hum: "40%", status: "Normal", ok: true, icon: <FlaskConical className="h-5 w-5" /> },
  { name: "Ruang Panel", temp: "31,2°C", hum: "42%", status: "Waspada", ok: false, icon: <DoorClosed className="h-5 w-5" /> },
];

const thresholdLabels: Record<string, string> = {
  server_room: "Server Room",
  warehouse: "Gudang",
  office: "Office",
  cold_storage: "Cold Storage",
  lab: "Laboratorium",
};

export default function TempHumPage() {
  return (
    <div className="space-y-6 pb-4">
      <PageHeader
        title="TempHum & Kualitas Udara"
        subtitle="Pemantauan suhu, kelembapan & kualitas udara ruangan kritikal"
        right={
          <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-100 uppercase tracking-wider">
            <ThermometerSun className="h-3 w-3" /> 12 Sensor Aktif
          </span>
        }
      />

      {/* 1. Ringkasan + Ruangan */}
      <Section num={1} title="Kondisi Lingkungan & Status Ruangan">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <EnvironmentGrid />
          <div className="xl:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {rooms.map((r) => (
              <div
                key={r.name}
                className={`rounded-2xl border backdrop-blur-md p-4 shadow-sm flex items-center justify-between gap-3 ${
                  r.ok ? "bg-white/45 border-white/70" : "bg-amber-50/70 border-amber-200"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    r.ok ? "bg-slate-50 text-slate-500 border border-slate-100" : "bg-amber-100 text-amber-600 border border-amber-200"
                  }`}>
                    {r.icon}
                  </span>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-800 block truncate">{r.name}</span>
                    <span className="text-[11px] font-mono font-bold text-slate-500 block mt-0.5">
                      {r.temp} · {r.hum}
                    </span>
                  </div>
                </div>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border flex-shrink-0 ${
                  r.ok ? "text-emerald-600 bg-emerald-50 border-emerald-100" : "text-amber-600 bg-amber-100 border-amber-200"
                }`}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* 2. Ambang Batas */}
      <Section num={2} title="Ambang Batas per Tipe Ruangan">
        <div className="bg-white/45 backdrop-blur-md border border-white/70 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200/70 bg-slate-50/50">
                  {["Tipe Ruangan", "Suhu Minimum", "Suhu Maksimum", "Kelembapan Min", "Kelembapan Maks"].map((h) => (
                    <th key={h} className="px-5 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.entries(roomThresholds).map(([key, t]) => (
                  <tr key={key} className="hover:bg-white/60 transition-colors">
                    <td className="px-5 py-3 text-xs font-bold text-slate-800">{thresholdLabels[key] ?? key}</td>
                    <td className="px-5 py-3 text-xs font-mono font-bold text-slate-600">{t.temp[0]}°C</td>
                    <td className="px-5 py-3 text-xs font-mono font-bold text-slate-600">{t.temp[1]}°C</td>
                    <td className="px-5 py-3 text-xs font-mono font-bold text-slate-600">{t.humidity[0]}%</td>
                    <td className="px-5 py-3 text-xs font-mono font-bold text-slate-600">{t.humidity[1]}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-slate-200/70 text-[10px] font-semibold text-slate-400">
            Pelanggaran ambang memicu notifikasi otomatis ke Alert Center dalam &lt; 30 detik.
          </div>
        </div>
      </Section>
    </div>
  );
}

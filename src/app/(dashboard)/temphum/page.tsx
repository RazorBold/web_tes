"use client";

import React from "react";
import Section from "@/components/layout/section";
import PageHeader from "@/components/layout/page-header";
import EnvironmentGrid from "@/components/widgets/environment-grid";
import { useRoomsWithStatus, useRoomTypes } from "@/hooks/use-temphum";
import { ThermometerSun, Server, Warehouse, Briefcase, Snowflake, FlaskConical, DoorClosed } from "lucide-react";

const roomIcon: Record<string, React.ReactNode> = {
  "Server Room": <Server className="h-5 w-5" />,
  "Gudang A": <Warehouse className="h-5 w-5" />,
  "Office Lt. 1": <Briefcase className="h-5 w-5" />,
  "Cold Storage": <Snowflake className="h-5 w-5" />,
  Laboratorium: <FlaskConical className="h-5 w-5" />,
};

export default function TempHumPage() {
  const { data: rooms } = useRoomsWithStatus();
  const { data: roomTypes } = useRoomTypes();

  return (
    <div className="space-y-6 pb-4">
      <PageHeader
        title="Environment Monitoring"
        subtitle="Pemantauan suhu, kelembapan & kualitas udara ruangan kritikal"
        right={
          <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 text-[12px] font-bold px-2.5 py-1 rounded-full border border-emerald-100 uppercase tracking-wider">
            <ThermometerSun className="h-3 w-3" /> {rooms ? `${rooms.length} Sensor Aktif` : "Memuat..."}
          </span>
        }
      />

      {/* 1. Ringkasan + Ruangan */}
      <Section num={1} title="Kondisi Lingkungan & Status Ruangan">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <EnvironmentGrid />
          <div className="xl:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(rooms ?? []).map((r) => (
              <div
                key={r.id}
                className={`rounded-2xl border backdrop-blur-md p-4 shadow-sm flex items-center justify-between gap-3 ${
                  r.ok ? "bg-white/45 border-white/70" : "bg-amber-50/70 border-amber-200"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    r.ok ? "bg-slate-50 text-slate-500 border border-slate-100" : "bg-amber-100 text-amber-600 border border-amber-200"
                  }`}>
                    {roomIcon[r.name] ?? <DoorClosed className="h-5 w-5" />}
                  </span>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-800 block truncate">{r.name}</span>
                    <span className="text-[13px] font-mono font-bold text-slate-500 block mt-0.5">
                      {r.temperature}°C · {r.humidity}%
                    </span>
                  </div>
                </div>
                <span className={`text-[12px] font-extrabold px-2 py-0.5 rounded-full border flex-shrink-0 ${
                  r.ok ? "text-emerald-600 bg-emerald-50 border-emerald-100" : "text-amber-600 bg-amber-100 border-amber-200"
                }`}>
                  {r.ok ? "Normal" : "Waspada"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* 2. Ambang Batas */}
      <Section num={2} title="Ambang Batas per Tipe Ruangan">
        <div className="bg-white/60 backdrop-blur-md border border-slate-300/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200/70 bg-slate-50/50">
                  {["Tipe Ruangan", "Suhu Minimum", "Suhu Maksimum", "Kelembapan Min", "Kelembapan Maks"].map((h) => (
                    <th key={h} className="px-5 py-3 text-[12px] font-extrabold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(roomTypes ?? []).map((t) => (
                  <tr key={t.id} className="hover:bg-white/60 transition-colors">
                    <td className="px-5 py-3 text-xs font-bold text-slate-800">{t.displayName}</td>
                    <td className="px-5 py-3 text-xs font-mono font-bold text-slate-600">{t.tempMin}°C</td>
                    <td className="px-5 py-3 text-xs font-mono font-bold text-slate-600">{t.tempMax}°C</td>
                    <td className="px-5 py-3 text-xs font-mono font-bold text-slate-600">{t.humidityMin}%</td>
                    <td className="px-5 py-3 text-xs font-mono font-bold text-slate-600">{t.humidityMax}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-slate-200/70 text-[12px] font-semibold text-slate-400">
            Pelanggaran ambang memicu notifikasi otomatis ke Alert Center dalam &lt; 30 detik.
          </div>
        </div>
      </Section>
    </div>
  );
}

"use client";

import React from "react";
import Section from "@/components/layout/section";
import PageHeader from "@/components/layout/page-header";
import FloodSmartMeter from "@/components/widgets/flood-smart-meter";
import { Waves, Bell, MessageSquareWarning, Megaphone, TrendingUp } from "lucide-react";

const gates = [
  { name: "Pintu Air Manggarai", level: "1.85 m", status: "Waspada (Siaga II)", type: "warn", rate: "+5 cm/jam" },
  { name: "Pintu Air Karet", level: "2.10 m", status: "Waspada (Siaga II)", type: "warn", rate: "+3 cm/jam" },
  { name: "Pintu Air Angke Hulu", level: "3.20 m", status: "Bahaya (Siaga I)", type: "danger", rate: "+12 cm/jam" },
  { name: "Pintu Air Pasar Ikan", level: "1.40 m", status: "Wajar (Siaga III)", type: "normal", rate: "+1 cm/jam" },
  { name: "Pintu Air Sunter Hulu", level: "0.90 m", status: "Normal (Siaga IV)", type: "good", rate: "-1 cm/jam" },
  { name: "Pintu Air Depok", level: "1.10 m", status: "Normal (Siaga IV)", type: "good", rate: "0 cm/jam" },
];

const gateStyle = (t: string) =>
  t === "danger"
    ? { card: "bg-red-50/80 border-red-200", chip: "bg-brand-red text-white", wave: "text-red-300" }
    : t === "warn"
    ? { card: "bg-amber-50/80 border-amber-200", chip: "bg-amber-500 text-white", wave: "text-amber-300" }
    : t === "normal"
    ? { card: "bg-orange-50/60 border-orange-100", chip: "bg-orange-400 text-white", wave: "text-orange-200" }
    : { card: "bg-emerald-50/70 border-emerald-100", chip: "bg-emerald-500 text-white", wave: "text-emerald-300" };

const legend = [
  { label: "Normal", range: "< 50 cm", color: "bg-emerald-500" },
  { label: "Waspada", range: "50 – 100 cm", color: "bg-yellow-400" },
  { label: "Siaga", range: "100 – 150 cm", color: "bg-orange-500" },
  { label: "Bahaya", range: "> 150 cm", color: "bg-brand-red" },
];

const escalations = [
  { icon: <Bell className="h-4 w-4 text-amber-500" />, level: "Waspada", action: "Notifikasi operator (in-app + push)" },
  { icon: <MessageSquareWarning className="h-4 w-4 text-orange-500" />, level: "Siaga", action: "Operator + admin (in-app + SMS)" },
  { icon: <Megaphone className="h-4 w-4 text-brand-red" />, level: "Bahaya", action: "Broadcast semua stakeholder (in-app + SMS + WA)" },
  { icon: <TrendingUp className="h-4 w-4 text-brand-red" />, level: "Kenaikan > 10 cm/jam", action: "Early warning tanpa menunggu ambang level" },
];

export default function FloodPage() {
  return (
    <div className="space-y-6 pb-4">
      <PageHeader
        title="Flood Smart Meter"
        subtitle="Sistem peringatan dini banjir & pemantauan pintu air DKI Jakarta"
        right={
          <span className="flex items-center gap-1.5 bg-amber-50 text-amber-600 text-[10px] font-bold px-2.5 py-1 rounded-full border border-amber-200 uppercase tracking-wider">
            <Waves className="h-3 w-3" /> Status Tertinggi: Siaga I
          </span>
        }
      />

      {/* 1. Status Pintu Air */}
      <Section num={1} title="Status Pintu Air Jakarta">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {gates.map((g) => {
            const s = gateStyle(g.type);
            return (
              <div key={g.name} className={`rounded-2xl border backdrop-blur-md p-4 shadow-sm flex items-start justify-between gap-3 ${s.card}`}>
                <div className="min-w-0">
                  <span className="text-[11px] font-bold text-slate-700 block truncate">{g.name}</span>
                  <h4 className="text-2xl font-extrabold text-slate-800 font-mono leading-none mt-2">{g.level}</h4>
                  <span className={`inline-flex text-[9px] font-extrabold px-2 py-0.5 rounded-full mt-2 ${s.chip}`}>{g.status}</span>
                  <span className="text-[10px] font-semibold text-slate-500 block mt-1.5 font-mono">{g.rate}</span>
                </div>
                <Waves className={`h-9 w-9 flex-shrink-0 ${s.wave}`} />
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 bg-white/45 backdrop-blur-md border border-white/70 rounded-2xl p-4 shadow-sm flex flex-wrap items-center gap-x-6 gap-y-2">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Ambang Level:</span>
          {legend.map((l) => (
            <span key={l.label} className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
              <span className={`h-2.5 w-2.5 rounded-full ${l.color}`} /> {l.label}
              <span className="text-slate-400 font-semibold">({l.range})</span>
            </span>
          ))}
        </div>
      </Section>

      {/* 2. Sensor Utama & Eskalasi */}
      <Section num={2} title="Sensor Utama & Prosedur Eskalasi">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <FloodSmartMeter />
          <div className="xl:col-span-2 bg-white/45 backdrop-blur-md border border-white/70 rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-slate-700 text-[11px] tracking-wider uppercase border-b border-slate-100 pb-2.5 mb-4">
              Alur Eskalasi Peringatan Dini
            </h3>
            <div className="space-y-3">
              {escalations.map((e) => (
                <div key={e.level} className="flex items-center gap-4 bg-slate-50/70 border border-slate-200 rounded-xl px-4 py-3">
                  <span className="h-9 w-9 rounded-lg bg-white border border-slate-100 flex items-center justify-center flex-shrink-0 shadow-sm">
                    {e.icon}
                  </span>
                  <div className="min-w-0">
                    <span className="text-xs font-extrabold text-slate-800 block">{e.level}</span>
                    <span className="text-[11px] font-medium text-slate-500">{e.action}</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10px] font-semibold text-slate-400 mt-4">
              Sesuai SOP Sumber Daya Air (SDA) DKI Jakarta · Data sensor diperbarui setiap 5 menit via LoRaWAN.
            </p>
          </div>
        </div>
      </Section>
    </div>
  );
}

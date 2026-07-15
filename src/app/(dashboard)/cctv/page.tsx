"use client";

import React, { useState } from "react";
import Section from "@/components/layout/section";
import PageHeader from "@/components/layout/page-header";
import CctvAnalyticsTabs from "@/components/widgets/cctv-analytics-tabs";
import { Video, MapPin, Users, Car, Package, Radar, ShieldAlert, CheckCircle2, Settings2 } from "lucide-react";

type AiMode = "people" | "crowd";

interface Cam {
  id: string;
  name: string;
  location: string;
  metricType: "people" | "vehicle" | "cargo";
  value: number;
  imageUrl: string;
  aiMode: AiMode;
  online: boolean;
  accuracy: string;
}

const cams: Cam[] = [
  { id: "1", name: "01. Lobby Utama", location: "Jakarta Pusat", metricType: "people", value: 126, aiMode: "people", online: true, accuracy: "98,2%", imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&h=500&q=80" },
  { id: "2", name: "02. Parkir Area", location: "Jakarta Pusat", metricType: "vehicle", value: 98, aiMode: "crowd", online: true, accuracy: "96,8%", imageUrl: "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&h=500&q=80" },
  { id: "3", name: "03. Main Gate", location: "Jakarta Selatan", metricType: "people", value: 78, aiMode: "people", online: true, accuracy: "97,5%", imageUrl: "https://images.unsplash.com/photo-1558036117-15d82a90b9b1?auto=format&fit=crop&w=800&h=500&q=80" },
  { id: "4", name: "04. Koridor Lt. 1", location: "Jakarta Timur", metricType: "people", value: 63, aiMode: "crowd", online: false, accuracy: "—", imageUrl: "https://images.unsplash.com/photo-1517502884422-41eaaced0168?auto=format&fit=crop&w=800&h=500&q=80" },
  { id: "5", name: "05. Pintu Barat In", location: "Jakarta Pusat", metricType: "vehicle", value: 45, aiMode: "crowd", online: true, accuracy: "95,4%", imageUrl: "https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&h=500&q=80" },
  { id: "6", name: "06. Loading Dock C", location: "Jakarta Selatan", metricType: "cargo", value: 12, aiMode: "people", online: true, accuracy: "97,1%", imageUrl: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&h=500&q=80" },
  { id: "7", name: "07. Koridor Lt. 3", location: "Jakarta Barat", metricType: "people", value: 29, aiMode: "people", online: true, accuracy: "98,0%", imageUrl: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&h=500&q=80" },
  { id: "8", name: "08. Area Genset/PLN", location: "Bekasi", metricType: "vehicle", value: 4, aiMode: "crowd", online: true, accuracy: "94,9%", imageUrl: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&h=500&q=80" },
];

const filters = ["Semua Lokasi", "Jakarta Pusat", "Jakarta Selatan", "Jakarta Timur", "Jakarta Barat", "Bekasi"];

const MetricIcon = ({ type }: { type: Cam["metricType"] }) => {
  const Icon = type === "people" ? Users : type === "vehicle" ? Car : Package;
  return <Icon className="h-3 w-3" />;
};

const aiChip = (mode: AiMode) =>
  mode === "people"
    ? { label: "People Counting", cls: "bg-emerald-50 text-emerald-600 border-emerald-100", icon: <Users className="h-3 w-3" /> }
    : { label: "Deteksi Kerumunan", cls: "bg-red-50 text-brand-red border-red-100", icon: <ShieldAlert className="h-3 w-3" /> };

export default function CctvPage() {
  const [filter, setFilter] = useState("Semua Lokasi");
  const list = cams.filter((c) => filter === "Semua Lokasi" || c.location === filter);
  const online = cams.filter((c) => c.online).length;

  return (
    <div className="space-y-6 pb-4">
      <PageHeader
        title="CCTV & AI Analytics"
        subtitle="Pemantauan visual & kecerdasan buatan terpusat di seluruh titik pantau"
        right={
          <span className="flex items-center gap-1.5 bg-red-50 text-brand-red text-[10px] font-bold px-2.5 py-1 rounded-full border border-red-100 uppercase tracking-wider">
            <span className="h-1.5 w-1.5 bg-brand-red rounded-full animate-pulse" /> {online}/{cams.length} Kamera Online
          </span>
        }
      />

      {/* 1. Kamera wall */}
      <Section num={1} title="Semua Kamera">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-3">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1 text-[10px] font-bold rounded-md border transition-all whitespace-nowrap cursor-pointer ${
                filter === f ? "bg-brand-red border-brand-red text-white shadow-sm" : "bg-white/70 border-slate-200 text-slate-500 hover:bg-white"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {list.map((cam) => (
            <div key={cam.id} className="relative rounded-xl overflow-hidden group cursor-pointer bg-slate-900 border border-slate-200 shadow-sm aspect-video">
              <img src={cam.imageUrl} alt={cam.name} className={`absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ${!cam.online && "grayscale opacity-40"}`} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/35" />
              <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                {cam.online ? (
                  <span className="flex items-center gap-1 bg-black/55 backdrop-blur-sm text-[8px] text-white font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">
                    <span className="h-1.5 w-1.5 bg-brand-red rounded-full animate-pulse" /> Live
                  </span>
                ) : (
                  <span className="bg-slate-700/80 text-[8px] text-white/70 font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">Offline</span>
                )}
                <span className={`flex items-center gap-1 text-[8px] font-extrabold px-1.5 py-0.5 rounded text-white ${cam.aiMode === "people" ? "bg-emerald-500/80" : "bg-red-500/80"}`}>
                  <Radar className="h-2.5 w-2.5" /> AI
                </span>
              </div>
              <div className="absolute inset-x-0 bottom-0 p-3">
                <div className="flex items-end justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="font-bold text-white text-[11px] truncate">{cam.name}</h4>
                    <span className="flex items-center gap-1 text-white/60 text-[9px] mt-0.5">
                      <MapPin className="h-2.5 w-2.5" /> {cam.location}
                    </span>
                  </div>
                  <span className="flex items-center gap-1 bg-black/55 text-white text-[10px] font-bold font-mono px-1.5 py-0.5 rounded">
                    <MetricIcon type={cam.metricType} /> {cam.value}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* 2. Analitik */}
      <Section num={2} title="Analitik AI">
        <CctvAnalyticsTabs />
      </Section>

      {/* 3. AI Management */}
      <Section num={3} title="AI Management — Penugasan AI per Kamera">
        <div className="bg-white/45 backdrop-blur-md border border-white/70 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200/70 flex items-center gap-2 text-[11px] font-semibold text-slate-500 bg-slate-50/50">
            <Settings2 className="h-3.5 w-3.5 text-brand-red" />
            Setiap kamera hanya menjalankan 1 model AI. Perubahan penugasan berlaku real-time ke edge device.
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200/70">
                  {["Kamera", "Lokasi", "AI Terpasang", "Status", "Akurasi Model"].map((h) => (
                    <th key={h} className="px-5 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cams.map((cam) => {
                  const chip = aiChip(cam.aiMode);
                  return (
                    <tr key={cam.id} className="hover:bg-white/60 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="h-8 w-8 rounded-lg bg-red-50 text-brand-red flex items-center justify-center flex-shrink-0">
                            <Video className="h-4 w-4" />
                          </span>
                          <span className="text-xs font-bold text-slate-800 whitespace-nowrap">{cam.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-xs font-semibold text-slate-500 whitespace-nowrap">{cam.location}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${chip.cls}`}>
                          {chip.icon} {chip.label}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {cam.online ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-600">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-slate-400">
                            <span className="h-2 w-2 rounded-full bg-slate-300" /> Offline
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-xs font-mono font-bold text-slate-700">{cam.accuracy}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </Section>
    </div>
  );
}

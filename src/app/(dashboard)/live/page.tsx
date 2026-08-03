"use client";

import React from "react";
import Section from "@/components/layout/section";
import PageHeader from "@/components/layout/page-header";
import { Monitor, Video, Wifi, Radar, MapPin, Users, Car, Package } from "lucide-react";
import { cams as allCams } from "@/config/cctv";

// Video wall hanya menampilkan kamera yang online; kamera mati ditampilkan
// terpisah di bawah. Sumber datanya katalog bersama di config/cctv.ts, bukan
// salinan lokal — dulu array di sini punya angka sendiri yang berbeda dari /cctv.
const cams = allCams.filter((c) => c.online);
const offlineCams = allCams.filter((c) => !c.online);

const tiles = [
  { label: "Kamera Terpasang", value: String(allCams.length), icon: <Video className="h-5 w-5 text-brand-red" />, bg: "bg-red-50" },
  { label: "Online", value: String(cams.length), icon: <Wifi className="h-5 w-5 text-emerald-500" />, bg: "bg-emerald-50" },
  { label: "AI Aktif", value: String(cams.filter((c) => c.aiModes.length > 0).length), icon: <Radar className="h-5 w-5 text-indigo-500" />, bg: "bg-indigo-50" },
  { label: "Uptime Stream", value: "99,7%", icon: <Monitor className="h-5 w-5 text-amber-500" />, bg: "bg-amber-50" },
];

const MetricIcon = ({ type }: { type: string }) => {
  const Icon = type === "people" ? Users : type === "vehicle" ? Car : Package;
  return <Icon className="h-3.5 w-3.5" />;
};

export default function LiveMonitoringPage() {
  return (
    <div className="space-y-6 pb-4">
      <PageHeader
        title="Live Monitoring"
        subtitle="Video wall pemantauan langsung seluruh titik kamera nasional"
        right={
          <span className="flex items-center gap-1.5 bg-red-50 text-brand-red text-[12px] font-bold px-2.5 py-1 rounded-full border border-red-100 uppercase tracking-wider">
            <span className="h-1.5 w-1.5 bg-brand-red rounded-full animate-pulse" /> Streaming Langsung
          </span>
        }
      />

      {/* 1. Status */}
      <Section num={1} title="Status Jaringan Kamera">
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

      {/* 2. Video Wall */}
      <Section num={2} title="Video Wall">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {cams.map((cam) => (
            <div key={cam.id} className="relative rounded-xl overflow-hidden group cursor-pointer bg-slate-900 border border-slate-200 shadow-sm aspect-video">
              <img src={cam.imageUrl} alt={cam.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/35" />
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                <span className="flex items-center gap-1.5 bg-black/55 backdrop-blur-sm text-[11px] text-white font-extrabold px-2 py-1 rounded-md uppercase tracking-wider">
                  <span className="h-1.5 w-1.5 bg-brand-red rounded-full animate-pulse" /> Live
                </span>
                <span className="bg-black/55 text-white/70 text-[11px] font-mono px-2 py-1 rounded-md">1080p</span>
              </div>
              <div className="absolute inset-x-0 bottom-0 p-3.5">
                <div className="flex items-end justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="font-bold text-white text-xs truncate">{cam.name}</h4>
                    <span className="flex items-center gap-1 text-white/60 text-[12px] mt-0.5">
                      <MapPin className="h-3 w-3" /> {cam.location}
                    </span>
                  </div>
                  <span className="flex items-center gap-1.5 bg-black/55 text-white text-[13px] font-bold font-mono px-2 py-1 rounded-md">
                    <MetricIcon type={cam.metricType} /> {cam.value}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {/* Kamera offline */}
          {offlineCams.map((cam) => (
            <div
              key={cam.id}
              className="relative rounded-xl overflow-hidden bg-slate-800 border border-slate-200 shadow-sm aspect-video flex flex-col items-center justify-center gap-2"
            >
              <Video className="h-8 w-8 text-slate-600" />
              <span className="text-[13px] font-bold text-slate-500">{cam.name} — Offline</span>
              <span className="text-[11px] font-semibold text-slate-600">{cam.location}</span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

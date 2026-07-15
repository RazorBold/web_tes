"use client";

import React from "react";
import Section from "@/components/layout/section";
import PageHeader from "@/components/layout/page-header";
import { Plug, Cloud, MessageCircle, MessageSquare, Radio, Satellite, CloudSun, Copy, KeyRound } from "lucide-react";

const integrations = [
  { name: "MQTT Broker", desc: "wss://mqtt.nusantara-iot.id:8084", status: "Terhubung", ok: true, icon: <Radio className="h-5 w-5 text-brand-red" />, bg: "bg-red-50" },
  { name: "BMKG Open API", desc: "data.bmkg.go.id — prakiraan cuaca", status: "Terhubung", ok: true, icon: <CloudSun className="h-5 w-5 text-blue-500" />, bg: "bg-blue-50" },
  { name: "ChirpStack LoRaWAN", desc: "Gateway sensor air, banjir & TempHum", status: "Terhubung", ok: true, icon: <Satellite className="h-5 w-5 text-indigo-500" />, bg: "bg-indigo-50" },
  { name: "WhatsApp Business API", desc: "Broadcast lansiran Bahaya", status: "Terhubung", ok: true, icon: <MessageCircle className="h-5 w-5 text-emerald-500" />, bg: "bg-emerald-50" },
  { name: "SMS Gateway", desc: "Notifikasi Siaga (operator & admin)", status: "Gangguan", ok: false, icon: <MessageSquare className="h-5 w-5 text-amber-500" />, bg: "bg-amber-50" },
  { name: "Sovereign Cloud Storage", desc: "Data center Indonesia — rekaman & backup", status: "Terhubung", ok: true, icon: <Cloud className="h-5 w-5 text-slate-500" />, bg: "bg-slate-100" },
];

const apiKeys = [
  { name: "Production API Key", key: "niot_prod_****************7a2f", created: "01 Jan 2026" },
  { name: "Read-only Dashboard Key", key: "niot_read_****************3c91", created: "15 Mar 2026" },
];

export default function IntegrationsPage() {
  return (
    <div className="space-y-6 pb-4">
      <PageHeader
        title="Integrations"
        subtitle="Koneksi layanan eksternal, protokol & kunci API platform"
        right={
          <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-100 uppercase tracking-wider">
            <Plug className="h-3 w-3" /> 5/6 Layanan Sehat
          </span>
        }
      />

      {/* 1. Layanan Terhubung */}
      <Section num={1} title="Layanan Terhubung">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {integrations.map((it) => (
            <div key={it.name} className="bg-white/45 backdrop-blur-md border border-white/70 rounded-2xl p-5 shadow-sm flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <div className={`h-11 w-11 rounded-xl ${it.bg} flex items-center justify-center flex-shrink-0`}>{it.icon}</div>
                <span className={`flex items-center gap-1.5 text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${
                  it.ok ? "text-emerald-600 bg-emerald-50 border-emerald-100" : "text-amber-600 bg-amber-50 border-amber-200"
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${it.ok ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                  {it.status}
                </span>
              </div>
              <h4 className="text-sm font-extrabold text-slate-800 mt-3">{it.name}</h4>
              <span className="text-[11px] font-medium text-slate-400 font-mono block mt-1 truncate">{it.desc}</span>
              <button className="mt-4 self-start px-3.5 py-1.5 text-[11px] font-bold text-slate-600 bg-white/80 border border-slate-200 rounded-lg hover:bg-white hover:text-brand-red hover:border-red-200 transition cursor-pointer">
                Kelola
              </button>
            </div>
          ))}
        </div>
      </Section>

      {/* 2. API Keys */}
      <Section num={2} title="Kunci API">
        <div className="bg-white/45 backdrop-blur-md border border-white/70 rounded-2xl shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {apiKeys.map((k) => (
              <div key={k.name} className="px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="h-9 w-9 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0">
                    <KeyRound className="h-4 w-4 text-brand-red" />
                  </span>
                  <div className="min-w-0">
                    <span className="text-xs font-extrabold text-slate-800 block">{k.name}</span>
                    <span className="text-[10px] font-semibold text-slate-400">Dibuat {k.created}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <code className="text-[11px] font-mono font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
                    {k.key}
                  </code>
                  <button className="h-8 w-8 rounded-lg bg-white/80 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-brand-red hover:border-red-200 transition cursor-pointer">
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 border-t border-slate-200/70 text-[10px] font-semibold text-slate-400">
            Kunci API tersimpan terenkripsi di Data Center Indonesia 🇮🇩 — jangan bagikan ke pihak eksternal.
          </div>
        </div>
      </Section>
    </div>
  );
}

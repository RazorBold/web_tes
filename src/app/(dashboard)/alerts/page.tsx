"use client";

import React, { useState } from "react";
import Section from "@/components/layout/section";
import PageHeader from "@/components/layout/page-header";
import { useAlerts } from "@/hooks/use-alerts";
import type { Alert } from "@/types/alert";
import { Bell, AlertTriangle, Info, CheckCheck, ArrowUpRight } from "lucide-react";

type Sev = Alert["severity"];

const sevMeta: Record<Sev, { label: string; chip: string; row: string; icon: React.ReactNode }> = {
  critical: {
    label: "Kritis",
    chip: "bg-red-50 text-brand-red border-red-200",
    row: "bg-red-50/60 border-red-100",
    icon: <AlertTriangle className="h-4 w-4 text-brand-red" />,
  },
  warning: {
    label: "Peringatan",
    chip: "bg-amber-50 text-amber-600 border-amber-200",
    row: "bg-amber-50/60 border-amber-100",
    icon: <AlertTriangle className="h-4 w-4 text-amber-500" />,
  },
  info: {
    label: "Info",
    chip: "bg-blue-50 text-blue-600 border-blue-200",
    row: "bg-blue-50/50 border-blue-100",
    icon: <Info className="h-4 w-4 text-blue-500" />,
  },
};

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

export default function AlertsPage() {
  const { data: alerts } = useAlerts();
  const [filter, setFilter] = useState<"all" | Sev>("all");

  const list = (alerts ?? []).filter((a) => filter === "all" || a.severity === filter);
  const counts = {
    critical: (alerts ?? []).filter((a) => a.severity === "critical").length,
    warning: (alerts ?? []).filter((a) => a.severity === "warning").length,
    info: (alerts ?? []).filter((a) => a.severity === "info").length,
  };

  const summary = [
    { key: "all", label: "Total Lansiran", value: alerts?.length ?? 0, cls: "bg-white/45 border-white/70", text: "text-slate-800" },
    { key: "critical", label: "Kritis", value: counts.critical, cls: "bg-red-50/70 border-red-200", text: "text-brand-red" },
    { key: "warning", label: "Peringatan", value: counts.warning, cls: "bg-amber-50/70 border-amber-200", text: "text-amber-600" },
    { key: "info", label: "Info", value: counts.info, cls: "bg-blue-50/70 border-blue-200", text: "text-blue-600" },
  ] as const;

  return (
    <div className="space-y-6 pb-4">
      <PageHeader
        title="Alert Center"
        subtitle="Pusat lansiran terpadu seluruh modul IoT — pantau, saring & tindak lanjuti"
        right={
          <span className="flex items-center gap-1.5 bg-red-50 text-brand-red text-[12px] font-bold px-2.5 py-1 rounded-full border border-red-100 uppercase tracking-wider">
            <Bell className="h-3 w-3" /> {counts.critical} Kritis Aktif
          </span>
        }
      />

      {/* 1. Ringkasan (klik untuk filter) */}
      <Section num={1} title="Ringkasan Lansiran Hari Ini">
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {summary.map((s) => (
            <button
              key={s.key}
              onClick={() => setFilter(s.key as "all" | Sev)}
              className={`rounded-2xl border backdrop-blur-md p-5 shadow-sm text-left transition-all cursor-pointer ${s.cls} ${
                filter === s.key ? "ring-2 ring-brand-red/40 scale-[1.01]" : "hover:shadow-md"
              }`}
            >
              <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wide block">{s.label}</span>
              <h4 className={`text-3xl font-extrabold font-mono leading-none mt-2 ${s.text}`}>{s.value}</h4>
              <span className="text-[12px] font-semibold text-slate-400 block mt-2">
                {filter === s.key ? "Sedang ditampilkan" : "Klik untuk saring"}
              </span>
            </button>
          ))}
        </div>
      </Section>

      {/* 2. Daftar */}
      <Section num={2} title="Daftar Lansiran">
        <div className="space-y-2.5">
          {list.map((a) => {
            const m = sevMeta[a.severity];
            return (
              <div key={a.id} className={`flex items-center justify-between gap-3 rounded-xl border backdrop-blur-md px-4 py-3 shadow-sm ${m.row}`}>
                <div className="flex items-center gap-3 min-w-0">
                  <span className="h-9 w-9 rounded-lg bg-white/80 border border-white flex items-center justify-center flex-shrink-0 shadow-sm">
                    {m.icon}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-slate-800 truncate">{a.title}</span>
                      <span className={`text-[11px] font-extrabold px-1.5 py-0.5 rounded-full border flex-shrink-0 ${m.chip}`}>{m.label}</span>
                    </div>
                    <span className="text-[12px] font-semibold text-slate-400 block mt-0.5 truncate">{a.sourceLabel}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-[13px] font-mono font-bold text-slate-500">{formatTime(a.createdAt)} WIB</span>
                  <button className="flex items-center gap-1 text-[12px] font-bold text-slate-500 bg-white/80 border border-slate-200 rounded-lg px-2.5 py-1.5 hover:bg-white hover:text-slate-800 transition cursor-pointer">
                    <CheckCheck className="h-3 w-3" /> Tandai
                  </button>
                  <button className="flex items-center gap-1 text-[12px] font-bold text-white bg-brand-red rounded-lg px-2.5 py-1.5 hover:bg-brand-red-hover transition cursor-pointer">
                    Tindak Lanjut <ArrowUpRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })}
          {list.length === 0 && (
            <div className="text-center py-10 text-xs font-bold text-slate-400 border border-dashed border-slate-300 rounded-xl">
              Tidak ada lansiran pada kategori ini.
            </div>
          )}
        </div>
      </Section>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Search, Bell, ChevronDown, User, AlertTriangle, Info, ChevronRight } from "lucide-react";
import { useAlerts } from "@/hooks/use-alerts";
import FullscreenButton from "@/components/layout/fullscreen-button";
import RestartServiceButton from "@/components/layout/restart-service-button";
import logoNavbar from "@/images/logonavbar.png";
import type { Alert } from "@/types/alert";

const sevBadge = (severity: Alert["severity"]) =>
  severity === "critical"
    ? "bg-brand-red text-white"
    : severity === "warning"
    ? "bg-amber-500 text-white"
    : "bg-blue-500 text-white";

const sevIcon = (severity: Alert["severity"]) =>
  severity === "info" ? <Info className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />;

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

export default function Topbar() {
  const [notifOpen, setNotifOpen] = useState(false);
  const { data: alerts } = useAlerts();
  const notifications = (alerts ?? []).slice(0, 5);

  return (
    <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between gap-6 px-8 sticky top-0 z-40">
      {/* Brand — logo Antares eazy lalu judul, dipisah garis tipis */}
      <div className="flex items-center gap-4 min-w-0">
        {/* Impor statis, bukan path /public: Next jadi tahu dimensi aslinya dan
            menyiapkan srcset sendiri. `h-11 w-auto` menjaga rasio logo apa pun
            nanti berkasnya diganti. */}
        <Image
          src={logoNavbar}
          alt="Antares eazy"
          priority
          className="h-11 w-auto object-contain flex-shrink-0"
        />

        <span className="h-10 w-px bg-slate-200 flex-shrink-0 hidden sm:block" />

        <div className="min-w-0">
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight leading-tight truncate">
            IoT <span className="text-brand-red">Merah Putih</span>
          </h2>
          <p className="text-[14px] text-slate-400 font-medium truncate">
            Smart Monitoring for a Smarter Indonesia
          </p>
        </div>
      </div>

      {/* Right Area */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block w-72 lg:w-80">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </span>
          <input
            type="text"
            placeholder="Cari perangkat, lokasi, atau dashboard..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-full text-[14px] bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-all placeholder-slate-400 text-slate-700"
          />
        </div>

        {/* Perawatan & layar penuh — ditaruh sebelum notifikasi supaya tidak
            menyela panel dropdown-nya yang muncul tepat di bawah lonceng. */}
        <RestartServiceButton />
        <FullscreenButton />

        {/* Notification */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="relative p-2.5 text-slate-500 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-4 w-4 bg-brand-red text-white text-[11px] font-bold rounded-full flex items-center justify-center border-2 border-white">
              {alerts?.length ?? 0}
            </span>
          </button>

          {notifOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 top-full mt-3 w-[380px] bg-white border border-slate-200/80 rounded-2xl shadow-xl shadow-slate-900/10 z-40 overflow-hidden animate-in fade-in slide-in-from-top-1 zoom-in-95 duration-150">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 bg-slate-50/60">
                  <div className="flex items-center gap-2">
                    <span className="h-8 w-8 rounded-full bg-red-50 flex items-center justify-center">
                      <Bell className="h-3.5 w-3.5 text-brand-red" />
                    </span>
                    <h4 className="font-extrabold text-slate-800 text-sm">Notifikasi</h4>
                  </div>
                  <span className="text-[12px] font-bold text-white bg-brand-red rounded-full px-2.5 py-1">
                    {alerts?.length ?? 0} Baru
                  </span>
                </div>

                {/* List */}
                <div className="max-h-[360px] overflow-y-auto scrollbar-thin">
                  {notifications.map((n, i) => (
                    <a
                      key={n.id}
                      href="/alerts"
                      className={`flex items-start gap-3 px-4 py-3.5 hover:bg-slate-50 transition-colors ${
                        i !== notifications.length - 1 ? "border-b border-slate-100" : ""
                      }`}
                    >
                      <span className={`h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${sevBadge(n.severity)}`}>
                        {sevIcon(n.severity)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[14px] font-bold text-slate-800 leading-tight">{n.title}</span>
                          <span className="text-[12px] font-mono font-semibold text-slate-400 flex-shrink-0 mt-0.5">{formatTime(n.createdAt)}</span>
                        </div>
                        <span className="text-[13px] text-slate-400 font-medium block mt-1 truncate">{n.sourceLabel}</span>
                      </div>
                    </a>
                  ))}
                </div>

                {/* Footer */}
                <a
                  href="/alerts"
                  onClick={() => setNotifOpen(false)}
                  className="flex items-center justify-center gap-1.5 text-xs font-bold text-brand-red hover:bg-red-50 transition-colors px-4 py-3.5 border-t border-slate-100"
                >
                  Lihat Semua Notifikasi <ChevronRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </>
          )}
        </div>

        {/* Locale */}
        <button className="flex items-center gap-1.5 px-2.5 py-2 hover:bg-slate-100 rounded-full transition-colors border border-slate-200">
          <span className="text-sm select-none leading-none">🇮🇩</span>
          <span className="text-[14px] font-bold text-slate-600">ID</span>
          <ChevronDown className="h-3 w-3 text-slate-400" />
        </button>

        {/* Date & time */}
        <div className="hidden lg:block text-right leading-tight border-l border-slate-200 pl-4">
          <span className="text-[14px] font-bold text-slate-700 block">Selasa, 14 Juli 2026</span>
          <span className="text-[13px] font-medium text-slate-400 font-mono">10:45 WIB</span>
        </div>

        {/* User */}
        <button className="flex items-center gap-2.5 group pl-2">
          <div className="h-10 w-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500">
            <User className="h-5 w-5" />
          </div>
          <div className="text-left leading-none hidden sm:block">
            <h4 className="text-[14px] font-bold text-slate-800 leading-tight">Syaiful R</h4>
            <span className="text-[13px] font-medium text-slate-400 mt-0.5 block">Admin</span>
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />
        </button>
      </div>
    </header>
  );
}

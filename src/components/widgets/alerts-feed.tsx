"use client";

import React from "react";
import { AlertTriangle, Info, ChevronRight } from "lucide-react";

interface AlertItem {
  id: string;
  title: string;
  location: string;
  time: string;
  severity: "critical" | "warning" | "info";
}

const initialAlerts: AlertItem[] = [
  {
    id: "1",
    title: "Power Meter Offline",
    location: "MTR-PWR-04 · Gedung B",
    time: "11:12",
    severity: "critical",
  },
  {
    id: "2",
    title: "High Water Level",
    location: "Flood · Titik D (Bahaya)",
    time: "11:05",
    severity: "critical",
  },
  {
    id: "3",
    title: "Penyusupan Area Vital",
    location: "CCTV · People Surveillance",
    time: "11:01",
    severity: "critical",
  },
  {
    id: "4",
    title: "Water Meter Offline",
    location: "Cikondang",
    time: "10:58",
    severity: "warning",
  },
  {
    id: "5",
    title: "Overspeed Detected",
    location: "Fleet · Toyota Hilux (B 5432 LPT)",
    time: "10:47",
    severity: "warning",
  },
  {
    id: "6",
    title: "Server Room Temp High",
    location: "TempHum · 29.4°C",
    time: "10:33",
    severity: "warning",
  },
  {
    id: "7",
    title: "Camera Offline",
    location: "CCTV · 04. Koridor Lt.1",
    time: "10:20",
    severity: "info",
  },
  {
    id: "8",
    title: "Batasan Area Dilanggar",
    location: "CCTV · People Surveillance",
    time: "10:15",
    severity: "warning",
  },
  {
    id: "9",
    title: "Pintu Terbuka Terlalu Lama",
    location: "CCTV · Ruang Kontrol",
    time: "10:05",
    severity: "info",
  },
  {
    id: "10",
    title: "Overcurrent Detected",
    location: "MTR-PWR-02 · Gardu 3",
    time: "09:55",
    severity: "warning",
  },
];

export default function AlertsFeed() {
  const getSeverityStyle = (severity: "critical" | "warning" | "info") => {
    switch (severity) {
      case "critical":
        return {
          bg: "bg-red-50 border-red-100",
          text: "text-brand-red",
          icon: <AlertTriangle className="h-4 w-4 text-brand-red" />,
        };
      case "warning":
        return {
          bg: "bg-amber-50 border-amber-100",
          text: "text-amber-600",
          icon: <AlertTriangle className="h-4 w-4 text-amber-500" />,
        };
      default:
        return {
          bg: "bg-blue-50 border-blue-100",
          text: "text-blue-600",
          icon: <Info className="h-4 w-4 text-blue-500" />,
        };
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between h-[220px]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <h3 className="font-bold text-slate-800 text-[11px] tracking-wider uppercase">
          Alerts
        </h3>
        <a
          href="/alerts"
          className="text-[10px] font-bold text-brand-red hover:text-brand-red-hover transition-colors flex items-center gap-0.5"
        >
          Lihat Semua <ChevronRight className="h-3 w-3" />
        </a>
      </div>

      {/* Alerts Feed items */}
      <div className="flex-1 flex flex-col justify-between py-1 mt-2 text-xs space-y-1 overflow-y-auto">
        {initialAlerts.map((alert) => {
          const style = getSeverityStyle(alert.severity);
          return (
            <div
              key={alert.id}
              className={`flex items-center justify-between p-2 rounded-lg border transition-all hover:scale-[1.01] ${style.bg}`}
            >
              <div className="flex items-center gap-2.5 max-w-[80%]">
                <div className="flex-shrink-0">{style.icon}</div>
                <div className="truncate">
                  <span className="font-extrabold text-slate-800 block leading-tight">
                    {alert.title}
                  </span>
                  <span className="text-[9px] font-semibold text-slate-400 block mt-0.5">
                    {alert.location}
                  </span>
                </div>
              </div>
              <span className="font-bold text-slate-500 font-mono text-[10px] flex-shrink-0">
                {alert.time}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

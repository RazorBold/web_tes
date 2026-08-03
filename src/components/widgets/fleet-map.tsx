"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import { Truck, Car, ArrowRight, X } from "lucide-react";
import { useFleetVehicles, useFleetOverview } from "@/hooks/use-fleet";
import { timeAgo } from "@/lib/format";
import type { MapVehicle } from "@/components/maps/base-map";
import type { FleetVehicle } from "@/types/fleet";

// Load Leaflet map on client-side only (avoid SSR window error)
const DynamicMap = dynamic(() => import("@/components/maps/base-map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center text-xs text-slate-400 font-bold border border-slate-100 rounded-lg animate-pulse">
      <span className="h-6 w-6 border-2 border-slate-300 border-t-brand-red rounded-full animate-spin mb-2"></span>
      Loading Interactive Map...
    </div>
  ),
});

const statusType = (status: FleetVehicle["status"]) =>
  status === "moving" ? "transit" : status === "idle" ? "idle" : "maint";

const statusLabel = (status: FleetVehicle["status"]) =>
  status === "moving"
    ? "Sedang berjalan"
    : status === "idle"
    ? "Idle"
    : "Perawatan";

const toMapVehicle = (v: FleetVehicle): MapVehicle | null => {
  const lat = Number(v.position?.lat);
  const lng = Number(v.position?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return {
    id: v.id,
    name: v.type,
    plate: v.plate,
    coords: [lat, lng],
    status: statusType(v.status),
    speed: Math.round(Number(v.position?.speed) || 0),
    driver: v.driverName,
  };
};

export default function FleetMap() {
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const { data: vehicles } = useFleetVehicles();
  const { data: overview } = useFleetOverview();

  const activities = (vehicles ?? []).slice(0, 10);
  const mapVehicles = useMemo(
    () => (vehicles ?? []).map(toMapVehicle).filter((v): v is MapVehicle => v !== null),
    [vehicles]
  );
  const kpis = [
    { label: "Total", value: overview?.total ?? "—", dot: "bg-slate-400", bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-800" },
    { label: "Berjalan", value: overview?.moving ?? "—", dot: "bg-emerald-500", bg: "bg-emerald-50/60", border: "border-emerald-100", text: "text-emerald-600" },
    { label: "Idle", value: overview?.idle ?? "—", dot: "bg-amber-500", bg: "bg-amber-50/60", border: "border-amber-100", text: "text-amber-600" },
    { label: "Perawatan", value: overview?.maintenance ?? "—", dot: "bg-brand-red", bg: "bg-red-50/60", border: "border-red-100", text: "text-brand-red" },
  ];

  return (
    <div className="bg-white/60 backdrop-blur-md border border-slate-300/80 rounded-2xl p-6 shadow-sm flex flex-col gap-4 h-[420px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0 shadow-sm border border-red-100/50">
            <Truck className="h-5 w-5 text-brand-red" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base leading-none">
              Fleet Tracking
            </h3>
            <p className="text-[13px] text-slate-400 font-medium mt-1">
              Pemantauan armada real-time
            </p>
          </div>
        </div>

        <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 text-[11px] font-bold px-2.5 py-1 rounded-full border border-emerald-100 uppercase tracking-wider">
          <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
          Live
        </span>
      </div>

      {/* KPI strip (4 columns) */}
      <div className="grid grid-cols-4 gap-2.5">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className={`rounded-lg border ${kpi.border} ${kpi.bg} px-3 py-2 flex flex-col gap-1.5`}
          >
            <div className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full flex-shrink-0 ${kpi.dot}`}></span>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                {kpi.label}
              </span>
            </div>
            <span className={`text-lg font-extrabold font-mono leading-none ${kpi.text}`}>
              {kpi.value}
            </span>
          </div>
        ))}
      </div>

      {/* Main split: map + activity */}
      <div className="flex-1 flex gap-5 overflow-hidden">
        {/* Leaflet Dynamic Map — fixed aspect ratio so it reads as a map tile, not a flat banner */}
        <div
          onClick={() => setIsMapOpen(true)}
          className="h-full aspect-[4/3] flex-shrink-0 rounded-xl overflow-hidden border border-slate-200 shadow-inner relative cursor-pointer group"
        >
          <DynamicMap vehicles={mapVehicles} compact />
          <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/15 transition-all flex items-center justify-center pointer-events-none">
            <span className="bg-white/95 text-slate-800 font-bold text-[12px] px-3 py-1.5 rounded-full shadow-lg border border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-center">
              🔍 Klik untuk Perbesar
            </span>
          </div>
        </div>

        {/* Recent Activity Panel */}
        <div className="flex-1 min-w-0 h-full flex flex-col border-l border-slate-100 pl-5">
          <h4 className="font-bold text-slate-700 text-[13px] tracking-wider uppercase pb-2.5 mb-1 border-b border-slate-100">
            Aktivitas Terbaru
          </h4>
          <div className="flex-1 overflow-y-auto -mr-2 pr-2 divide-y divide-slate-100 scrollbar-thin">
            {activities.map((item) => {
              const type = statusType(item.status);
              return (
                <div
                  key={item.id}
                  onClick={() => setIsMapOpen(true)}
                  className="flex gap-2.5 items-start py-2.5 px-1.5 -mx-1.5 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                >
                  {/* Vehicle icon per status */}
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${
                    type === "transit"
                      ? "bg-emerald-50 text-emerald-600 border-emerald-100/50"
                      : type === "idle"
                      ? "bg-amber-50 text-amber-600 border-amber-100/50"
                      : "bg-red-50 text-brand-red border-red-100/50"
                  } mt-0.5`}>
                    {item.type.toLowerCase().includes("car") || item.type.toLowerCase().includes("hr-v") || item.type.toLowerCase().includes("xpander") || item.type.toLowerCase().includes("sigra") || item.type.toLowerCase().includes("ioniq") ? (
                      <Car className="h-4 w-4" />
                    ) : (
                      <Truck className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0 w-full">
                    <div className="flex justify-between items-baseline gap-2">
                      <span className="font-bold text-slate-800 text-xs truncate leading-none">
                        {item.type}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400 font-mono flex-shrink-0">
                        {timeAgo(item.updatedAt)}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-slate-400 block mt-1">
                      {item.plate}
                    </span>
                    <span className="text-[12px] text-slate-500 truncate block mt-0.5">
                      {statusLabel(item.status)}{item.driverName ? ` · ${item.driverName}` : ""}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => setIsMapOpen(true)}
            className="text-[12px] font-bold text-brand-red hover:text-brand-red-hover transition-colors flex items-center justify-center gap-1 border-t border-slate-100 pt-3 mt-2 cursor-pointer w-full"
          >
            Lihat Semua <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Full-screen Map Modal Overlay */}
      {isMapOpen && mounted && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsMapOpen(false);
            }
          }}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-md z-[60] flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl w-full max-w-5xl h-[80vh] p-6 flex flex-col relative animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
            {/* Indonesian flag accent strip top */}
            <div className="absolute top-0 inset-x-0 h-1 flex flex-col">
              <div className="h-0.5 bg-brand-red w-full"></div>
              <div className="h-0.5 bg-white w-full"></div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setIsMapOpen(false)}
              className="absolute top-5 right-5 h-8 w-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-all border border-slate-100 z-10 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Modal Title */}
            <div className="mb-4">
              <h3 className="text-base font-extrabold text-slate-800 leading-tight">
                Peta Pelacakan Armada Real-time
              </h3>
              <p className="text-[13px] text-slate-400 font-semibold mt-0.5">
                Pantau lokasi kendaraan Daihatsu, Hyundai, Toyota, dan Mitsubishi secara presisi di seluruh rute Indonesia.
              </p>
            </div>

            {/* Large Leaflet Map inside Modal */}
            <div className="flex-1 min-h-0 w-full rounded-2xl overflow-hidden border border-slate-100 shadow-inner relative">
              <DynamicMap vehicles={mapVehicles} />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}


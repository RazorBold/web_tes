"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import { Truck, Car, X, Maximize2, MapPin } from "lucide-react";
import { useFleetVehicles, useFleetOverview } from "@/hooks/use-fleet";
import { timeAgo } from "@/lib/format";
import type { MapVehicle } from "@/components/maps/base-map";
import type { FleetVehicle } from "@/types/fleet";

const DynamicMap = dynamic(() => import("@/components/maps/base-map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center text-xs text-slate-400 font-bold border border-slate-100 rounded-lg animate-pulse">
      <span className="h-6 w-6 border-2 border-slate-300 border-t-brand-red rounded-full animate-spin mb-2"></span>
      Loading Interactive Map...
    </div>
  ),
});

// ⬇️ UBAH DI SINI untuk mengatur TINGGI kartu Fleet Tracking (samakan dengan
//    kartu Water agar baris 2 sejajar). Nilai dalam pixel, mis. "h-[420px]".
const CARD_HEIGHT = "h-[420px]";

type StatusKey = FleetVehicle["status"];

const statusLabel = (status: string) =>
  status === "moving" ? "Berjalan" : status === "idle" ? "Idle" : "Perawatan";

const statusChip = (status: string) =>
  status === "moving"
    ? "bg-emerald-50 text-emerald-600 border-emerald-100"
    : status === "idle"
    ? "bg-amber-50 text-amber-600 border-amber-100"
    : "bg-red-50 text-brand-red border-red-100";

const statusDot = (status: string) =>
  status === "moving" ? "bg-emerald-500" : status === "idle" ? "bg-amber-500" : "bg-brand-red";

const isCarLike = (type: string) =>
  /car|hr-v|xpander|sigra|ioniq|avanza|air ev|brio|innova/i.test(type);

const toMapVehicle = (v: FleetVehicle): MapVehicle | null => {
  const lat = Number(v.position?.lat);
  const lng = Number(v.position?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return {
    id: v.id,
    name: v.type,
    plate: v.plate,
    coords: [lat, lng],
    status: v.status === "moving" ? "transit" : v.status === "idle" ? "idle" : "maint",
    speed: Math.round(Number(v.position?.speed) || 0),
    driver: v.driverName,
  };
};

const legend = [
  { label: "Berjalan", color: "bg-emerald-500" },
  { label: "Idle", color: "bg-amber-500" },
  { label: "Perawatan", color: "bg-brand-red" },
];

export default function FleetTrackingDetailed() {
  const { data: vehicles, isLoading } = useFleetVehicles();
  const { data: overview } = useFleetOverview();
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState<StatusKey | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);
  useEffect(() => setMounted(true), []);

  const all = useMemo(() => vehicles ?? [], [vehicles]);
  const visible = useMemo(
    () => (filter ? all.filter((v) => v.status === filter) : all),
    [all, filter]
  );

  // Only the rows currently listed are plotted, so filtering the list filters the map too.
  const mapVehicles = useMemo(
    () => visible.map(toMapVehicle).filter((v): v is MapVehicle => v !== null),
    [visible]
  );

  const kpis: { label: string; value: number | string; key: StatusKey | null; dot: string; bg: string; border: string; text: string; ring: string }[] = [
    { label: "Total", value: overview?.total ?? "—", key: null, dot: "bg-slate-400", bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-800", ring: "ring-slate-300" },
    { label: "Berjalan", value: overview?.moving ?? "—", key: "moving", dot: "bg-emerald-500", bg: "bg-emerald-50/60", border: "border-emerald-100", text: "text-emerald-600", ring: "ring-emerald-400" },
    { label: "Idle", value: overview?.idle ?? "—", key: "idle", dot: "bg-amber-500", bg: "bg-amber-50/60", border: "border-amber-100", text: "text-amber-600", ring: "ring-amber-400" },
    { label: "Perawatan", value: overview?.maintenance ?? "—", key: "maintenance", dot: "bg-brand-red", bg: "bg-red-50/60", border: "border-red-100", text: "text-brand-red", ring: "ring-red-400" },
  ];

  const openMap = (id?: string) => {
    setFocusId(id ?? null);
    setIsMapOpen(true);
  };

  const closeMap = () => {
    setIsMapOpen(false);
    setFocusId(null);
  };

  return (
    <div
      className={`bg-white/60 backdrop-blur-md border border-slate-300/80 rounded-2xl p-5 shadow-sm flex flex-col gap-3 overflow-hidden ${CARD_HEIGHT}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0 shadow-sm border border-red-100/50">
            <Truck className="h-5 w-5 text-brand-red" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-slate-800 text-base leading-none">Fleet Tracking</h3>
            <p className="text-[13px] text-slate-400 font-medium mt-1 truncate">
              Pemantauan armada &amp; daftar kendaraan real-time
            </p>
          </div>
        </div>
        <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 text-[11px] font-bold px-2.5 py-1 rounded-full border border-emerald-100 uppercase tracking-wider flex-shrink-0">
          <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
          Live
        </span>
      </div>

      {/* KPI strip — klik untuk menyaring daftar & peta */}
      <div className="grid grid-cols-4 gap-2.5 flex-shrink-0">
        {kpis.map((kpi) => {
          const active = filter === kpi.key;
          return (
            <button
              key={kpi.label}
              type="button"
              onClick={() => setFilter(kpi.key)}
              aria-pressed={active}
              className={`rounded-lg border ${kpi.border} ${kpi.bg} px-3 py-2 flex flex-col gap-1.5 text-left transition-all cursor-pointer hover:brightness-[0.98] ${
                active ? `ring-2 ${kpi.ring} ring-offset-1` : ""
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full flex-shrink-0 ${kpi.dot}`}></span>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide truncate">
                  {kpi.label}
                </span>
              </div>
              <span className={`text-lg font-extrabold font-mono leading-none ${kpi.text}`}>
                {kpi.value}
              </span>
            </button>
          );
        })}
      </div>

      {/* Map + full vehicle list.
          ⬇️ Ubah "lg:col-span-2" (peta) & "lg:col-span-3" (daftar) di bawah untuk
             mengatur lebar peta vs daftar kendaraan. Totalnya harus 5.
          `grid-rows-[minmax(0,1fr)]` menjaga baris tetap setinggi kartu — tanpa itu
          daftar kendaraan memanjang dan tembus keluar batas kartu. */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-5 grid-rows-[minmax(0,1fr)] gap-4">
        <div
          onClick={() => openMap()}
          className="lg:col-span-2 min-h-[140px] min-w-0 rounded-xl overflow-hidden border border-slate-200 shadow-inner relative cursor-pointer group"
        >
          {/* Hovering a row in the list makes that unit's marker stand out here. */}
          <DynamicMap vehicles={mapVehicles} focusId={focusId} compact />

          {/* Unit terpantau */}
          <div className="absolute top-2 left-2 z-[2] flex items-center gap-1 bg-white/90 backdrop-blur-sm text-slate-700 text-[11px] font-bold px-2 py-1 rounded-full border border-slate-200/80 shadow-sm pointer-events-none">
            <MapPin className="h-2.5 w-2.5 text-brand-red" />
            {mapVehicles.length} unit terpantau
          </div>

          {/* Legenda status */}
          <div className="absolute bottom-2 left-2 right-2 z-[2] flex flex-wrap items-center gap-x-2.5 gap-y-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg border border-slate-200/80 shadow-sm pointer-events-none">
            {legend.map((l) => (
              <span key={l.label} className="flex items-center gap-1 text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                <span className={`h-1.5 w-1.5 rounded-full ${l.color}`}></span>
                {l.label}
              </span>
            ))}
          </div>

          <div className="absolute inset-0 z-[2] bg-slate-950/0 group-hover:bg-slate-950/15 transition-all flex items-center justify-center pointer-events-none">
            <span className="bg-white/95 text-slate-800 font-bold text-[12px] px-3 py-1.5 rounded-full shadow-lg border border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5">
              <Maximize2 className="h-3 w-3" /> Klik untuk Perbesar
            </span>
          </div>
        </div>

        <div className="lg:col-span-3 min-w-0 min-h-0 flex flex-col lg:border-l border-slate-100 lg:pl-5">
          <div className="flex items-center justify-between pb-2.5 mb-1 border-b border-slate-100 flex-shrink-0">
            <h4 className="font-bold text-slate-700 text-[13px] tracking-wider uppercase">
              Daftar Kendaraan ({visible.length})
            </h4>
            {filter && (
              <button
                type="button"
                onClick={() => setFilter(null)}
                className="text-[11px] font-bold text-brand-red hover:text-brand-red-hover uppercase tracking-wide cursor-pointer"
              >
                Reset filter
              </button>
            )}
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto -mr-2 pr-2 divide-y divide-slate-100 scrollbar-thin">
            {isLoading && (
              <div className="h-full flex items-center justify-center text-[13px] font-bold text-slate-300">
                Memuat data armada…
              </div>
            )}

            {!isLoading && visible.length === 0 && (
              <div className="h-full flex items-center justify-center text-[13px] font-bold text-slate-300">
                Tidak ada kendaraan pada status ini.
              </div>
            )}

            {visible.map((v) => {
              const Icon = isCarLike(v.type) ? Car : Truck;
              return (
                <div
                  key={v.id}
                  onClick={() => openMap(v.id)}
                  onMouseEnter={() => setFocusId(v.id)}
                  onMouseLeave={() => setFocusId(null)}
                  className="flex items-center justify-between gap-2 py-2.5 px-1.5 -mx-1.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className="relative flex-shrink-0">
                      <span className="h-7 w-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500">
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span
                        className={`absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full ring-2 ring-white ${statusDot(v.status)}`}
                      ></span>
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold text-slate-800 text-xs truncate">{v.type}</span>
                        <span className="text-[11px] font-mono font-semibold text-slate-400 flex-shrink-0">
                          {v.plate}
                        </span>
                      </div>
                      <span className="text-[12px] text-slate-500 block mt-0.5 truncate">
                        {v.driverName ?? "—"} · {timeAgo(v.updatedAt)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 flex items-center gap-2.5">
                    <span
                      className={`inline-flex text-[11px] font-extrabold px-2 py-0.5 rounded-full border ${statusChip(v.status)}`}
                    >
                      {statusLabel(v.status)}
                    </span>
                    <span className="text-[12px] font-mono font-bold text-slate-600 w-14 text-right">
                      {v.distanceTodayKm} km
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Full-screen Map Modal */}
      {isMapOpen && mounted && createPortal(
        <div
          onClick={(e) => e.target === e.currentTarget && closeMap()}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-md z-[60] flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl w-full max-w-5xl h-[80vh] p-6 flex flex-col relative animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 flex flex-col">
              <div className="h-0.5 bg-brand-red w-full"></div>
              <div className="h-0.5 bg-white w-full"></div>
            </div>
            <button
              onClick={closeMap}
              className="absolute top-5 right-5 h-8 w-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-all border border-slate-100 z-10 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="mb-4 pr-10">
              <h3 className="text-base font-extrabold text-slate-800 leading-tight">
                Peta Pelacakan Armada Real-time
              </h3>
              <p className="text-[13px] text-slate-400 font-semibold mt-0.5">
                {mapVehicles.length} kendaraan terpantau
                {filter ? ` · status ${statusLabel(filter).toLowerCase()}` : ""}. Klik penanda untuk detail unit.
              </p>
            </div>
            <div className="flex-1 min-h-0 w-full rounded-2xl overflow-hidden border border-slate-100 shadow-inner relative">
              <DynamicMap vehicles={mapVehicles} focusId={focusId} />
              <div className="absolute bottom-3 left-3 z-[500] flex items-center gap-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-sm">
                {legend.map((l) => (
                  <span key={l.label} className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                    <span className={`h-2 w-2 rounded-full ${l.color}`}></span>
                    {l.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import {
  ChevronRight,
  Maximize2,
  MapPin,
  Users,
  Car,
  Package,
  Video,
  X,
  Activity,
  UserCheck,
  Radar,
  Settings2,
  ScanFace,
  VenusAndMars,
  Smile,
  Flame,
} from "lucide-react";
import { cams, camLocations, AI_MODELS, type AiMode } from "@/config/cctv";
import AiModeIcon from "@/components/widgets/ai-mode-icon";

interface CameraFeed {
  id: string;
  name: string;
  location: string;
  metricType: "people" | "vehicle" | "cargo";
  value: number;
  imageUrl: string;
  aiMode: AiMode; // default AI focus for this camera
}

// Diturunkan dari katalog kamera bersama, bukan disalin ulang — dulu array ini
// punya angka sendiri (126/98/78/63) sehingga kamera yang sama melaporkan jumlah
// berbeda antara dashboard ini dan halaman /cctv. Hanya kamera online yang
// ditampilkan: kamera mati tidak mengirim frame.
const initialFeeds: CameraFeed[] = cams
  .filter((c) => c.online)
  .slice(0, 4)
  .map((c) => ({
    id: c.id,
    name: c.name,
    location: c.location,
    metricType: c.metricType,
    value: c.value,
    imageUrl: c.imageUrl,
    aiMode: c.aiModes[0],
  }));

const filters = camLocations;

function MetricBadge({ type, value }: { type: CameraFeed["metricType"]; value: number }) {
  const Icon = type === "people" ? Users : type === "vehicle" ? Car : Package;
  return (
    <span className="flex items-center gap-1.5 bg-black/55 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-lg border border-white/15">
      <Icon className="h-3.5 w-3.5" />
      <span className="font-mono">{value}</span>
    </span>
  );
}

/* ---------- AI overlay detection boxes ---------- */
const peopleBoxes = [
  { top: "42%", left: "12%", w: "12%", h: "34%", label: "Orang · 98%" },
  { top: "38%", left: "34%", w: "11%", h: "40%", label: "Orang · 96%" },
  { top: "46%", left: "58%", w: "10%", h: "30%", label: "Orang · 94%" },
  { top: "40%", left: "74%", w: "12%", h: "36%", label: "Orang · 97%" },
];

const genderBoxes = [
  { top: "42%", left: "12%", w: "12%", h: "34%", label: "Pria · 95%" },
  { top: "38%", left: "34%", w: "11%", h: "40%", label: "Wanita · 93%" },
  { top: "46%", left: "58%", w: "10%", h: "30%", label: "Pria · 96%" },
  { top: "40%", left: "74%", w: "12%", h: "36%", label: "Wanita · 94%" },
];

const moodBoxes = [
  { top: "42%", left: "12%", w: "12%", h: "34%", label: "Senang" },
  { top: "38%", left: "34%", w: "11%", h: "40%", label: "Netral" },
  { top: "46%", left: "58%", w: "10%", h: "30%", label: "Senang" },
  { top: "40%", left: "74%", w: "12%", h: "36%", label: "Netral" },
];

// Face recognition memakai posisi kotak yang sama dengan gender/mood — ketiganya
// "melihat" wajah orang yang sama di frame; yang berbeda hanya label hasilnya.
// Wajah yang tidak dikenali sengaja disertakan: sistem pengenalan yang selalu
// 100% cocok tidak realistis.
const faceBoxes = [
  { top: "42%", left: "12%", w: "12%", h: "34%", label: "ID B9432 · 98%" },
  { top: "38%", left: "34%", w: "11%", h: "40%", label: "ID A2071 · 95%" },
  { top: "46%", left: "58%", w: "10%", h: "30%", label: "Tidak Dikenal" },
  { top: "40%", left: "74%", w: "12%", h: "36%", label: "ID C5518 · 93%" },
];

// Crowd density levels (rame / sedang / sepi)
const LEVELS = {
  rame: { label: "Rame", blob: "bg-red-500/25 border-red-400", chip: "bg-red-500 text-white", badge: "bg-red-100 text-red-600", bar: "#EF4444" },
  sedang: { label: "Sedang", blob: "bg-amber-500/25 border-amber-400", chip: "bg-amber-500 text-white", badge: "bg-amber-100 text-amber-600", bar: "#F59E0B" },
  sepi: { label: "Sepi", blob: "bg-emerald-500/20 border-emerald-400", chip: "bg-emerald-500 text-white", badge: "bg-emerald-100 text-emerald-600", bar: "#10B981" },
} as const;
type Level = keyof typeof LEVELS;

const crowdZones: { top: string; left: string; w: string; h: string; level: Level }[] = [
  { top: "36%", left: "5%", w: "30%", h: "52%", level: "rame" },
  { top: "28%", left: "40%", w: "20%", h: "38%", level: "sedang" },
  { top: "44%", left: "66%", w: "27%", h: "44%", level: "sepi" },
];

const crowdAreas: { name: string; level: Level; pct: number }[] = [
  { name: "Zona Parkir A", level: "rame", pct: 82 },
  { name: "Jalur Tengah", level: "sedang", pct: 55 },
  { name: "Zona Parkir C", level: "sepi", pct: 24 },
  { name: "Pintu Keluar", level: "sedang", pct: 48 },
];

// Heatmap intensity levels (panas / sedang / rendah)
const HEAT = {
  panas: { label: "Panas", blob: "bg-red-500/30 border-red-400", chip: "bg-red-500 text-white", badge: "bg-red-100 text-red-600", bar: "#EF4444" },
  sedang: { label: "Sedang", blob: "bg-orange-500/25 border-orange-400", chip: "bg-orange-500 text-white", badge: "bg-orange-100 text-orange-600", bar: "#F97316" },
  rendah: { label: "Rendah", blob: "bg-yellow-400/20 border-yellow-300", chip: "bg-yellow-400 text-yellow-950", badge: "bg-yellow-100 text-yellow-700", bar: "#FACC15" },
} as const;
type HeatLevel = keyof typeof HEAT;

const heatZones: { top: string; left: string; w: string; h: string; level: HeatLevel }[] = [
  { top: "36%", left: "5%", w: "30%", h: "52%", level: "panas" },
  { top: "28%", left: "40%", w: "20%", h: "38%", level: "sedang" },
  { top: "44%", left: "66%", w: "27%", h: "44%", level: "rendah" },
];

// Pengenalan wajah terakhir. Memakai kode ID, bukan nama orang — data demo yang
// menampilkan nama asli akan terbaca seolah platform ini benar-benar menyimpan
// identitas pengunjung.
const faceMatches: { id: string; time: string; confidence: number; known: boolean }[] = [
  { id: "B9432", time: "10:26:21", confidence: 98, known: true },
  { id: "A2071", time: "10:25:04", confidence: 95, known: true },
  { id: "—", time: "10:24:37", confidence: 41, known: false },
  { id: "C5518", time: "10:23:12", confidence: 93, known: true },
];

/** Porsi wajah terlacak yang berhasil dicocokkan ke basis data wajah. */
const FACE_MATCH_RATE = 0.83;

const heatZonesList: { name: string; level: HeatLevel; pct: number }[] = [
  { name: "Pintu Masuk", level: "panas", pct: 89 },
  { name: "Lobby Tengah", level: "sedang", pct: 58 },
  { name: "Area Kasir", level: "sedang", pct: 49 },
  { name: "Koridor Timur", level: "rendah", pct: 21 },
];

function VideoOverlay({ mode }: { mode: AiMode }) {
  return (
    <>
      {/* scanning line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/80 to-transparent shadow-[0_0_8px_2px_rgba(52,211,153,0.5)] animate-scan pointer-events-none" />

      {mode === "people" &&
        peopleBoxes.map((b, i) => (
          <div
            key={i}
            className="absolute rounded-md border-2 border-emerald-400 pointer-events-none"
            style={{ top: b.top, left: b.left, width: b.w, height: b.h }}
          >
            <span className="absolute -top-4 left-0 text-[11px] font-bold px-1 py-px rounded-sm bg-emerald-400 text-emerald-950">
              {b.label}
            </span>
          </div>
        ))}

      {mode === "face" &&
        faceBoxes.map((b, i) => {
          const unknown = b.label === "Tidak Dikenal";
          return (
            <div
              key={i}
              className={`absolute rounded-md border-2 pointer-events-none ${
                unknown ? "border-slate-300" : "border-indigo-400"
              }`}
              style={{ top: b.top, left: b.left, width: b.w, height: b.h }}
            >
              <span
                className={`absolute -top-4 left-0 text-[11px] font-bold px-1 py-px rounded-sm whitespace-nowrap ${
                  unknown ? "bg-slate-300 text-slate-800" : "bg-indigo-400 text-indigo-950"
                }`}
              >
                {b.label}
              </span>
            </div>
          );
        })}

      {mode === "gender" &&
        genderBoxes.map((b, i) => (
          <div
            key={i}
            className="absolute rounded-md border-2 border-purple-400 pointer-events-none"
            style={{ top: b.top, left: b.left, width: b.w, height: b.h }}
          >
            <span className="absolute -top-4 left-0 text-[11px] font-bold px-1 py-px rounded-sm bg-purple-400 text-purple-950">
              {b.label}
            </span>
          </div>
        ))}

      {mode === "mood" &&
        moodBoxes.map((b, i) => (
          <div
            key={i}
            className="absolute rounded-md border-2 border-amber-400 pointer-events-none"
            style={{ top: b.top, left: b.left, width: b.w, height: b.h }}
          >
            <span className="absolute -top-4 left-0 text-[11px] font-bold px-1 py-px rounded-sm bg-amber-400 text-amber-950">
              {b.label}
            </span>
          </div>
        ))}

      {mode === "crowd" &&
        crowdZones.map((z, i) => (
          <div
            key={i}
            className={`absolute rounded-xl border-2 backdrop-blur-[1px] ${LEVELS[z.level].blob} pointer-events-none`}
            style={{ top: z.top, left: z.left, width: z.w, height: z.h }}
          >
            <span className={`absolute -top-4 left-0 text-[11px] font-extrabold px-1.5 py-px rounded-sm ${LEVELS[z.level].chip}`}>
              {LEVELS[z.level].label}
            </span>
          </div>
        ))}

      {mode === "heatmap" &&
        heatZones.map((z, i) => (
          <div
            key={i}
            className={`absolute rounded-xl border-2 backdrop-blur-[1px] ${HEAT[z.level].blob} pointer-events-none`}
            style={{ top: z.top, left: z.left, width: z.w, height: z.h }}
          >
            <span className={`absolute -top-4 left-0 text-[11px] font-extrabold px-1.5 py-px rounded-sm ${HEAT[z.level].chip}`}>
              {HEAT[z.level].label}
            </span>
          </div>
        ))}
    </>
  );
}

/* ---------- Modal ---------- */
function CameraModal({ camera, onClose }: { camera: CameraFeed; onClose: () => void }) {
  const mode = camera.aiMode; // 1 camera = 1 AI, assigned via Settings → Manajemen AI CCTV

  // Dipakai panel Face Recognition. Diturunkan dari jumlah wajah yang benar-benar
  // terlacak kamera ini, bukan angka tetap, supaya tidak bertentangan dengan
  // hitungan yang tampil di badge kamera yang sama.
  const facesIdentified = Math.round(camera.value * FACE_MATCH_RATE);
  const facesUnknown = camera.value - facesIdentified;

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-md z-[60] flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-5xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-red-50 flex items-center justify-center">
              <Video className="h-5 w-5 text-brand-red" />
            </div>
            <div className="leading-tight">
              <h3 className="font-bold text-slate-800 text-sm">{camera.name}</h3>
              <span className="flex items-center gap-1 text-[13px] text-slate-400 font-medium">
                <MapPin className="h-3 w-3" /> {camera.location}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition border border-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 p-5 overflow-y-auto">
          {/* Video */}
          <div className="lg:col-span-7">
            <div className="relative rounded-2xl overflow-hidden bg-slate-900 aspect-video border border-slate-200">
              <img src={camera.imageUrl} alt={camera.name} className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
              <VideoOverlay mode={mode} />

              {/* top badges */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                <span className="flex items-center gap-1.5 bg-black/55 backdrop-blur-sm text-[11px] text-white font-extrabold px-2 py-1 rounded-md border border-white/15 uppercase tracking-wider">
                  <span className="h-1.5 w-1.5 bg-brand-red rounded-full animate-pulse" /> Live
                </span>
                <span
                  className={`flex items-center gap-1.5 backdrop-blur-sm text-[11px] font-extrabold px-2 py-1 rounded-md border uppercase tracking-wider text-white ${AI_MODELS[mode].solid}`}
                >
                  <Radar className="h-3 w-3" /> AI {AI_MODELS[mode].shortLabel}
                </span>
              </div>

              {/* bottom stream info */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white/70 text-[12px] font-mono">
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full" /> Streaming · 1080p · 24 FPS
                </span>
                <button className="h-7 w-7 rounded-md bg-black/45 border border-white/15 flex items-center justify-center hover:bg-black/70">
                  <Maximize2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Assigned AI (1 camera = 1 AI, configured in Settings → Manajemen AI CCTV) */}
            <div className="mt-3 flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
              <div className="flex items-center gap-2.5">
                <span className={`h-9 w-9 rounded-lg flex items-center justify-center ${AI_MODELS[mode].chip}`}>
                  <AiModeIcon mode={mode} className="h-4 w-4" />
                </span>
                <div className="leading-tight">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block">
                    AI Terpasang
                  </span>
                  <span className="text-[14px] font-extrabold text-slate-800">
                    {AI_MODELS[mode].label}
                  </span>
                </div>
              </div>
              <span className="flex items-center gap-1 text-[12px] font-semibold text-slate-400">
                <Settings2 className="h-3.5 w-3.5" /> Diatur di Settings
              </span>
            </div>
          </div>

          {/* AI panel */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            {mode === "people" ? (
              <>
                {/* Count */}
                <div className="bg-gradient-to-br from-emerald-50 to-slate-50 border border-emerald-100 rounded-2xl p-4">
                  <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wide">Jumlah Orang Saat Ini</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <h4 className="text-4xl font-extrabold text-slate-800 font-mono leading-none">{camera.value}</h4>
                    <span className="text-sm font-bold text-slate-400">/ 200 kapasitas</span>
                  </div>
                  <div className="w-full bg-white/70 h-2 rounded-full overflow-hidden mt-3 border border-emerald-100">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(camera.value / 200) * 100}%` }} />
                  </div>
                  <span className="text-[12px] font-semibold text-emerald-600 mt-1.5 block">
                    Okupansi {Math.round((camera.value / 200) * 100)}% · Normal
                  </span>
                </div>

                {/* In / Out / avg */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { l: "Masuk", v: "342", c: "text-emerald-600" },
                    { l: "Keluar", v: "216", c: "text-amber-600" },
                    { l: "Rata²/jam", v: "519", c: "text-slate-700" },
                  ].map((s) => (
                    <div key={s.l} className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center">
                      <span className={`block text-lg font-extrabold font-mono ${s.c}`}>{s.v}</span>
                      <span className="text-[11px] font-bold text-slate-400 uppercase">{s.l}</span>
                    </div>
                  ))}
                </div>

                {/* Hourly bars */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex-1">
                  <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5" /> Tren per Jam
                  </span>
                  <div className="flex items-end justify-between gap-1 h-20 mt-3">
                    {[40, 55, 70, 90, 100, 85, 60, 45].map((h, i) => (
                      <div key={i} className="flex-1 bg-emerald-400/80 rounded-t" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[12px] font-semibold text-slate-400 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                  <UserCheck className="h-3.5 w-3.5 text-emerald-500" />
                  Model YOLOv8 · Akurasi 98.2% · 4 objek terlacak
                </div>
              </>
            ) : mode === "face" ? (
              <>
                {/* Face recognition hero */}
                <div className="bg-gradient-to-br from-indigo-50 to-slate-50 border border-indigo-100 rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wide">
                      Wajah Teridentifikasi
                    </span>
                    <span className="text-[12px] font-extrabold text-white bg-indigo-500 rounded-full px-2.5 py-1">
                      TERVERIFIKASI
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 mt-1.5">
                    <h4 className="text-4xl font-extrabold text-slate-800 font-mono leading-none">
                      {facesIdentified}
                    </h4>
                    <span className="text-sm font-bold text-slate-400">
                      dari {camera.value} wajah terlacak
                    </span>
                  </div>
                  <div className="w-full bg-white/70 h-2 rounded-full overflow-hidden mt-3 border border-indigo-100">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{ width: `${Math.round(FACE_MATCH_RATE * 100)}%` }}
                    />
                  </div>
                  <span className="text-[12px] font-semibold text-indigo-600 mt-1.5 block">
                    Tingkat kecocokan {Math.round(FACE_MATCH_RATE * 100)}% · {facesUnknown} wajah belum
                    terdaftar
                  </span>
                </div>

                {/* Counts */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { l: "Cocok", v: String(facesIdentified), c: "text-indigo-600" },
                    { l: "Baru", v: String(facesUnknown), c: "text-slate-500" },
                    { l: "Basis Data", v: "1.284", c: "text-slate-700" },
                  ].map((s) => (
                    <div key={s.l} className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center">
                      <span className={`block text-lg font-extrabold font-mono ${s.c}`}>{s.v}</span>
                      <span className="text-[11px] font-bold text-slate-400 uppercase">{s.l}</span>
                    </div>
                  ))}
                </div>

                {/* Pengenalan terakhir */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex-1 min-h-0 flex flex-col">
                  <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5 mb-2.5">
                    <ScanFace className="h-3.5 w-3.5" /> Pengenalan Terakhir
                  </span>
                  <div className="space-y-2 overflow-y-auto pr-1">
                    {faceMatches.map((f, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between gap-2 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5"
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <span
                            className={`h-6 w-6 rounded-md flex items-center justify-center flex-shrink-0 ${
                              f.known ? "bg-indigo-50 text-indigo-600" : "bg-slate-100 text-slate-400"
                            }`}
                          >
                            {f.known ? <UserCheck className="h-3.5 w-3.5" /> : <ScanFace className="h-3.5 w-3.5" />}
                          </span>
                          <span className="min-w-0 leading-tight">
                            <span className="block text-[13px] font-bold text-slate-700 font-mono truncate">
                              {f.known ? `ID ${f.id}` : "Tidak Dikenal"}
                            </span>
                            <span className="block text-[11px] font-semibold text-slate-400 font-mono">
                              {f.time} WIB
                            </span>
                          </span>
                        </span>
                        <span
                          className={`text-[11px] font-extrabold px-1.5 py-0.5 rounded flex-shrink-0 ${
                            f.known ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {f.confidence}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[12px] font-semibold text-slate-400 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                  <ScanFace className="h-3.5 w-3.5 text-indigo-500" />
                  Model {AI_MODELS.face.model} · Akurasi 97.5% · Ambang kecocokan 0,60
                </div>
              </>
            ) : mode === "gender" ? (
              <>
                {/* Gender split hero */}
                <div className="bg-gradient-to-br from-purple-50 to-slate-50 border border-purple-100 rounded-2xl p-4">
                  <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wide">Rasio Gender Terdeteksi</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <h4 className="text-4xl font-extrabold text-slate-800 font-mono leading-none">{camera.value}</h4>
                    <span className="text-sm font-bold text-slate-400">orang terklasifikasi</span>
                  </div>
                  <div className="w-full h-3 rounded-full overflow-hidden mt-3 border border-purple-100 flex">
                    <div className="h-full bg-purple-500" style={{ width: "62%" }} />
                    <div className="h-full bg-pink-400" style={{ width: "38%" }} />
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[12px] font-semibold text-purple-600">Pria · 62%</span>
                    <span className="text-[12px] font-semibold text-pink-500">Wanita · 38%</span>
                  </div>
                </div>

                {/* Counts */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { l: "Pria", v: "78", c: "text-purple-600" },
                    { l: "Wanita", v: "48", c: "text-pink-500" },
                    { l: "Rata²/jam", v: "126", c: "text-slate-700" },
                  ].map((s) => (
                    <div key={s.l} className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center">
                      <span className={`block text-lg font-extrabold font-mono ${s.c}`}>{s.v}</span>
                      <span className="text-[11px] font-bold text-slate-400 uppercase">{s.l}</span>
                    </div>
                  ))}
                </div>

                {/* Hourly bars */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex-1">
                  <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5" /> Tren Klasifikasi per Jam
                  </span>
                  <div className="flex items-end justify-between gap-1 h-20 mt-3">
                    {[35, 50, 65, 85, 95, 80, 55, 40].map((h, i) => (
                      <div key={i} className="flex-1 bg-purple-400/80 rounded-t" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[12px] font-semibold text-slate-400 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                  <VenusAndMars className="h-3.5 w-3.5 text-purple-500" />
                  Model FaceNet · Akurasi 94.6% · Estimasi usia aktif
                </div>
              </>
            ) : mode === "mood" ? (
              <>
                {/* Mood hero */}
                <div className="bg-gradient-to-br from-amber-50 to-slate-50 border border-amber-100 rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wide">Mood Dominan Terdeteksi</span>
                    <span className="text-[12px] font-extrabold text-white bg-amber-500 rounded-full px-2.5 py-1">
                      SENANG
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 mt-1.5">
                    <h4 className="text-4xl font-extrabold text-slate-800 font-mono leading-none">
                      68<span className="text-lg text-slate-400">%</span>
                    </h4>
                    <span className="text-sm font-bold text-slate-400">dari {camera.value} wajah terlacak</span>
                  </div>
                  <div className="w-full bg-white/70 h-2 rounded-full overflow-hidden mt-3 border border-amber-100">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: "68%" }} />
                  </div>
                  <span className="text-[12px] font-semibold text-amber-600 mt-1.5 block">
                    Suasana area cenderung positif
                  </span>
                </div>

                {/* Mood breakdown */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex-1 min-h-0 flex flex-col">
                  <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5 mb-2.5">
                    <Smile className="h-3.5 w-3.5" /> Distribusi Mood
                  </span>
                  <div className="space-y-2.5 overflow-y-auto pr-1">
                    {[
                      { name: "Senang", pct: 68, color: "#F59E0B" },
                      { name: "Netral", pct: 24, color: "#94A3B8" },
                      { name: "Sedih", pct: 5, color: "#3B82F6" },
                      { name: "Marah", pct: 3, color: "#DC2626" },
                    ].map((m) => (
                      <div key={m.name} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-[13px] font-bold text-slate-600">{m.name}</span>
                          <span className="text-[11px] font-bold text-slate-500 font-mono">{m.pct}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${m.pct}%`, backgroundColor: m.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[12px] font-semibold text-slate-400 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                  <Smile className="h-3.5 w-3.5 text-amber-500" />
                  Model FER+ · Akurasi 91.3% · 4 ekspresi terklasifikasi
                </div>
              </>
            ) : mode === "heatmap" ? (
              <>
                {/* Heatmap intensity hero */}
                <div className="bg-gradient-to-br from-orange-50 to-slate-50 border border-orange-100 rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wide">
                      Tingkat Kepadatan Zona
                    </span>
                    <span className="text-[12px] font-extrabold text-white bg-orange-500 rounded-full px-2.5 py-1">
                      PANAS
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 mt-1.5">
                    <h4 className="text-4xl font-extrabold text-slate-800 font-mono leading-none">
                      89<span className="text-lg text-slate-400">%</span>
                    </h4>
                    <span className="text-sm font-bold text-slate-400">zona Pintu Masuk terpanas</span>
                  </div>
                  <div className="w-full bg-white/70 h-2 rounded-full overflow-hidden mt-3 border border-orange-100">
                    <div className="h-full bg-orange-500 rounded-full" style={{ width: "89%" }} />
                  </div>
                  <span className="text-[12px] font-semibold text-orange-600 mt-1.5 block">
                    Kepadatan tertinggi hari ini
                  </span>
                </div>

                {/* Per-zone heat level */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex-1 min-h-0 flex flex-col">
                  <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5 mb-2.5">
                    <Flame className="h-3.5 w-3.5" /> Intensitas per Zona
                  </span>
                  <div className="space-y-2.5 overflow-y-auto pr-1">
                    {heatZonesList.map((a) => (
                      <div key={a.name} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-[13px] font-bold text-slate-600">{a.name}</span>
                          <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${HEAT[a.level].badge}`}>
                            {HEAT[a.level].label} · {a.pct}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${a.pct}%`, backgroundColor: HEAT[a.level].bar }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Peak / avg mini stats */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { l: "Puncak", v: "12:40", c: "text-orange-600" },
                    { l: "Rata²", v: "54%", c: "text-slate-700" },
                    { l: "Zona Aktif", v: "3", c: "text-slate-700" },
                  ].map((s) => (
                    <div key={s.l} className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center">
                      <span className={`block text-base font-extrabold font-mono ${s.c}`}>{s.v}</span>
                      <span className="text-[11px] font-bold text-slate-400 uppercase">{s.l}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-[12px] font-semibold text-slate-400 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                  <Flame className="h-3.5 w-3.5 text-orange-500" />
                  Model DeepStream Heatmap · Update tiap 30 detik
                </div>
              </>
            ) : (
              <>
                {/* Crowd density hero */}
                <div className="bg-gradient-to-br from-red-50 to-slate-50 border border-red-100 rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wide">
                      Tingkat Keramaian Area
                    </span>
                    <span className="text-[12px] font-extrabold text-white bg-brand-red rounded-full px-2.5 py-1">
                      RAME
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 mt-1.5">
                    <h4 className="text-4xl font-extrabold text-slate-800 font-mono leading-none">
                      78<span className="text-lg text-slate-400">%</span>
                    </h4>
                    <span className="text-sm font-bold text-slate-400">±142 orang di area</span>
                  </div>
                  <div className="w-full bg-white/70 h-2 rounded-full overflow-hidden mt-3 border border-red-100">
                    <div className="h-full bg-brand-red rounded-full" style={{ width: "78%" }} />
                  </div>
                  <span className="text-[12px] font-semibold text-brand-red mt-1.5 block">
                    Melebihi ambang normal (60%) · Padat
                  </span>
                </div>

                {/* Per-zone crowd level */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex-1 min-h-0 flex flex-col">
                  <span className="text-[12px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5 mb-2.5">
                    <Users className="h-3.5 w-3.5" /> Keramaian per Zona
                  </span>
                  <div className="space-y-2.5 overflow-y-auto pr-1">
                    {crowdAreas.map((a) => (
                      <div key={a.name} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-[13px] font-bold text-slate-600">{a.name}</span>
                          <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${LEVELS[a.level].badge}`}>
                            {LEVELS[a.level].label} · {a.pct}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${a.pct}%`, backgroundColor: LEVELS[a.level].bar }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Peak / avg mini stats */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { l: "Puncak", v: "11:20", c: "text-brand-red" },
                    { l: "Rata²", v: "54%", c: "text-slate-700" },
                    { l: "Terlacak", v: "142", c: "text-slate-700" },
                  ].map((s) => (
                    <div key={s.l} className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center">
                      <span className={`block text-base font-extrabold font-mono ${s.c}`}>{s.v}</span>
                      <span className="text-[11px] font-bold text-slate-400 uppercase">{s.l}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-[12px] font-semibold text-slate-400 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                  <Radar className="h-3.5 w-3.5 text-brand-red" />
                  Model DeepStream · Deteksi Kerumunan · Latency 82ms
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CctvCarousel() {
  const [activeFilter, setActiveFilter] = useState("Semua Lokasi");
  const [selected, setSelected] = useState<CameraFeed | null>(null);
  // Portal hanya boleh dirakit di browser. Dipakai penjagaan `document`, bukan
  // bendera `mounted` yang di-set dari dalam efek — pola itu memicu render
  // bertingkat dan ditolak aturan React Compiler.

  const filteredFeeds = initialFeeds
    .filter((feed) => activeFilter === "Semua Lokasi" || feed.location === activeFilter)
    .slice(0, 2);

  return (
    <div className="bg-white/60 backdrop-blur-md border border-slate-300/80 rounded-2xl p-5 shadow-sm flex flex-col gap-4 h-[420px] lg:h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
            <Video className="h-5 w-5 text-brand-red" />
          </div>
          <h3 className="font-bold text-slate-800 text-[14px] tracking-wide uppercase">Live Monitoring - CCTV</h3>
          <span className="flex items-center gap-1 bg-red-50 text-brand-red text-[11px] font-bold px-1.5 py-0.5 rounded border border-red-100 uppercase tracking-wider">
            <span className="h-1.5 w-1.5 bg-brand-red rounded-full animate-pulse"></span>
            Live
          </span>
        </div>
        <a
          href="/cctv"
          className="text-[12px] font-bold text-brand-red hover:text-brand-red-hover transition-colors flex items-center gap-0.5"
        >
          Lihat Semua Kamera <ChevronRight className="h-3 w-3" />
        </a>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 flex-shrink-0">
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-2.5 py-1 text-[12px] font-bold rounded-md border transition-all whitespace-nowrap ${
              activeFilter === filter
                ? "bg-brand-red border-brand-red text-white shadow-sm"
                : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Two focused camera feeds — stretch to fill the available card height */}
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 min-h-0">
        {filteredFeeds.map((feed) => (
          <div
            key={feed.id}
            onClick={() => setSelected(feed)}
            className={`relative rounded-xl overflow-hidden group cursor-pointer bg-slate-900 border border-slate-200 shadow-sm h-full ${
              filteredFeeds.length === 1 ? "sm:col-span-2" : ""
            }`}
          >
            <img
              src={feed.imageUrl}
              alt={feed.name}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/35" />

            {/* Top row */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
              <span className="flex items-center gap-1.5 bg-black/55 backdrop-blur-sm text-[11px] text-white font-extrabold px-2 py-1 rounded-md border border-white/15 uppercase tracking-wider">
                <span className="h-1.5 w-1.5 bg-brand-red rounded-full animate-pulse"></span>
                Live
              </span>
              <span
                className={`flex items-center gap-1 backdrop-blur-sm text-[11px] font-extrabold px-1.5 py-1 rounded-md border uppercase tracking-wider text-white ${AI_MODELS[feed.aiMode].solid}`}
              >
                <Radar className="h-2.5 w-2.5" /> AI
              </span>
            </div>

            {/* Bottom info */}
            <div className="absolute inset-x-0 bottom-0 p-4">
              <div className="flex items-end justify-between gap-2">
                <div className="min-w-0">
                  <h4 className="font-bold text-white text-sm truncate">{feed.name}</h4>
                  <span className="flex items-center gap-1 text-white/70 text-[12px] font-medium mt-1">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    {feed.location}
                  </span>
                </div>
                <MetricBadge type={feed.metricType} value={feed.value} />
              </div>
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/10 text-white/60 text-[12px] font-mono">
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full"></span>
                  Klik untuk fokus & AI
                </span>
                <Maximize2 className="h-3 w-3" />
              </div>
            </div>
          </div>
        ))}

        {filteredFeeds.length === 0 && (
          <div className="sm:col-span-2 flex items-center justify-center text-xs text-slate-400 font-bold border border-dashed border-slate-200 rounded-xl">
            Tidak ada kamera di lokasi ini.
          </div>
        )}
      </div>

      {selected && typeof document !== "undefined" && createPortal(
        <CameraModal camera={selected} onClose={() => setSelected(null)} />,
        document.body
      )}
    </div>
  );
}

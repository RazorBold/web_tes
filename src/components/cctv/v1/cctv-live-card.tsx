"use client";

import React, { useState } from "react";
import {
  Video, Radar, Volume2, VolumeX, ShieldAlert,
  UserCheck, Maximize2, Users, VideoOff, LoaderCircle,
} from "lucide-react";
import { cams, DETECTED_LABEL } from "@/config/cctv";
import { useCctvCameras } from "@/hooks/use-cctv-cameras";
import CctvModalPlayer from "./cctv-modal-player";
import CctvStreamPlayer, { type PlayerStatus } from "../shared/cctv-stream-player";
import CctvStreamModal from "./cctv-stream-modal";

interface CctvLiveCardProps {
  defaultCamId: string;
  modeType: "crowd" | "face";
  /**
   * Batasi pilihan kamera ke satu lokasi. "Semua Lokasi" = tanpa filter.
   *
   * Bar pemilih lokasi di halaman /cctv sudah dihapus, jadi saat ini prop ini
   * tidak pernah diisi — logika filternya sengaja ditinggal utuh supaya pilihan
   * per-lokasi bisa dihidupkan lagi hanya dengan meneruskan nilai dari
   * `camLocations` (config/cctv.ts), tanpa menulis ulang apa pun di sini.
   */
  location?: string;
  /**
   * Sambungkan kartu ini ke kamera NVR sungguhan alih-alih katalog contoh.
   *
   * Dalam mode ini semuanya berubah jadi data nyata: daftar kamera diambil dari
   * /api/v1/cctv/cameras, videonya MPEG-TS dari NVR, dan kotak deteksi datang
   * dari WebSocket AI. Hiasan yang tidak punya padanan nyata — kotak deteksi
   * palsu, "Accuracy 98,2%", dan tombol bisu (stream ini memang tanpa audio) —
   * sengaja tidak ikut ditampilkan, supaya tidak ada angka karangan yang
   * terbaca seolah keluaran sistem.
   */
  nvr?: boolean;
  /**
   * Kamera NVR yang ditampilkan lebih dulu. Berguna saat ada lebih dari satu
   * kartu di satu halaman — tanpa ini semuanya akan membuka kamera yang sama.
   * Pengguna tetap bisa berpindah lewat dropdown.
   */
  nvrDefaultId?: string;
}

export default function CctvLiveCard({
  defaultCamId,
  modeType,
  location = "Semua Lokasi",
  nvr = false,
  nvrDefaultId,
}: CctvLiveCardProps) {
  if (nvr) return <NvrLiveCard defaultId={nvrDefaultId} />;
  return <MockLiveCard defaultCamId={defaultCamId} modeType={modeType} location={location} />;
}

/** Kartu untuk kamera NVR sungguhan — rangka visualnya sama dengan versi contoh. */
function NvrLiveCard({ defaultId }: { defaultId?: string }) {
  const { data: cameras, isLoading, error } = useCctvCameras();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAiOverlay, setShowAiOverlay] = useState(true);
  const [status, setStatus] = useState<PlayerStatus>("connecting");
  const [maximized, setMaximized] = useState(false);

  // Urutan pilihan: yang dipilih pengguna → bawaan dari halaman (kalau id-nya
  // memang ada di daftar) → kamera pertama. Tidak disimpan lewat efek supaya
  // daftar yang datang belakangan tidak menimpa pilihan pengguna.
  const fallbackId = cameras?.some((c) => c.id === defaultId) ? defaultId : cameras?.[0]?.id;
  const activeId = selectedId ?? fallbackId ?? null;
  const activeCam = cameras?.find((c) => c.id === activeId);
  const live = status === "live";

  return (
    <div className="group relative flex flex-col h-full bg-white border border-slate-200/90 rounded-[20px] overflow-hidden shadow-[0_8px_28px_rgba(0,0,0,0.07)]">
      {/* ── HEADER (56px) — sama seperti kartu contoh ── */}
      <div className="flex items-center justify-between gap-3 px-4 h-[56px] flex-shrink-0 bg-[#111827]">
        <h3 className="flex items-center gap-2.5 min-w-0">
          <span className="relative h-8 w-8 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0">
            <Video className="h-[17px] w-[17px] text-red-400" />
            <span
              className={`absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-[#111827] ${
                live ? "bg-emerald-400" : "bg-slate-500"
              }`}
            />
          </span>
          <span className="text-[15px] font-bold text-white uppercase tracking-wide truncate">
            {activeCam?.name ?? (isLoading ? "Memuat kamera…" : "Kamera NVR")}
          </span>
        </h3>

        <div className="flex items-center gap-2 flex-shrink-0">
          <select
            value={activeId ?? ""}
            onChange={(e) => setSelectedId(e.target.value)}
            disabled={!cameras?.length}
            aria-label="Pilih kamera"
            className="max-w-[190px] text-[13px] font-semibold text-slate-200 bg-white/10 border border-white/15 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-red-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {(cameras ?? []).map((c) => (
              <option key={c.id} value={c.id} className="bg-[#111827] text-slate-200">
                {c.name}
              </option>
            ))}
          </select>

          {/* Status diangkat ke header supaya tidak dobel dengan lencana pemutar. */}
          <span
            className={`flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-xl border ${
              live
                ? "bg-[#E12229]/15 text-[#E12229] border-[#E12229]/30"
                : status === "error"
                ? "bg-white/10 text-slate-400 border-white/15"
                : "bg-amber-500/15 text-amber-300 border-amber-400/30"
            }`}
          >
            {live ? (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-[#E12229] animate-pulse" /> Live
              </>
            ) : status === "error" ? (
              <>
                <VideoOff className="h-3 w-3" /> Terputus
              </>
            ) : (
              <>
                <LoaderCircle className="h-3 w-3 animate-spin" /> Menyambung
              </>
            )}
          </span>
        </div>
      </div>

      {/* ── AREA VIDEO ── */}
      <div className="relative w-full aspect-video bg-slate-950">
        {activeId && maximized ? (
          // Pemutar kecil sengaja dilepas selama tampilan penuh terbuka: kalau
          // dibiarkan, kamera yang sama diambil dua kali sekaligus — dua koneksi
          // stream dan dua koneksi SSE untuk gambar yang tak terlihat.
          <button
            onClick={() => setMaximized(false)}
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center px-4 cursor-pointer group/mini"
          >
            <Maximize2 className="h-7 w-7 text-slate-600 group-hover/mini:text-slate-400 transition-colors" />
            <span className="text-[13px] font-bold text-slate-400">Sedang ditampilkan penuh</span>
            <span className="text-[12px] font-semibold text-slate-600">Klik untuk kembali ke sini</span>
          </button>
        ) : activeId ? (
          <CctvStreamPlayer
            key={activeId}
            cameraId={activeId}
            showOverlay={showAiOverlay}
            showStatusBadge={false}
            onStatusChange={setStatus}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center px-4">
            {error ? (
              <>
                <VideoOff className="h-7 w-7 text-slate-600" />
                <span className="text-[13px] font-bold text-slate-300">Gagal memuat daftar kamera</span>
                <span className="text-[12px] font-semibold text-slate-500">
                  {error instanceof Error ? error.message : "Periksa konfigurasi NVR di server"}
                </span>
              </>
            ) : (
              <LoaderCircle className="h-6 w-6 text-slate-500 animate-spin" />
            )}
          </div>
        )}

        {/* Kontrol kanan-atas. Tombol bisu dari kartu contoh tidak ikut, karena
            stream NVR ini memang tidak membawa audio. */}
        <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
          <button
            onClick={() => setShowAiOverlay(!showAiOverlay)}
            title="Tampilkan / sembunyikan overlay AI"
            aria-pressed={showAiOverlay}
            className={`p-2 rounded-xl backdrop-blur-md border transition-all cursor-pointer ${
              showAiOverlay
                ? "bg-[#E12229]/90 border-red-400 text-white"
                : "bg-black/50 border-white/15 text-white/60 hover:text-white"
            }`}
          >
            <Radar className="h-4 w-4" />
          </button>

          <button
            onClick={() => setMaximized(true)}
            disabled={!activeId}
            title="Tampilkan penuh"
            aria-label="Tampilkan penuh"
            className="p-2 rounded-xl bg-black/50 backdrop-blur-md border border-white/15 text-white/60 hover:text-white transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {maximized && activeId && cameras && (
        <CctvStreamModal
          cameras={cameras}
          activeId={activeId}
          onSelect={setSelectedId}
          onClose={() => setMaximized(false)}
          showOverlay={showAiOverlay}
          onToggleOverlay={() => setShowAiOverlay(!showAiOverlay)}
          status={status}
          onStatusChange={setStatus}
        />
      )}
    </div>
  );
}

function MockLiveCard({
  defaultCamId,
  modeType,
  location,
}: {
  defaultCamId: string;
  modeType: "crowd" | "face";
  location: string;
}) {
  const [selectedCamId, setSelectedCamId] = useState(defaultCamId);
  const [isMuted, setIsMuted] = useState(true);
  const [showAiOverlay, setShowAiOverlay] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const visibleCams = location === "Semua Lokasi" ? cams : cams.filter((c) => c.location === location);

  // Kalau kamera terpilih tidak lolos filter lokasi, jatuh ke kamera pertama yang
  // tersedia. Tanpa ini, <select> akan punya value yang tak ada di option-nya.
  const cam = visibleCams.find((c) => c.id === selectedCamId) ?? visibleCams[0] ?? cams[0];
  const isOnline = cam.online;

  return (
    <>
      <div className="group relative flex flex-col h-full bg-white border border-slate-200/90 rounded-[20px] overflow-hidden shadow-[0_8px_28px_rgba(0,0,0,0.07)]">
        {/* ── HEADER (56px) ── */}
        <div className="flex items-center justify-between gap-3 px-4 h-[56px] flex-shrink-0 bg-[#111827]">
          <h3 className="flex items-center gap-2.5 min-w-0">
            <span className="relative h-8 w-8 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0">
              <Video className="h-[17px] w-[17px] text-red-400" />
              <span
                className={`absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-[#111827] ${
                  isOnline ? "bg-emerald-400" : "bg-slate-500"
                }`}
              />
            </span>
            <span className="text-[15px] font-bold text-white uppercase tracking-wide truncate">
              {cam.name}
            </span>
          </h3>

          <div className="flex items-center gap-2 flex-shrink-0">
            <select
              value={cam.id}
              onChange={(e) => setSelectedCamId(e.target.value)}
              className="max-w-[150px] text-[13px] font-semibold text-slate-200 bg-white/10 border border-white/15 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-red-500 cursor-pointer"
            >
              {visibleCams.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#111827] text-slate-200">
                  {c.name}
                </option>
              ))}
            </select>

            {isOnline ? (
              <span className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-xl bg-[#E12229]/15 text-[#E12229] border border-[#E12229]/30">
                <span className="h-1.5 w-1.5 rounded-full bg-[#E12229] animate-pulse" /> Live
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-xl bg-white/10 text-slate-400 border border-white/15">
                <VideoOff className="h-3 w-3" /> Offline
              </span>
            )}
          </div>
        </div>

        {/* ── AREA VIDEO ── aspect tetap 16:9 supaya dua kartu selalu setinggi ── */}
        <div
          onClick={() => setIsModalOpen(true)}
          className="relative w-full aspect-video bg-slate-950 overflow-hidden cursor-pointer"
        >
          <img
            src={cam.imageUrl}
            alt={cam.name}
            className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02] ${
              isOnline ? "" : "grayscale opacity-40"
            }`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/5 to-black/30" />

          {/* Overlay deteksi AI — hanya untuk kamera yang online */}
          {isOnline && showAiOverlay && modeType === "crowd" && (
            <>
              <div className="absolute top-[18%] left-[24%] w-[42%] h-[48%] border-2 border-red-500 bg-red-500/15 rounded-[16px] shadow-[0_0_24px_rgba(225,34,41,0.35)] animate-pulse pointer-events-none">
                <span className="absolute -top-6 left-1 bg-[#E12229] text-white text-[12px] font-bold px-2.5 py-0.5 rounded-lg flex items-center gap-1.5 shadow-md whitespace-nowrap">
                  <ShieldAlert className="h-3 w-3 text-amber-300" /> High Density Crowd (87%)
                </span>
              </div>
              <div className="absolute top-[40%] left-[72%] w-[14%] h-[34%] border-2 border-emerald-400 bg-emerald-500/12 rounded-xl shadow-[0_0_14px_rgba(16,185,129,0.3)] pointer-events-none">
                <span className="absolute -top-5 left-0 bg-emerald-600 text-white text-[11px] font-mono font-bold px-1.5 py-0.5 rounded-md whitespace-nowrap">
                  Person (91%)
                </span>
              </div>
            </>
          )}
          {isOnline && showAiOverlay && modeType === "face" && (
            <>
              <div className="absolute top-[22%] left-[38%] w-[20%] h-[34%] border-2 border-indigo-400 bg-indigo-500/18 rounded-2xl shadow-[0_0_22px_rgba(99,102,241,0.5)] pointer-events-none">
                <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[12px] font-bold px-3 py-0.5 rounded-full whitespace-nowrap shadow-lg flex items-center gap-1">
                  <UserCheck className="h-3 w-3 text-cyan-300" /> ID: B9432 (Verified)
                </span>
                <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-emerald-600/90 text-white text-[11px] font-mono font-bold px-2 py-0.5 rounded-md whitespace-nowrap">
                  People · Happy (94%)
                </span>
              </div>
              <div className="absolute top-[34%] left-[14%] w-[16%] h-[24%] border-2 border-pink-400 bg-pink-500/12 rounded-xl shadow-[0_0_14px_rgba(244,114,182,0.4)] pointer-events-none">
                <span className="absolute -top-5 left-0 bg-pink-600 text-white text-[11px] font-mono font-bold px-1.5 py-0.5 rounded-md whitespace-nowrap">
                  Vehicle · Car (87%)
                </span>
              </div>
            </>
          )}

          {/* Kiri atas: identitas stream */}
          <span className="absolute top-3.5 left-4 bg-black/60 backdrop-blur-md border border-white/15 text-white text-[12px] font-mono font-semibold px-2.5 py-1.5 rounded-xl pointer-events-none">
            CAM-{cam.id.padStart(2, "0")} · 1080P · 30FPS
          </span>

          {/* Kanan atas: kontrol */}
          <div className="absolute top-3.5 right-4 flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); setShowAiOverlay(!showAiOverlay); }}
              title="Tampilkan / sembunyikan overlay AI"
              className={`p-2 rounded-xl backdrop-blur-md border transition-all cursor-pointer ${
                showAiOverlay
                  ? "bg-[#E12229]/90 border-red-400 text-white"
                  : "bg-black/50 border-white/15 text-white/60 hover:text-white"
              }`}
            >
              <Radar className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
              title={isMuted ? "Nyalakan suara" : "Bisukan"}
              className="p-2 rounded-xl bg-black/50 backdrop-blur-md border border-white/15 text-white/70 hover:text-white transition-all cursor-pointer"
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4 text-emerald-400" />}
            </button>
          </div>

          {/* Kiri bawah: jumlah deteksi */}
          <div className="absolute bottom-4 left-4 pointer-events-none">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-white/80" />
              <span className="text-[26px] font-bold font-mono text-white leading-none">{cam.value}</span>
            </div>
            <span className="block text-[13px] font-semibold text-white/70 mt-1 leading-none">
              {DETECTED_LABEL[cam.metricType]}
            </span>
          </div>

          {/* Kanan bawah: akurasi model */}
          <span className="absolute bottom-4 right-4 text-[13px] font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-400/30 backdrop-blur-md px-2.5 py-1 rounded-xl pointer-events-none">
            Accuracy: {cam.accuracy}
          </span>

          {/* Petunjuk klik (muncul saat hover) */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <span className="flex items-center gap-2 bg-white/95 text-[#111827] text-xs font-bold px-5 py-2.5 rounded-2xl shadow-xl">
              <Maximize2 className="h-4 w-4 text-[#E12229]" /> Klik untuk Detail Kamera & AI
            </span>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <CctvModalPlayer cam={cam} modeType={modeType} onClose={() => setIsModalOpen(false)} />
      )}
    </>
  );
}

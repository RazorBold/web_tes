"use client";

import React, { useState } from "react";
import Section from "@/components/layout/section";
import PageHeader from "@/components/layout/page-header";
import AiModeIcon from "@/components/widgets/ai-mode-icon";
import { useDashboardWidgetsStore, type DashboardWidgetVisibility } from "@/stores/dashboard-widgets-store";
import { useCctvAiStore } from "@/stores/cctv-ai-store";
import { AI_MODELS, aiModes, cams } from "@/config/cctv";
import {
  Settings,
  ShieldCheck,
  Bell,
  Globe,
  Moon,
  Sun,
  Pencil,
  LayoutDashboard,
  Truck,
  Waves,
  Droplets,
  Zap,
  ThermometerSun,
  CloudSun,
  Video,
  MapPin,
  Check,
  Radar,
  RotateCcw,
} from "lucide-react";

const moduleToggles: { key: keyof DashboardWidgetVisibility; label: string; note: string; icon: React.ReactNode }[] = [
  { key: "kpi", label: "KPI Nasional", note: "Ringkasan 4 metrik utama", icon: <LayoutDashboard className="h-4 w-4" /> },
  { key: "fleet", label: "Fleet Tracking", note: "Peta & daftar kendaraan", icon: <Truck className="h-4 w-4" /> },
  { key: "flood", label: "Flood Smart Meter", note: "Ketinggian air & status siaga", icon: <Waves className="h-4 w-4" /> },
  { key: "water", label: "Smart Water Meter", note: "Pemakaian air & top pelanggan", icon: <Droplets className="h-4 w-4" /> },
  { key: "power", label: "Energy Monitoring", note: "Beban listrik & losses distribusi", icon: <Zap className="h-4 w-4" /> },
  { key: "temphum", label: "Environment Monitoring", note: "Suhu & kelembapan ruangan", icon: <ThermometerSun className="h-4 w-4" /> },
  { key: "weather", label: "Weather Station", note: "Cuaca & curah hujan", icon: <CloudSun className="h-4 w-4" /> },
];

const users = [
  { name: "Syaiful R", email: "syaiful.r@nusantara-iot.id", role: "Admin", active: "Sekarang" },
  { name: "Siti Rahayu", email: "siti.rahayu@nusantara-iot.id", role: "Super Admin", active: "5 mnt lalu" },
  { name: "Budi Santoso", email: "budi.santoso@nusantara-iot.id", role: "Operator", active: "1 jam lalu" },
  { name: "Dewi Lestari", email: "dewi.lestari@nusantara-iot.id", role: "Viewer", active: "Kemarin" },
];

const roleChip = (r: string) =>
  r === "Super Admin"
    ? "bg-red-50 text-brand-red border-red-200"
    : r === "Admin"
    ? "bg-amber-50 text-amber-600 border-amber-200"
    : r === "Operator"
    ? "bg-blue-50 text-blue-600 border-blue-200"
    : "bg-slate-50 text-slate-500 border-slate-200";

const prefs = [
  { icon: <Globe className="h-4 w-4 text-brand-red" />, label: "Bahasa", value: "Bahasa Indonesia", options: ["ID", "EN"], active: "ID" },
  { icon: <Sun className="h-4 w-4 text-amber-500" />, label: "Tema Tampilan", value: "Mode Terang", options: ["Terang", "Gelap"], active: "Terang" },
  { icon: <Bell className="h-4 w-4 text-blue-500" />, label: "Notifikasi Push", value: "Aktif untuk lansiran Kritis & Peringatan", options: ["Aktif", "Nonaktif"], active: "Aktif" },
];

export default function SettingsPage() {
  const visibility = useDashboardWidgetsStore((s) => s.visibility);
  const setVisible = useDashboardWidgetsStore((s) => s.setVisible);

  const assignments = useCctvAiStore((s) => s.assignments);
  const toggleMode = useCctvAiStore((s) => s.toggleMode);
  const setModes = useCctvAiStore((s) => s.setModes);
  const resetDefaults = useCctvAiStore((s) => s.resetDefaults);
  const [selectedCamId, setSelectedCamId] = useState(cams[0].id);

  const selectedCam = cams.find((c) => c.id === selectedCamId) ?? cams[0];
  const selectedModes = assignments[selectedCam.id] ?? [];
  const totalActive = cams.reduce((sum, c) => sum + (assignments[c.id] ?? []).length, 0);

  return (
    <div className="space-y-6 pb-4">
      <PageHeader
        title="Settings"
        subtitle="Kelola profil, preferensi & pengguna platform"
        right={
          <span className="flex items-center gap-1.5 bg-slate-100 text-slate-600 text-[12px] font-bold px-2.5 py-1 rounded-full border border-slate-200 uppercase tracking-wider">
            <Settings className="h-3 w-3" /> v1.0.0 · Build 2026.07
          </span>
        }
      />

      {/* 1. Profil */}
      <Section num={1} title="Profil Pengguna">
        <div className="bg-white/60 backdrop-blur-md border border-slate-300/80 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-brand-red to-orange-500 text-white font-extrabold text-xl flex items-center justify-center shadow-md shadow-red-200 border-2 border-white">
              AT
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-800">Syaiful R</h3>
              <span className="text-[14px] font-medium text-slate-400 block">syaiful.r@nusantara-iot.id</span>
              <span className={`inline-flex items-center gap-1 text-[12px] font-extrabold px-2 py-0.5 rounded-full border mt-1.5 ${roleChip("Admin")}`}>
                <ShieldCheck className="h-3 w-3" /> Admin
              </span>
            </div>
          </div>
          <button className="flex items-center gap-1.5 px-4 py-2 text-[14px] font-bold text-slate-600 bg-white/80 border border-slate-200 rounded-xl hover:bg-white hover:text-slate-800 transition cursor-pointer self-start md:self-auto">
            <Pencil className="h-3.5 w-3.5" /> Edit Profil
          </button>
        </div>
      </Section>

      {/* 2. Modul IoT Dashboard Platform */}
      <Section num={2} title="Modul IoT Dashboard Platform">
        <p className="text-[13px] font-semibold text-slate-400 -mt-1 mb-4">
          Atur kartu modul mana yang tampil di halaman IoT Dashboard Platform. Kartu yang disembunyikan akan
          membuat kartu lain menyesuaikan ukurannya mengisi ruang yang kosong.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {moduleToggles.map((m) => {
            const active = visibility[m.key];
            return (
              <div
                key={m.key}
                className="bg-white/60 backdrop-blur-md border border-slate-300/80 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 border ${
                    active ? "bg-red-50 text-brand-red border-red-100" : "bg-slate-50 text-slate-400 border-slate-100"
                  }`}>
                    {m.icon}
                  </span>
                  <div className="min-w-0">
                    <span className="text-xs font-extrabold text-slate-800 block truncate">{m.label}</span>
                    <span className="text-[12px] font-semibold text-slate-400 block truncate">{m.note}</span>
                  </div>
                </div>
                <button
                  onClick={() => setVisible(m.key, !active)}
                  aria-pressed={active}
                  aria-label={`Tampilkan ${m.label}`}
                  className={`relative h-6 w-11 rounded-full flex-shrink-0 transition-colors cursor-pointer ${
                    active ? "bg-brand-red" : "bg-slate-200"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      active ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </Section>

      {/* 3. Manajemen AI CCTV */}
      <div id="ai-cctv" className="scroll-mt-24">
        <Section num={3} title="Manajemen AI CCTV">
          <p className="text-[13px] font-semibold text-slate-400 -mt-1 mb-4">
            Pilih kamera pada daftar di kiri, lalu centang model AI yang ingin dijalankan pada kamera tersebut.
            Satu kamera bisa menjalankan beberapa model AI sekaligus. Perubahan langsung diterapkan di halaman CCTV &amp; AI.
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Daftar kamera */}
            <div className="lg:col-span-5 bg-white/60 backdrop-blur-md border border-slate-300/80 rounded-2xl shadow-sm overflow-hidden flex flex-col">
              <div className="px-4 py-2.5 border-b border-slate-200/70 bg-slate-50/50 flex items-center justify-between gap-2 flex-shrink-0">
                <span className="text-[12px] font-extrabold text-slate-400 uppercase tracking-wider">Pilih Kamera</span>
                <span className="text-[12px] font-bold text-slate-400 whitespace-nowrap">
                  {cams.length} kamera · {totalActive} AI aktif
                </span>
              </div>
              <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
                {cams.map((cam) => {
                  const modes = assignments[cam.id] ?? [];
                  const selected = cam.id === selectedCam.id;
                  return (
                    <button
                      key={cam.id}
                      onClick={() => setSelectedCamId(cam.id)}
                      aria-pressed={selected}
                      className={`w-full text-left px-4 py-3 flex items-center gap-3 transition cursor-pointer ${
                        selected ? "bg-red-50/70" : "hover:bg-white/70"
                      }`}
                    >
                      <span
                        className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 border ${
                          selected ? "bg-brand-red text-white border-brand-red shadow-sm shadow-red-200" : "bg-slate-50 text-slate-400 border-slate-100"
                        }`}
                      >
                        <Video className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-extrabold text-slate-800 block truncate">{cam.name}</span>
                        <span className="flex items-center gap-1 text-[12px] font-semibold text-slate-400 truncate">
                          <MapPin className="h-3 w-3 flex-shrink-0" /> {cam.location}
                        </span>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-2 py-0.5 rounded-full border ${
                            cam.online ? "text-emerald-600 bg-emerald-50 border-emerald-100" : "text-slate-400 bg-slate-50 border-slate-200"
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${cam.online ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`} />
                          {cam.online ? "Online" : "Offline"}
                        </span>
                        <span className={`text-[12px] font-bold ${modes.length > 0 ? "text-slate-500" : "text-slate-300"}`}>
                          {modes.length > 0 ? `${modes.length} AI` : "Tanpa AI"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Checklist model AI */}
            <div className="lg:col-span-7 bg-white/60 backdrop-blur-md border border-slate-300/80 rounded-2xl shadow-sm overflow-hidden flex flex-col">
              <div className="px-4 py-2.5 border-b border-slate-200/70 bg-slate-50/50 flex items-center justify-between gap-2 flex-wrap flex-shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <Radar className="h-4 w-4 text-brand-red flex-shrink-0" />
                  <span className="text-xs font-extrabold text-slate-700 truncate">{selectedCam.name}</span>
                  <span className="text-[12px] font-semibold text-slate-400 whitespace-nowrap">· Akurasi {selectedCam.accuracy}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setModes(selectedCam.id, [...aiModes])}
                    className="px-2.5 py-1 text-[12px] font-bold rounded-md border border-slate-200 bg-white/80 text-slate-500 hover:bg-white hover:text-brand-red hover:border-red-200 transition cursor-pointer"
                  >
                    Pilih Semua
                  </button>
                  <button
                    onClick={() => setModes(selectedCam.id, [])}
                    className="px-2.5 py-1 text-[12px] font-bold rounded-md border border-slate-200 bg-white/80 text-slate-500 hover:bg-white hover:text-brand-red hover:border-red-200 transition cursor-pointer"
                  >
                    Kosongkan
                  </button>
                </div>
              </div>

              <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {aiModes.map((mode) => {
                  const meta = AI_MODELS[mode];
                  const active = selectedModes.includes(mode);
                  return (
                    <button
                      key={mode}
                      onClick={() => toggleMode(selectedCam.id, mode)}
                      aria-pressed={active}
                      className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition cursor-pointer ${
                        active ? "bg-white border-red-200 shadow-sm" : "bg-white/50 border-slate-200 hover:bg-white hover:border-slate-300"
                      }`}
                    >
                      <span
                        className={`h-5 w-5 rounded-md border flex items-center justify-center flex-shrink-0 mt-px transition ${
                          active ? "bg-brand-red border-brand-red text-white" : "bg-white border-slate-300 text-transparent"
                        }`}
                      >
                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                      </span>
                      <span
                        className={`h-8 w-8 rounded-lg border flex items-center justify-center flex-shrink-0 ${
                          active ? meta.chip : "bg-slate-50 border-slate-100 text-slate-300"
                        }`}
                      >
                        <AiModeIcon mode={mode} className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="text-xs font-extrabold text-slate-800 block truncate">{meta.label}</span>
                        <span className="text-[12px] font-semibold text-slate-400 block leading-snug">{meta.desc}</span>
                        <span className="inline-block mt-1.5 text-[11px] font-mono font-bold text-slate-500 bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5">
                          {meta.model}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-auto px-4 py-2.5 border-t border-slate-200/70 flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                  <span className="text-[12px] font-extrabold text-slate-400 uppercase tracking-wider">AI Aktif:</span>
                  {selectedModes.length > 0 ? (
                    selectedModes.map((mode) => (
                      <span
                        key={mode}
                        className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-2 py-0.5 rounded-full border ${AI_MODELS[mode].chip}`}
                      >
                        <AiModeIcon mode={mode} /> {AI_MODELS[mode].shortLabel}
                      </span>
                    ))
                  ) : (
                    <span className="text-[12px] font-bold text-slate-300">Tidak ada model AI dipilih</span>
                  )}
                </div>
                <button
                  onClick={resetDefaults}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-[12px] font-bold rounded-md border border-slate-200 bg-white/80 text-slate-500 hover:bg-white hover:text-brand-red hover:border-red-200 transition cursor-pointer flex-shrink-0"
                >
                  <RotateCcw className="h-3 w-3" /> Reset Semua Kamera
                </button>
              </div>
              {!selectedCam.online && (
                <div className="px-4 py-2 border-t border-slate-200/70 bg-amber-50/60 text-[12px] font-semibold text-amber-600">
                  Kamera sedang offline — konfigurasi tetap tersimpan dan berjalan otomatis saat kamera kembali online.
                </div>
              )}
            </div>
          </div>
        </Section>
      </div>

      {/* 4. Preferensi */}
      <Section num={4} title="Preferensi Tampilan & Notifikasi">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {prefs.map((p) => (
            <div key={p.label} className="bg-white/60 backdrop-blur-md border border-slate-300/80 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2.5">
                <span className="h-9 w-9 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center">{p.icon}</span>
                <div>
                  <span className="text-xs font-extrabold text-slate-800 block">{p.label}</span>
                  <span className="text-[12px] font-semibold text-slate-400">{p.value}</span>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                {p.options.map((o) => (
                  <button
                    key={o}
                    className={`flex-1 px-3 py-1.5 text-[13px] font-bold rounded-lg border transition cursor-pointer ${
                      o === p.active
                        ? "bg-brand-red border-brand-red text-white shadow-sm shadow-red-200"
                        : "bg-white/70 border-slate-200 text-slate-500 hover:bg-white"
                    }`}
                  >
                    {o === "Gelap" && <Moon className="h-3 w-3 inline mr-1 -mt-0.5" />}
                    {o}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* 5. Manajemen Pengguna */}
      <Section num={5} title="Manajemen Pengguna & Peran">
        <div className="bg-white/60 backdrop-blur-md border border-slate-300/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200/70 bg-slate-50/50">
                  {["Pengguna", "Email", "Peran", "Aktif Terakhir"].map((h) => (
                    <th key={h} className="px-5 py-3 text-[12px] font-extrabold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.email} className="hover:bg-white/60 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[12px] font-extrabold flex items-center justify-center flex-shrink-0">
                          {u.name.split(" ").map((n) => n[0]).join("")}
                        </span>
                        <span className="text-xs font-bold text-slate-800 whitespace-nowrap">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs font-medium text-slate-500 whitespace-nowrap">{u.email}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex text-[12px] font-extrabold px-2 py-0.5 rounded-full border ${roleChip(u.role)}`}>{u.role}</span>
                    </td>
                    <td className="px-5 py-3 text-[13px] font-semibold text-slate-400 whitespace-nowrap">{u.active}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-slate-200/70 text-[12px] font-semibold text-slate-400">
            Matriks RBAC: Super Admin (semua akses) · Admin (kelola perangkat &amp; lansiran) · Operator (pantau &amp; acknowledge) · Viewer (lihat saja)
          </div>
        </div>
      </Section>
    </div>
  );
}

"use client";

import React from "react";
import Section from "@/components/layout/section";
import PageHeader from "@/components/layout/page-header";
import { Settings, ShieldCheck, Bell, Globe, Moon, Sun, Pencil } from "lucide-react";

const users = [
  { name: "Abi Tiyoso", email: "abi.tiyoso@nusantara-iot.id", role: "Admin", active: "Sekarang" },
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
  return (
    <div className="space-y-6 pb-4">
      <PageHeader
        title="Settings"
        subtitle="Kelola profil, preferensi & pengguna platform"
        right={
          <span className="flex items-center gap-1.5 bg-slate-100 text-slate-600 text-[10px] font-bold px-2.5 py-1 rounded-full border border-slate-200 uppercase tracking-wider">
            <Settings className="h-3 w-3" /> v1.0.0 · Build 2026.07
          </span>
        }
      />

      {/* 1. Profil */}
      <Section num={1} title="Profil Pengguna">
        <div className="bg-white/45 backdrop-blur-md border border-white/70 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-brand-red to-orange-500 text-white font-extrabold text-xl flex items-center justify-center shadow-md shadow-red-200 border-2 border-white">
              AT
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-800">Abi Tiyoso</h3>
              <span className="text-[12px] font-medium text-slate-400 block">abi.tiyoso@nusantara-iot.id</span>
              <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full border mt-1.5 ${roleChip("Admin")}`}>
                <ShieldCheck className="h-3 w-3" /> Admin
              </span>
            </div>
          </div>
          <button className="flex items-center gap-1.5 px-4 py-2 text-[12px] font-bold text-slate-600 bg-white/80 border border-slate-200 rounded-xl hover:bg-white hover:text-slate-800 transition cursor-pointer self-start md:self-auto">
            <Pencil className="h-3.5 w-3.5" /> Edit Profil
          </button>
        </div>
      </Section>

      {/* 2. Preferensi */}
      <Section num={2} title="Preferensi Tampilan & Notifikasi">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {prefs.map((p) => (
            <div key={p.label} className="bg-white/45 backdrop-blur-md border border-white/70 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2.5">
                <span className="h-9 w-9 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center">{p.icon}</span>
                <div>
                  <span className="text-xs font-extrabold text-slate-800 block">{p.label}</span>
                  <span className="text-[10px] font-semibold text-slate-400">{p.value}</span>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                {p.options.map((o) => (
                  <button
                    key={o}
                    className={`flex-1 px-3 py-1.5 text-[11px] font-bold rounded-lg border transition cursor-pointer ${
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

      {/* 3. Manajemen Pengguna */}
      <Section num={3} title="Manajemen Pengguna & Peran">
        <div className="bg-white/45 backdrop-blur-md border border-white/70 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200/70 bg-slate-50/50">
                  {["Pengguna", "Email", "Peran", "Aktif Terakhir"].map((h) => (
                    <th key={h} className="px-5 py-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.email} className="hover:bg-white/60 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-extrabold flex items-center justify-center flex-shrink-0">
                          {u.name.split(" ").map((n) => n[0]).join("")}
                        </span>
                        <span className="text-xs font-bold text-slate-800 whitespace-nowrap">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs font-medium text-slate-500 whitespace-nowrap">{u.email}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${roleChip(u.role)}`}>{u.role}</span>
                    </td>
                    <td className="px-5 py-3 text-[11px] font-semibold text-slate-400 whitespace-nowrap">{u.active}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-slate-200/70 text-[10px] font-semibold text-slate-400">
            Matriks RBAC: Super Admin (semua akses) · Admin (kelola perangkat &amp; lansiran) · Operator (pantau &amp; acknowledge) · Viewer (lihat saja)
          </div>
        </div>
      </Section>
    </div>
  );
}

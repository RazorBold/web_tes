"use client";

import React, { useState } from "react";
import Section from "@/components/layout/section";
import PageHeader from "@/components/layout/page-header";
import { FileText, FileSpreadsheet, CalendarClock, Download, Sparkles } from "lucide-react";

const modules = ["Water", "Energy", "Fleet", "CCTV & AI", "Flood", "TempHum", "Weather"];
const ranges = ["7 Hari", "30 Hari", "Kustom"];

const scheduled = [
  { name: "Laporan Harian Air", schedule: "Setiap hari · 07:00 WIB", format: "PDF", active: true },
  { name: "Laporan Mingguan Energi", schedule: "Setiap Senin · 08:00 WIB", format: "Excel", active: true },
  { name: "Laporan Bulanan Semua Modul", schedule: "Tanggal 1 · 09:00 WIB", format: "PDF + Excel", active: false },
];

const history = [
  { name: "Water_Report_Juli_M2.pdf", module: "Water", date: "13 Jul 2026", size: "2,4 MB" },
  { name: "Energy_Report_Juli_M2.xlsx", module: "Energy", date: "13 Jul 2026", size: "1,8 MB" },
  { name: "Fleet_Trip_Summary_Juni.pdf", module: "Fleet", date: "01 Jul 2026", size: "5,1 MB" },
  { name: "CCTV_People_Count_Juni.xlsx", module: "CCTV & AI", date: "01 Jul 2026", size: "3,3 MB" },
  { name: "Flood_EWS_Log_Juni.pdf", module: "Flood", date: "01 Jul 2026", size: "1,2 MB" },
];

export default function ReportsPage() {
  const [selModules, setSelModules] = useState<string[]>(["Water", "Energy"]);
  const [range, setRange] = useState("7 Hari");
  const [format, setFormat] = useState<"PDF" | "Excel">("PDF");

  const toggleModule = (m: string) =>
    setSelModules((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));

  return (
    <div className="space-y-6 pb-4">
      <PageHeader
        title="Reports"
        subtitle="Bangun, jadwalkan & unduh laporan operasional seluruh modul"
        right={
          <span className="flex items-center gap-1.5 bg-slate-100 text-slate-600 text-[12px] font-bold px-2.5 py-1 rounded-full border border-slate-200 uppercase tracking-wider">
            <FileText className="h-3 w-3" /> {history.length} Laporan Tersimpan
          </span>
        }
      />

      {/* 1. Report Builder */}
      <Section num={1} title="Buat Laporan Baru">
        <div className="bg-white/60 backdrop-blur-md border border-slate-300/80 rounded-2xl p-6 shadow-sm space-y-5">
          {/* Modules */}
          <div>
            <span className="text-[12px] font-extrabold text-slate-400 uppercase tracking-wider block mb-2">Pilih Modul</span>
            <div className="flex flex-wrap gap-2">
              {modules.map((m) => (
                <button
                  key={m}
                  onClick={() => toggleModule(m)}
                  className={`px-3 py-1.5 text-[13px] font-bold rounded-lg border transition-all cursor-pointer ${
                    selModules.includes(m)
                      ? "bg-brand-red border-brand-red text-white shadow-sm shadow-red-200"
                      : "bg-white/70 border-slate-200 text-slate-500 hover:bg-white"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Range */}
            <div>
              <span className="text-[12px] font-extrabold text-slate-400 uppercase tracking-wider block mb-2">Rentang Waktu</span>
              <div className="flex gap-2">
                {ranges.map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className={`flex-1 px-3 py-2 text-[13px] font-bold rounded-lg border transition-all cursor-pointer ${
                      range === r ? "bg-slate-800 border-slate-800 text-white" : "bg-white/70 border-slate-200 text-slate-500 hover:bg-white"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Format */}
            <div>
              <span className="text-[12px] font-extrabold text-slate-400 uppercase tracking-wider block mb-2">Format</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setFormat("PDF")}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-[13px] font-bold rounded-lg border transition-all cursor-pointer ${
                    format === "PDF" ? "bg-red-50 border-red-200 text-brand-red" : "bg-white/70 border-slate-200 text-slate-500 hover:bg-white"
                  }`}
                >
                  <FileText className="h-3.5 w-3.5" /> PDF
                </button>
                <button
                  onClick={() => setFormat("Excel")}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-[13px] font-bold rounded-lg border transition-all cursor-pointer ${
                    format === "Excel" ? "bg-emerald-50 border-emerald-200 text-emerald-600" : "bg-white/70 border-slate-200 text-slate-500 hover:bg-white"
                  }`}
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <span className="text-[13px] font-semibold text-slate-400">
              {selModules.length} modul · {range} · {format}
            </span>
            <button className="flex items-center gap-2 px-5 py-2.5 text-[14px] font-bold text-white bg-brand-red rounded-xl hover:bg-brand-red-hover transition shadow-sm shadow-red-200 cursor-pointer">
              <Sparkles className="h-4 w-4" /> Buat Laporan
            </button>
          </div>
        </div>
      </Section>

      {/* 2. Terjadwal */}
      <Section num={2} title="Laporan Terjadwal">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {scheduled.map((s) => (
            <div key={s.name} className="bg-white/60 backdrop-blur-md border border-slate-300/80 rounded-2xl p-5 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <span className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                  <CalendarClock className="h-5 w-5 text-brand-red" />
                </span>
                <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full border ${
                  s.active ? "text-emerald-600 bg-emerald-50 border-emerald-100" : "text-slate-400 bg-slate-50 border-slate-200"
                }`}>
                  {s.active ? "Aktif" : "Nonaktif"}
                </span>
              </div>
              <h4 className="text-xs font-extrabold text-slate-800 mt-3">{s.name}</h4>
              <span className="text-[12px] font-semibold text-slate-400 block mt-1">{s.schedule}</span>
              <span className="text-[12px] font-mono font-bold text-slate-500 block mt-2">{s.format}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* 3. Riwayat */}
      <Section num={3} title="Riwayat Laporan">
        <div className="bg-white/60 backdrop-blur-md border border-slate-300/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200/70 bg-slate-50/50">
                  {["Nama Berkas", "Modul", "Tanggal", "Ukuran", ""].map((h, i) => (
                    <th key={i} className="px-5 py-3 text-[12px] font-extrabold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((h) => (
                  <tr key={h.name} className="hover:bg-white/60 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          h.name.endsWith(".pdf") ? "bg-red-50 text-brand-red" : "bg-emerald-50 text-emerald-600"
                        }`}>
                          {h.name.endsWith(".pdf") ? <FileText className="h-4 w-4" /> : <FileSpreadsheet className="h-4 w-4" />}
                        </span>
                        <span className="text-xs font-bold text-slate-800 font-mono">{h.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs font-semibold text-slate-500 whitespace-nowrap">{h.module}</td>
                    <td className="px-5 py-3 text-xs font-semibold text-slate-500 whitespace-nowrap">{h.date}</td>
                    <td className="px-5 py-3 text-xs font-mono font-bold text-slate-600">{h.size}</td>
                    <td className="px-5 py-3 text-right">
                      <button className="inline-flex items-center gap-1 text-[12px] font-bold text-slate-500 bg-white/80 border border-slate-200 rounded-lg px-2.5 py-1.5 hover:text-brand-red hover:border-red-200 transition cursor-pointer">
                        <Download className="h-3 w-3" /> Unduh
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Section>
    </div>
  );
}

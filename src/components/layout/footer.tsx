import React from "react";

export default function Footer() {
  return (
    <footer className="flex-shrink-0 bg-white border-t border-slate-200 px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-3">
      {/* Copyright */}
      <span className="text-[11px] font-medium text-slate-400">
        &copy; 2026 <span className="font-bold text-slate-600">Nusantara IoT Platform</span>
        <span className="hidden md:inline"> · Edited by </span>
        <span className="hidden md:inline font-bold text-brand-red">PT Telkom Indonesia</span>
      </span>

      {/* Center: sovereignty */}
      <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
        <span className="text-sm leading-none">🇮🇩</span>
        Data Center Indonesia
        <span className="h-3 w-px bg-slate-200" aria-hidden />
        <span className="text-slate-400 font-medium">Powered by Sovereign Cloud Indonesia</span>
      </div>

      {/* Links */}
      <div className="flex items-center gap-4 text-[11px] font-medium text-slate-400">
        <a href="#" className="hover:text-brand-red transition-colors">Kebijakan Privasi</a>
        <span className="h-3 w-px bg-slate-200" aria-hidden />
        <a href="#" className="hover:text-brand-red transition-colors">Syarat &amp; Ketentuan</a>
      </div>
    </footer>
  );
}

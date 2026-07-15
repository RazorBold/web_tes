"use client";

import React from "react";
import { Search, Bell, ChevronDown, User } from "lucide-react";

export default function Topbar() {
  return (
    <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between gap-6 px-8 sticky top-0 z-40">
      {/* Brand title */}
      <div className="min-w-0">
        <h2 className="text-xl font-extrabold text-slate-800 tracking-tight leading-tight truncate">
          Nusantara <span className="text-brand-red">IoT</span> Platform
        </h2>
        <p className="text-[12px] text-slate-400 font-medium truncate">
          Smart Monitoring for a Smarter Indonesia
        </p>
        <p className="text-[10px] text-slate-300 font-semibold truncate hidden lg:block">
          Edited by <span className="text-brand-red">PT Telkom Indonesia</span>
        </p>
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
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-full text-[13px] bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-all placeholder-slate-400 text-slate-700"
          />
        </div>

        {/* Notification */}
        <button className="relative p-2.5 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-4 w-4 bg-brand-red text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white">
            5
          </span>
        </button>

        {/* Locale */}
        <button className="flex items-center gap-1.5 px-2.5 py-2 hover:bg-slate-100 rounded-full transition-colors border border-slate-200">
          <span className="text-sm select-none leading-none">🇮🇩</span>
          <span className="text-[12px] font-bold text-slate-600">ID</span>
          <ChevronDown className="h-3 w-3 text-slate-400" />
        </button>

        {/* Date & time */}
        <div className="hidden lg:block text-right leading-tight border-l border-slate-200 pl-4">
          <span className="text-[12px] font-bold text-slate-700 block">Selasa, 14 Juli 2026</span>
          <span className="text-[11px] font-medium text-slate-400 font-mono">10:45 WIB</span>
        </div>

        {/* User */}
        <button className="flex items-center gap-2.5 group pl-2">
          <div className="h-10 w-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500">
            <User className="h-5 w-5" />
          </div>
          <div className="text-left leading-none hidden sm:block">
            <h4 className="text-[13px] font-bold text-slate-800 leading-tight">Abi Tiyoso</h4>
            <span className="text-[11px] font-medium text-slate-400 mt-0.5 block">Admin</span>
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />
        </button>
      </div>
    </header>
  );
}

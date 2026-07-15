"use client";

import React from "react";
import { ArrowUp } from "lucide-react";

export default function EnergyOverview() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between h-[220px] group">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <h3 className="font-bold text-slate-800 text-[11px] tracking-wider uppercase">
          Energy Overview
        </h3>
        <span className="text-[10px] font-bold text-slate-400">This Month</span>
      </div>

      {/* Main Split Content */}
      <div className="flex-1 flex items-center justify-between gap-2 mt-2">
        {/* Left Column: Data */}
        <div className="flex-1 flex flex-col justify-between h-full">
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide leading-none">
              Total Energy
            </span>
            <h4 className="text-2xl font-extrabold text-slate-800 tracking-tight leading-none mt-1.5 flex items-baseline gap-0.5">
              6,759.13 <span className="text-xs font-bold text-slate-400 font-sans">MWh</span>
            </h4>

            {/* Trend info in single clean line (no outline badge) */}
            <div className="flex items-center gap-1 mt-1.5 leading-none">
              <span className="text-[10px] font-extrabold text-emerald-500 flex items-center">
                <ArrowUp className="h-3.5 w-3.5" />
                1.81%
              </span>
              <span className="text-[9px] font-bold text-slate-500">
                vs last month
              </span>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-2 mt-2">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide leading-none block">
              Energy Loss
            </span>
            <span className="text-xs font-extrabold text-brand-red tracking-tight block mt-1">
              1.78 %
            </span>
          </div>
        </div>

        {/* Right Column: Thunderbolt SVG */}
        <div className="h-16 w-16 opacity-90 flex-shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
          <svg viewBox="0 0 100 100" className="h-full w-full">
            <path
              d="M55,5 L15,55 L45,55 L35,95 L85,45 L50,45 Z"
              fill="url(#zap-grad)"
              stroke="#F59E0B"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <defs>
              <linearGradient id="zap-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FEF3C7" />
                <stop offset="100%" stopColor="#F59E0B" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
    </div>
  );
}


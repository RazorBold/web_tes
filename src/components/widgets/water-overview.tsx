"use client";

import React from "react";
import { ArrowUp } from "lucide-react";

export default function WaterOverview() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between h-[220px] group">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <h3 className="font-bold text-slate-800 text-[11px] tracking-wider uppercase">
          Water Overview
        </h3>
        <span className="text-[10px] font-bold text-slate-400">This Month</span>
      </div>

      {/* Main Split Content */}
      <div className="flex-1 flex items-center justify-between gap-2 mt-2">
        {/* Left Column: Data */}
        <div className="flex-1 flex flex-col justify-between h-full">
          <div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide leading-none">
              Total Usage
            </span>
            <h4 className="text-2xl font-extrabold text-slate-800 tracking-tight leading-none mt-1.5 flex items-baseline gap-0.5">
              9,265 <span className="text-xs font-bold text-slate-400 font-sans">m³</span>
            </h4>
            
            {/* Trend info in single clean line (no outline badge) */}
            <div className="flex items-center gap-1 mt-1.5 leading-none">
              <span className="text-[10px] font-extrabold text-emerald-500 flex items-center">
                <ArrowUp className="h-3.5 w-3.5" />
                6.2%
              </span>
              <span className="text-[9px] font-bold text-slate-500">
                vs last month
              </span>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-2 mt-2">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide leading-none block">
              Daily Average
            </span>
            <span className="text-xs font-extrabold text-slate-700 tracking-tight block mt-1">
              308 m³ / day
            </span>
          </div>
        </div>

        {/* Right Column: Droplet Graphic */}
        <div className="h-16 w-16 opacity-90 flex-shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
          <svg viewBox="0 0 100 100" className="h-full w-full">
            <path
              d="M50,0 C75,40 85,60 85,75 C85,90 70,100 50,100 C30,100 15,90 15,75 C15,60 25,40 50,0 Z"
              fill="url(#water-grad)"
            />
            <path
              d="M50,90 C65,90 75,80 75,70 C75,60 65,50 50,30 C35,50 25,60 25,70 C25,80 35,90 50,90 Z"
              fill="white"
              opacity="0.15"
            />
            <path
              d="M30,75 Q40,70 50,75 T70,75 Q60,82 50,80 T30,75"
              fill="white"
              opacity="0.3"
            />
            <defs>
              <linearGradient id="water-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FEF2F2" />
                <stop offset="55%" stopColor="#FCA5A5" />
                <stop offset="100%" stopColor="#EF4444" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
    </div>
  );
}


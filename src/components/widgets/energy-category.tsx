"use client";

import React from "react";
import BaseChart from "@/components/charts/base-chart";

interface CategoryItem {
  name: string;
  percentage: number;
  value: number;
  color: string;
}

const categories: CategoryItem[] = [
  { name: "Residential", percentage: 42.6, value: 2879, color: "#DC2626" },
  { name: "Commercial", percentage: 52.1, value: 3523, color: "#475569" },
  { name: "Street Light", percentage: 4.1, value: 277, color: "#F97316" },
  { name: "Internal & Utilities", percentage: 1.2, value: 81, color: "#3B82F6" },
];

export default function EnergyCategory() {
  // Chart options
  const option = {
    tooltip: {
      trigger: "item",
      formatter: "{b}: {c} MWh ({d}%)",
      textStyle: {
        fontFamily: "Inter, sans-serif",
        fontSize: 13,
      },
    },
    color: categories.map((c) => c.color),
    series: [
      {
        name: "Energy Source",
        type: "pie",
        radius: ["55%", "80%"],
        center: ["50%", "50%"],
        avoidLabelOverlap: false,
        label: {
          show: false,
        },
        emphasis: {
          label: {
            show: false,
          },
        },
        labelLine: {
          show: false,
        },
        data: categories.map((c) => ({
          value: c.value,
          name: c.name,
        })),
      },
    ],
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col h-[220px]">
      {/* Header */}
      <h3 className="font-bold text-slate-800 text-[13px] tracking-wider uppercase border-b border-slate-100 pb-2">
        Energy By Category
      </h3>

      {/* Body: donut + legend */}
      <div className="flex-1 flex items-center gap-4 mt-2 min-w-0">
        {/* Chart Wrapper with Center Label */}
        <div className="relative w-[104px] h-[104px] flex-shrink-0">
          <BaseChart option={option} className="w-full h-full" />
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center leading-none">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
              Total
            </span>
            <span className="text-[14px] font-extrabold text-slate-800 font-mono mt-1">
              6,759
            </span>
            <span className="text-[11px] font-bold text-slate-500 mt-0.5">MWh</span>
          </div>
        </div>

        {/* Custom Legend Section */}
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-2">
          {categories.map((item) => (
            <div key={item.name} className="flex items-center gap-2 min-w-0">
              {/* Bullet */}
              <span
                className="h-2 w-2 rounded-sm flex-shrink-0"
                style={{ backgroundColor: item.color }}
              ></span>

              {/* Name + MWh stacked */}
              <div className="min-w-0 flex-1 leading-tight">
                <span className="block text-[13px] font-bold text-slate-700 truncate">
                  {item.name}
                </span>
                <span className="block text-[11px] font-semibold text-slate-400 font-mono">
                  {item.value.toLocaleString("en-US")} MWh
                </span>
              </div>

              {/* Percentage */}
              <span className="text-[13px] font-extrabold text-slate-800 font-mono flex-shrink-0">
                {item.percentage}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

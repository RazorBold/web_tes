"use client";

import React from "react";
import { CloudRain, Wind, Droplets, Cloud, Sun, CloudSun, MapPin } from "lucide-react";

interface HourlyForecast {
  time: string;
  temp: number;
  icon: "cloud" | "rain" | "sun" | "cloud-sun";
}

const forecasts: HourlyForecast[] = [
  { time: "10:00", temp: 26, icon: "rain" },
  { time: "11:00", temp: 26, icon: "rain" },
  { time: "12:00", temp: 27, icon: "cloud-sun" },
  { time: "13:00", temp: 28, icon: "sun" },
  { time: "14:00", temp: 29, icon: "cloud-sun" },
  { time: "15:00", temp: 29, icon: "rain" },
];

function renderWeatherIcon(type: HourlyForecast["icon"], className = "h-4 w-4") {
  switch (type) {
    case "rain":
      return <CloudRain className={`${className} text-blue-500`} />;
    case "sun":
      return <Sun className={`${className} text-amber-500`} />;
    case "cloud-sun":
      return <CloudSun className={`${className} text-slate-400`} />;
    default:
      return <Cloud className={`${className} text-slate-400`} />;
  }
}

export default function WeatherWidget() {
  return (
    <div className="bg-white/45 backdrop-blur-md border border-white/70 rounded-2xl p-5 shadow-sm flex flex-col h-[420px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center">
            <CloudRain className="h-5 w-5 text-blue-500" />
          </div>
          <h3 className="font-bold text-slate-800 text-base">Cuaca Indonesia</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold text-slate-400">Sumber: BMKG</span>
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center text-white text-[8px] font-extrabold">
            BMKG
          </div>
        </div>
      </div>

      {/* Current conditions card */}
      <div className="bg-gradient-to-br from-blue-50 to-slate-50 border border-blue-100 rounded-2xl p-4 mt-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <CloudRain className="h-14 w-14 text-blue-400 flex-shrink-0" strokeWidth={1.5} />
          <div className="min-w-0">
            <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
              <MapPin className="h-3 w-3 text-brand-red" /> Jakarta Pusat
            </span>
            <h4 className="text-4xl font-extrabold text-slate-800 tracking-tight leading-none mt-1">
              29<span className="text-xl align-top text-slate-400">°C</span>
            </h4>
            <span className="text-xs font-semibold text-slate-500 mt-1 block">Hujan Ringan</span>
          </div>
        </div>

        {/* Humidity & Wind */}
        <div className="flex flex-col gap-2.5 flex-shrink-0">
          <div className="flex items-center gap-2 bg-white/70 rounded-xl px-3 py-2 border border-blue-100">
            <Droplets className="h-4 w-4 text-blue-500 flex-shrink-0" />
            <div className="leading-tight">
              <span className="text-[9px] font-semibold text-slate-400 block">Kelembapan</span>
              <span className="text-sm font-extrabold text-slate-700">73%</span>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white/70 rounded-xl px-3 py-2 border border-blue-100">
            <Wind className="h-4 w-4 text-blue-500 flex-shrink-0" />
            <div className="leading-tight">
              <span className="text-[9px] font-semibold text-slate-400 block">Angin</span>
              <span className="text-sm font-extrabold text-slate-700">10 km/h</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hourly forecast */}
      <div className="flex-1 flex flex-col justify-center mt-2">
        <div className="grid grid-cols-6 gap-2">
          {forecasts.map((fc, i) => (
            <div
              key={i}
              className="flex flex-col items-center bg-slate-50 rounded-xl py-3 border border-slate-100"
            >
              <span className="text-[10px] font-semibold text-slate-400 font-mono">{fc.time}</span>
              {renderWeatherIcon(fc.icon, "h-5 w-5 my-2")}
              <span className="text-[13px] font-extrabold text-slate-700 font-mono">{fc.temp}°</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

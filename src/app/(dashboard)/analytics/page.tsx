"use client";

import React from "react";
import Section from "@/components/layout/section";
import KpiStats from "@/components/widgets/kpi-stats";
import FleetTrackingDetailed from "@/components/widgets/fleet-tracking-detailed";
import FloodSmartMeter from "@/components/widgets/flood-smart-meter";
import TotalEnergyWidget from "@/components/widgets/total-energy-widget";
import TotalWaterWidget from "@/components/widgets/total-water-widget";
import TopWaterMeters from "@/components/widgets/top-water-meters";
import PowerLosses from "@/components/widgets/power-losses";
import EnvironmentGrid from "@/components/widgets/environment-grid";
import WeatherWidget from "@/components/widgets/weather-widget";
import { useDashboardWidgetsStore } from "@/stores/dashboard-widgets-store";

export default function AnalyticsPage() {
  const visibility = useDashboardWidgetsStore((s) => s.visibility);

  let n = visibility.kpi ? 1 : 0;
  const numFleet = visibility.fleet ? ++n : 0;
  const numWater = visibility.water ? ++n : 0;
  const numFlood = visibility.flood ? ++n : 0;
  const numPower = visibility.power ? ++n : 0;
  const numTemphum = visibility.temphum ? ++n : 0;
  const numWeather = visibility.weather ? ++n : 0;

  const row2Visible = visibility.fleet || visibility.water;
  const row3Visible =
    visibility.flood || visibility.power || visibility.temphum || visibility.weather;

  return (
    <div className="space-y-4 pb-4">
      {/* 1. KPI Nasional */}
      {visibility.kpi && (
        <Section num={1} title="Ringkasan KPI Nasional">
          <KpiStats />
        </Section>
      )}

      {/* 2. Transportation + Water — Transportation melebar mengisi ruang saat Water disembunyikan.
          ⬇️ Ubah rasio lebar lewat flex-[..] di bawah: Transportation vs Water. */}
      {row2Visible && (
        <div className="flex flex-col lg:flex-row gap-3 items-stretch">
          {visibility.fleet && (
            <div className="flex-[11] min-w-0">
              <Section num={numFleet} title="Transportation Monitoring" className="h-full">
                <FleetTrackingDetailed />
              </Section>
            </div>
          )}
          {visibility.water && (
            <div className="flex-[9] min-w-0">
              <Section num={numWater} title="Water Monitoring" className="h-full">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <TotalWaterWidget />
                  <TopWaterMeters />
                </div>
              </Section>
            </div>
          )}
        </div>
      )}

      {/* 3. Flood + Energy + Environment + Weather — satu baris.
          ⬇️ Rasio lebar diatur lewat flex-[..]; `min-w-[..]` adalah lebar minimum
             sebelum sebuah section turun ke baris berikutnya (Energy butuh dua kali
             lipat karena memuat dua kartu). */}
      {row3Visible && (
        <div className="flex flex-col lg:flex-row lg:flex-wrap gap-3 items-stretch">
          {visibility.flood && (
            <div className="flex-[1] lg:min-w-[380px]">
              <Section num={numFlood} title="Flood Monitoring" className="h-full">
                <FloodSmartMeter />
              </Section>
            </div>
          )}
          {visibility.power && (
            <div className="flex-[2] lg:min-w-[620px]">
              <Section num={numPower} title="Energy Monitoring" className="h-full">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <TotalEnergyWidget />
                  <PowerLosses />
                </div>
              </Section>
            </div>
          )}
          {visibility.temphum && (
            <div className="flex-[1] lg:min-w-[340px]">
              <Section num={numTemphum} title="Environment Monitoring" className="h-full">
                <EnvironmentGrid />
              </Section>
            </div>
          )}
          {visibility.weather && (
            <div className="flex-[1] lg:min-w-[340px]">
              <Section num={numWeather} title="Weather Station" className="h-full">
                <WeatherWidget />
              </Section>
            </div>
          )}
        </div>
      )}

      {!row2Visible && !row3Visible && !visibility.kpi && (
        <div className="text-center py-16 text-sm font-bold text-slate-400 border border-dashed border-slate-300 rounded-2xl">
          Semua modul disembunyikan. Aktifkan kembali di Settings → Modul IoT Dashboard Platform.
        </div>
      )}
    </div>
  );
}

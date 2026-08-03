"use client";

import CctvLiveCard from "@/components/cctv/v1/cctv-live-card";
import CctvAiSummaryCard from "@/components/cctv/v1/cctv-ai-summary-card";
import KpiStats from "@/components/widgets/kpi-stats";
import FleetMap from "@/components/widgets/fleet-map";
import FloodSmartMeter from "@/components/widgets/flood-smart-meter";
import TotalEnergyWidget from "@/components/widgets/total-energy-widget";
import TotalWaterWidget from "@/components/widgets/total-water-widget";
import EnvironmentGrid from "@/components/widgets/environment-grid";
import WeatherWidget from "@/components/widgets/weather-widget";
import Section from "@/components/layout/section";

export default function OverviewDashboardPage() {
  return (
    <div className="flex flex-col gap-3 pb-4">
      {/* 1. Live Monitoring & AI Analytics — kartu yang sama persis dengan halaman
          /cctv, supaya kamera, aliran video, dan angkanya tidak lagi berbeda antar
          halaman. Dulu bagian ini memakai carousel & panel tab dengan angka
          hardcoded sendiri, sehingga kamera yang sama melaporkan jumlah berbeda
          di dua halaman.

          Tingginya sengaja mengikuti isi, bukan dipatok 48vh seperti dulu: kartu
          live berbentuk 16:9, jadi tingginya ditentukan lebar kolomnya. Kalau
          dipaksa setinggi 48vh, yang muncul justru ruang kosong di bawah video. */}
      <Section num={1} title="Live Monitoring & AI Analytics" className="flex-shrink-0">
        {/* `items-start`: kartu live berbentuk 16:9, jadi tingginya sudah pasti
            dari lebarnya. Kalau dibiarkan meregang menyamai kartu analitik yang
            lebih tinggi, sisa ruangnya muncul sebagai pita putih kosong di bawah
            video — bukan video yang membesar. */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CctvLiveCard defaultCamId="1" modeType="crowd" nvr nvrDefaultId="antrian" />
            <CctvLiveCard defaultCamId="3" modeType="face" nvr nvrDefaultId="visitor" />
          </div>
          {/* Dashboard cuma punya satu slot untuk mewakili kedua panel /cctv,
              jadi kartu ini merangkum SEMUA model AI sekaligus: hitung orang,
              kerumunan, gender, dan mood. */}
          <div className="lg:col-span-4 min-h-0">
            <CctvAiSummaryCard />
          </div>
        </div>
      </Section>

      {/* 2–5. Sensor IoT — natural height below, all data visible (scrolls) */}
      {/* 2. National Infrastructure Summary */}
      <Section num={2} title="National Infrastructure Summary">
        <KpiStats />
      </Section>

      {/* 3-4. Transportation / Water monitoring */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        <Section num={3} title="Transportation Monitoring">
          <FleetMap />
        </Section>

        <Section num={4} title="Water Monitoring">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FloodSmartMeter />
            <TotalWaterWidget />
          </div>
        </Section>
      </div>

      {/* 5-7. Energy / Environment / Weather Station monitoring */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
        <Section num={5} title="Energy Monitoring">
          <TotalEnergyWidget />
        </Section>

        <Section num={6} title="Environment Monitoring">
          <EnvironmentGrid />
        </Section>

        <Section num={7} title="Weather Station">
          <WeatherWidget />
        </Section>
      </div>
    </div>
  );
}

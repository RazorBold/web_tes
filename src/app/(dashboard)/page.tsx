"use client";

import CctvCarousel from "@/components/widgets/cctv-carousel";
import CctvAnalyticsTabs from "@/components/widgets/cctv-analytics-tabs";
import KpiStats from "@/components/widgets/kpi-stats";
import FleetMap from "@/components/widgets/fleet-map";
import FloodSmartMeter from "@/components/widgets/flood-smart-meter";
import TotalEnergyWidget from "@/components/widgets/total-energy-widget";
import TotalWaterWidget from "@/components/widgets/total-water-widget";
import Section from "@/components/layout/section";

export default function OverviewDashboardPage() {
  return (
    <div className="space-y-6 pb-4">
      {/* 1. Live Monitoring & AI */}
      <Section num={1} title="Live Monitoring & AI Analytics">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:h-[420px]">
          <div className="lg:col-span-8 h-full">
            <CctvCarousel />
          </div>
          <div className="lg:col-span-4 h-full">
            <CctvAnalyticsTabs />
          </div>
        </div>
      </Section>

      {/* 2. National Infrastructure Summary */}
      <Section num={2} title="National Infrastructure Summary">
        <KpiStats />
      </Section>

      {/* Bottom: Transportation / Water / Energy monitoring */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">
        <Section num={3} title="Transportation Monitoring" className="xl:col-span-2">
          <FleetMap />
        </Section>

        <Section num={4} title="Water Monitoring" className="xl:col-span-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FloodSmartMeter />
            <TotalWaterWidget />
          </div>
        </Section>

        <Section num={5} title="Energy Monitoring" className="xl:col-span-1">
          <TotalEnergyWidget />
        </Section>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import CctvLiveCard from "@/components/cctv/v2/cctv-live-card";
import CctvPeopleCrowdCard from "@/components/cctv/v2/cctv-people-crowd-card";
import CctvSnapshotEvidenceCard from "@/components/cctv/v2/cctv-snapshot-evidence-card";
import CctvGenderPieCard from "@/components/cctv/v2/cctv-gender-pie-card";
import CctvMoodBarsCard from "@/components/cctv/v2/cctv-mood-bars-card";
import DesignSwitcher from "@/components/cctv/design-switcher";
import Section from "@/components/layout/section";
import { AI_MODELS } from "@/config/cctv";

/**
 * CCTV & AI — varian tampilan 2.
 *
 * Berangkat sebagai salinan persis V1 supaya ada titik awal yang sudah jalan;
 * mulai berbeda begitu kamu mengubah apa pun di sini atau di
 * @/components/cctv/v2. Perubahan di sini TIDAK menyentuh V1 sama sekali.
 *
 * Satu-satunya yang dipakai bersama adalah @/components/cctv/shared (pemutar
 * stream & overlay deteksi). Kalau V2 butuh pemutar yang benar-benar beda,
 * bikin komponen baru di folder v2 yang MEMBUNGKUS pemutar shared — jangan
 * menyalin pemutarnya, karena salinan kedua berarti dua tempat yang harus
 * diperbaiki setiap kali NVR berulah.
 */
export default function CctvV2Page() {
  return (
    <div className="flex flex-col gap-4 pb-6">
      <DesignSwitcher />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Section
          num={1}
          title="People Crowded"
          subtitle={`Kepadatan, hitung orang & heatmap · ${AI_MODELS.people.model} · ${AI_MODELS.crowd.model} · ${AI_MODELS.heatmap.model}`}
        >
          <div className="flex flex-col gap-4">
            <CctvLiveCard defaultCamId="1" modeType="crowd" nvr nvrDefaultId="antrian" />
            <div className="grid grid-cols-1 sm:grid-cols-2 auto-rows-[450px] gap-4">
              <CctvPeopleCrowdCard />
              <CctvSnapshotEvidenceCard />
            </div>
          </div>
        </Section>

        <Section
          num={2}
          title="Face Recognition"
          subtitle={`Identifikasi, gender & mood pengunjung · ${AI_MODELS.face.model} · ${AI_MODELS.gender.model} · ${AI_MODELS.mood.model}`}
        >
          <div className="flex flex-col gap-4">
            <CctvLiveCard defaultCamId="3" modeType="face" nvr nvrDefaultId="visitor" />
            <div className="grid grid-cols-1 sm:grid-cols-2 auto-rows-[450px] gap-4">
              <CctvGenderPieCard />
              <CctvMoodBarsCard />
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}

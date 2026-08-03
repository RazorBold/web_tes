"use client";

import React from "react";
import CctvLiveCard from "@/components/cctv/v1/cctv-live-card";
import CctvPeopleCountingCard from "@/components/cctv/v1/cctv-people-counting-card";
import CctvVisitorEvidenceCard from "@/components/cctv/v1/cctv-visitor-evidence-card";
import CctvPeopleCrowdCard from "@/components/cctv/v1/cctv-people-crowd-card";
import CctvSnapshotEvidenceCard from "@/components/cctv/v1/cctv-snapshot-evidence-card";
import DesignSwitcher from "@/components/cctv/design-switcher";
import Section from "@/components/layout/section";
import { AI_MODELS } from "@/config/cctv";

/**
 * CCTV & AI — varian tampilan 1.
 *
 * Satu panel = satu kamera + kartu-kartu yang datanya BENAR-BENAR dari kamera
 * itu. Aturan itu yang menentukan isi kedua panel di bawah:
 *
 *   Panel 1 · Kamera 1 (Visitor Counting) → People Counting + bukti lintasannya
 *   Panel 2 · Kamera 2 (Antrian & Heatmap) → People Crowded + Heatmap
 *
 * Sebelumnya susunannya tidak begitu: People Counting dan People Crowded
 * berdesakan di satu kartu di bawah panel yang separuh datanya bukan miliknya,
 * sementara panel 2 diisi Face Recognition. Panel Face Recognition dihapus atas
 * permintaan pemakai — kartu Gender & Mood masih tersimpan di folder v2 kalau
 * suatu saat dihidupkan lagi.
 *
 * Semua kartunya diimpor dari @/components/cctv/v1 dan boleh diubah sebebasnya
 * tanpa menyentuh V2. Yang HARAM disalin ke sini adalah isi
 * @/components/cctv/shared (pemutar stream & overlay deteksi) — dua salinan
 * mesin NVR akan berjalan sendiri-sendiri dan diam-diam berbeda.
 *
 * `auto-rows-[450px]` dipakai nilai yang sama di kedua panel — itulah yang
 * menjaga keempat kartu analitik tetap sama tinggi DAN kedua panel tetap
 * sejajar. Kalau nilainya diubah, ubah DI KEDUA grid.
 */
export default function CctvV1Page() {
  return (
    <div className="flex flex-col gap-4 pb-6">
      <DesignSwitcher />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Section
          num={1}
          title="People Counting"
          subtitle={`Hitung orang masuk & keluar · ${AI_MODELS.people.model}`}
        >
          <div className="flex flex-col gap-4">
            <CctvLiveCard defaultCamId="1" modeType="crowd" nvr nvrDefaultId="visitor" />
            <div className="grid grid-cols-1 sm:grid-cols-2 auto-rows-[450px] gap-4">
              <CctvPeopleCountingCard />
              <CctvVisitorEvidenceCard />
            </div>
          </div>
        </Section>

        <Section
          num={2}
          title="People Crowded & Heatmap"
          subtitle={`Kepadatan antrean & titik pijak pengunjung · ${AI_MODELS.crowd.model} · ${AI_MODELS.heatmap.model}`}
        >
          <div className="flex flex-col gap-4">
            <CctvLiveCard defaultCamId="1" modeType="crowd" nvr nvrDefaultId="antrian" />
            <div className="grid grid-cols-1 sm:grid-cols-2 auto-rows-[450px] gap-4">
              <CctvPeopleCrowdCard />
              <CctvSnapshotEvidenceCard />
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}

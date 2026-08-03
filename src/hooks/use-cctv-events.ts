"use client";

import { useEffect, useState } from "react";
import type { CctvAiAnnotations, CctvAiRef, CctvAiSetup, CctvAiStatus, CctvAiTrack, CctvAiZone } from "@/types/cctv";

interface CctvEventsState {
  ref: CctvAiRef | null;
  boxes: CctvAiAnnotations["boxes"];
  /** Garis hitung — dari pesan init, atau menyusul lewat pesan berkala. */
  lines: CctvAiAnnotations["lines"];
  /** Zona poligon yang dikonfigurasi di kamera (mis. area antrean). */
  zones: CctvAiZone[];
  inout: number[][] | null;
  tracks: CctvAiTrack[];
  status: CctvAiStatus;
}

const EMPTY: CctvEventsState = {
  ref: null,
  boxes: [],
  lines: [],
  zones: [],
  inout: null,
  tracks: [],
  status: "idle",
};

const initialFor = (cameraId: string | null): CctvEventsState => ({
  ...EMPTY,
  status: cameraId ? "connecting" : "idle",
});

/**
 * Anotasi AI satu kamera lewat SSE (`/api/v1/cctv/cameras/:id/events`).
 *
 * Bukan React Query: ini aliran dorong yang tak berujung, bukan permintaan yang
 * selesai lalu di-cache — jadi EventSource langsung lebih tepat. EventSource juga
 * sudah menyambung ulang sendiri saat koneksi putus.
 */
export function useCctvEvents(cameraId: string | null): CctvEventsState {
  const [state, setState] = useState<CctvEventsState>(() => initialFor(cameraId));
  const [trackedId, setTrackedId] = useState(cameraId);

  // Pola resmi React untuk menyesuaikan state ketika prop berubah — dilakukan
  // saat render, bukan di dalam efek. Kalau ditaruh di efek, anotasi kamera lama
  // sempat tampil di kamera baru selama satu render, dan React Compiler pun
  // menolaknya karena memicu render bertingkat.
  if (cameraId !== trackedId) {
    setTrackedId(cameraId);
    setState(initialFor(cameraId));
  }

  useEffect(() => {
    if (!cameraId) return;

    const source = new EventSource(`/api/v1/cctv/cameras/${cameraId}/events`);

    // Setelan kamera: resolusi acuan, garis hitung, dan zona. Datang sekali di
    // awal koneksi dan berlaku sepanjang sesi.
    source.addEventListener("setup", (e) => {
      const setup = JSON.parse((e as MessageEvent).data) as CctvAiSetup;
      setState((s) => ({
        ...s,
        ref: setup.ref,
        // Garis dari init tidak menimpa garis yang mungkin sudah datang lewat
        // pesan berkala, dan sebaliknya — keduanya sama-sama sah.
        lines: setup.lines.length ? setup.lines : s.lines,
        zones: setup.zones.length ? setup.zones : s.zones,
      }));
    });

    source.addEventListener("annotations", (e) => {
      const a = JSON.parse((e as MessageEvent).data) as CctvAiAnnotations;
      setState((s) => ({
        ...s,
        boxes: a.boxes,
        // Garis & pencacah bersifat "menempel": keduanya menggambarkan setelan
        // kamera (garis hitung) dan angka berjalan, bukan potret per-frame —
        // jadi nilai lama dipertahankan sampai ada kiriman baru.
        lines: a.lines.length ? a.lines : s.lines,
        inout: a.inout ?? s.inout,
        tracks: a.tracks.length ? a.tracks : s.tracks,
      }));
    });

    source.addEventListener("status", (e) => {
      const { status } = JSON.parse((e as MessageEvent).data) as { status: CctvAiStatus };
      setState((s) => ({ ...s, status }));
    });

    source.onerror = () => setState((s) => ({ ...s, status: "error" }));

    return () => source.close();
  }, [cameraId]);

  return state;
}

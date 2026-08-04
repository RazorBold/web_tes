"use client";

import React, { useEffect, useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";

/**
 * Tombol layar penuh untuk SELURUH halaman (Fullscreen API pada
 * `document.documentElement`), bukan untuk satu kartu kamera — yang itu sudah
 * punya tombolnya sendiri di tiap kartu live.
 *
 * Keadaannya diikuti dari `fullscreenchange`, BUKAN dari klik tombol ini.
 * Alasannya: pemakai bisa keluar lewat Esc atau F11 tanpa menyentuh tombol,
 * dan kalau ikonnya cuma di-toggle sendiri, ia akan berbohong begitu itu
 * terjadi. Dengan mendengarkan dokumen, ikonnya selalu menggambarkan keadaan
 * yang sebenarnya.
 *
 * Sengaja tidak ada penyelarasan awal di dalam efek: memuat halaman dalam
 * keadaan layar penuh praktis tidak terjadi (reload keluar dari fullscreen
 * sendiri), sementara setState serentak di badan efek dilarang aturan React
 * Compiler.
 */
export default function FullscreenButton() {
  const [penuh, setPenuh] = useState(false);
  /** Browser menolak / tidak mendukung — tombolnya disembunyikan saja. */
  const [didukung, setDidukung] = useState(true);

  useEffect(() => {
    const ikuti = () => setPenuh(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", ikuti);
    return () => document.removeEventListener("fullscreenchange", ikuti);
  }, []);

  const toggle = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      // Ditolak (mis. bukan dari gestur pengguna, atau diblokir kebijakan izin).
      // Disembunyikan alih-alih dibiarkan sebagai tombol yang tak pernah bekerja.
      setDidukung(false);
    }
  };

  if (!didukung) return null;

  return (
    <button
      onClick={toggle}
      aria-pressed={penuh}
      aria-label={penuh ? "Keluar dari layar penuh" : "Layar penuh"}
      title={penuh ? "Keluar dari layar penuh (Esc)" : "Layar penuh"}
      className="p-2.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 rounded-full transition-colors cursor-pointer"
    >
      {penuh ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
    </button>
  );
}

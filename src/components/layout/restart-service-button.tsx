"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import { MemoryStick, LoaderCircle } from "lucide-react";
import { apiPost } from "@/lib/api";

interface HasilRestart {
  queued: string;
  file: string | null;
}

/**
 * Menyuruh host NVR memuat ulang layanannya supaya memori yang tertahan dilepas.
 *
 * Lewat route sendiri (`/api/v1/hardware/restart-service`), bukan memanggil
 * `192.168.88.248:9088` langsung dari browser: layanan itu tidak mengirim header
 * CORS, jadi browser akan memblokirnya — dan alamat internalnya jadi tidak ikut
 * bocor ke setiap penonton dashboard.
 *
 * Tombolnya dikunci selama permintaan berjalan. Layanan di seberang hanya
 * MENGANTREKAN restart lalu menjawab dalam ±0,5 ms, jadi tanpa kunci itu satu
 * ketukan cepat bisa mengantrekan beberapa restart sekaligus.
 */
export default function RestartServiceButton() {
  const [sedangJalan, setSedangJalan] = useState(false);

  const jalankan = async () => {
    if (sedangJalan) return;
    setSedangJalan(true);
    try {
      await apiPost<HasilRestart>("hardware/restart-service", {});
      // Sengaja TIDAK menyebut angka memori. Layanan di seberang hanya
      // mengantrekan restart, jadi angka apa pun yang dibaca sesaat sesudahnya
      // belum tentu sudah berubah — dan angka yang tidak berubah membuat tombol
      // yang bekerja terbaca seperti tombol rusak.
      toast.success("Status OK — layanan NVR dimuat ulang", {
        description: "Perintah masuk antrean. Memori akan turun beberapa detik lagi.",
      });
    } catch (err) {
      toast.error("Gagal memuat ulang layanan", {
        description: err instanceof Error ? err.message : "Tidak bisa menghubungi host NVR",
      });
    } finally {
      setSedangJalan(false);
    }
  };

  return (
    <button
      onClick={jalankan}
      disabled={sedangJalan}
      aria-label="Bersihkan memori NVR"
      title="Muat ulang layanan NVR untuk melepas memori yang tertahan"
      className="p-2.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 rounded-full transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-wait"
    >
      {sedangJalan ? (
        <LoaderCircle className="h-5 w-5 animate-spin" />
      ) : (
        <MemoryStick className="h-5 w-5" />
      )}
    </button>
  );
}

import React from "react";

/**
 * Bilah dasar halaman — sengaja kosong.
 *
 * Teksnya (copyright, "Data Center Indonesia", tautan kebijakan) dihapus atas
 * permintaan pemakai. Elemennya sendiri dipertahankan sebagai penutup putih
 * polos: area isi di atasnya bisa di-scroll, dan garis tipis ini yang menandai
 * di mana halaman berakhir — tanpa itu baris terakhir kartu terlihat seperti
 * terpotong tepi layar.
 *
 * Kalau tingginya mau direbut balik untuk isi, hapus <Footer /> dari
 * app/(dashboard)/layout.tsx — komponen ini tidak menyimpan keadaan apa pun.
 */
export default function Footer() {
  return <footer className="flex-shrink-0 bg-white border-t border-slate-200 h-9" />;
}

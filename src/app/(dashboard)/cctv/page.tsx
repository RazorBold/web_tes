import { redirect } from "next/navigation";

/**
 * /cctv tidak lagi punya isi sendiri — tampilannya kini dua varian, /cctv/v1 dan
 * /cctv/v2.
 *
 * Jalur lamanya sengaja DIPERTAHANKAN sebagai pengalihan, bukan dihapus: sidebar
 * dan tautan yang sudah tersebar masih menunjuk ke /cctv, dan halaman 404 untuk
 * menu utama jelas bukan yang diinginkan. Mengganti tujuan varian bawaan cukup
 * dari satu baris di bawah ini.
 *
 * Dipakai redirect() (307, sementara), bukan permanentRedirect(): varian bawaan
 * masih mungkin berpindah ke v2, dan 308 akan disimpan browser sehingga
 * perubahannya tidak terasa sampai cache-nya dibuang.
 */
export default function CctvPage() {
  redirect("/cctv/v1");
}

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import type { VisitorOverview, VisitorDay, VisitorHit } from "@/lib/cctv-visitor";

export interface VisitorOverviewResponse extends VisitorOverview {
  history: VisitorDay[];
  /** Terisi bila penarikan terakhir dari NVR gagal; angkanya tetap disajikan. */
  syncWarning: string | null;
}

/**
 * Ringkasan Visitor Counting hari ini.
 *
 * Endpoint-nya menarik ulang dari NVR bila datanya sudah lewat 10 detik, jadi
 * polling 5 detik di sini bukan berarti membebani NVR tiap 5 detik —
 * sebagian besar panggilan hanya membaca MySQL.
 */
export function useCctvVisitor() {
  return useQuery({
    queryKey: ["cctv", "visitor", "overview"],
    queryFn: () => apiGet<VisitorOverviewResponse>("cctv/visitor/overview"),
    // Endpoint-nya sendiri menahan penarikan ke NVR lebih rapat dari 10 detik,
    // jadi polling 5 detik di sini sebagian besar hanya membaca MySQL.
    refetchInterval: 5_000,
    staleTime: 2_000,
  });
}

/**
 * Lintasan terbaru beserta gambarnya, untuk panel pemantauan.
 *
 * `enabled` dipakai supaya permintaan baru berjalan saat panelnya dibuka —
 * endpoint ini memanggil NVR dua kali (event + daftar gambar), jadi tidak pantas
 * berjalan di latar belakang untuk panel yang sedang tertutup.
 */
/**
 * Jendela bawaan daftar lintasan: sehari penuh.
 *
 * Bukan "beberapa jam terakhir" — terukur, garis hitung bisa sepi tiga jam
 * berturut-turut padahal hari itu dilewati 104 kali. Hasilnya sudah diurutkan
 * terbaru dulu lalu dipotong `limit`, jadi melebarkan jendela tidak membuat
 * daftarnya membanjir; yang berubah cuma seberapa jauh ke belakang ia mau
 * mencari sebelum menyerah.
 */
export const VISITOR_HITS_WINDOW_MIN = 1440;

export function useCctvVisitorHits(enabled: boolean, minutes = VISITOR_HITS_WINDOW_MIN, limit = 40) {
  return useQuery({
    queryKey: ["cctv", "visitor", "hits", minutes, limit],
    queryFn: () => apiGet<VisitorHit[]>(`cctv/visitor/hits?minutes=${minutes}&limit=${limit}`),
    enabled,
    refetchInterval: enabled ? 10_000 : false,
    staleTime: 5_000,
  });
}

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import type { HeatmapFrame } from "@/lib/cctv-heatmap";

/**
 * Daftar frame heatmap yang sudah dirender.
 *
 * Endpoint-nya hanya membaca database (balasan ±175 ms) dan memicu render frame
 * baru di latar tanpa ditunggu — jadi polling di sini tidak pernah membuat
 * pengguna menunggu proses render.
 */
export function useCctvHeatmap(limit = 12) {
  return useQuery({
    queryKey: ["cctv", "heatmap", "frames", limit],
    queryFn: () => apiGet<HeatmapFrame[]>(`cctv/heatmap/frames?limit=${limit}`),
    // Gambar baru datang tiap ~5 menit, jadi tak ada gunanya menyegar lebih
    // rapat dari ini.
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

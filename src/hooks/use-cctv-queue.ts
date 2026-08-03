import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import type { QueueOverview, QueueSample } from "@/lib/cctv-queue";

export interface QueueOverviewResponse extends QueueOverview {
  /** Terisi bila penarikan terakhir dari NVR gagal; angkanya tetap disajikan. */
  syncWarning: string | null;
}

/** Akumulasi People Crowded hari ini. */
export function useCctvQueue() {
  return useQuery({
    queryKey: ["cctv", "queue", "overview"],
    queryFn: () => apiGet<QueueOverviewResponse>("cctv/queue/overview"),
    // Sampel dari NVR baru masuk tiap ~30 detik, jadi polling lebih rapat dari
    // 10 detik hanya membaca ulang angka yang sama.
    refetchInterval: 10_000,
    staleTime: 5_000,
  });
}

/**
 * Sampel bertingkap gambar untuk panel bukti. Baru berjalan saat panelnya
 * dibuka — tidak ada gunanya menarik daftar gambar untuk panel yang tertutup.
 */
export function useCctvQueueSamples(enabled: boolean, limit = 40) {
  return useQuery({
    queryKey: ["cctv", "queue", "samples", limit],
    queryFn: () => apiGet<QueueSample[]>(`cctv/queue/samples?limit=${limit}`),
    enabled,
    refetchInterval: enabled ? 10_000 : false,
    staleTime: 5_000,
  });
}

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import type { CctvCamera } from "@/types/cctv";

/** Daftar kamera NVR yang tersedia untuk di-stream. */
export function useCctvCameras() {
  return useQuery({
    queryKey: ["cctv", "cameras"],
    queryFn: () => apiGet<CctvCamera[]>("cctv/cameras"),
    // Daftarnya statis (dari konfigurasi server), tidak perlu ikut polling 10s
    // seperti data sensor.
    staleTime: Infinity,
    refetchInterval: false,
  });
}

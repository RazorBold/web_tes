import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import type { WaterMeter, WaterZone, WaterOverview, WaterReadingPoint } from "@/types/water";

export function useWaterMeters() {
  return useQuery({
    queryKey: ["water", "meters"],
    queryFn: () => apiGet<WaterMeter[]>("water/meters"),
  });
}

export function useWaterOverview() {
  return useQuery({
    queryKey: ["water", "overview"],
    queryFn: () => apiGet<WaterOverview>("water/overview"),
  });
}

export function useWaterZones() {
  return useQuery({
    queryKey: ["water", "zones"],
    queryFn: () => apiGet<WaterZone[]>("water/zones"),
  });
}

export function useWaterMeterHistory(id: string) {
  return useQuery({
    queryKey: ["water", "meters", id, "history"],
    queryFn: () => apiGet<WaterReadingPoint[]>(`water/meters/${id}/history`),
    enabled: Boolean(id),
  });
}

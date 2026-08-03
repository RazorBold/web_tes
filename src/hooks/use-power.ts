import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import type { PowerMeter, PowerOverview, PowerQuality, PowerReadingPoint } from "@/types/power";

export function usePowerMeters() {
  return useQuery({
    queryKey: ["power", "meters"],
    queryFn: () => apiGet<PowerMeter[]>("power/meters"),
  });
}

export function usePowerOverview() {
  return useQuery({
    queryKey: ["power", "overview"],
    queryFn: () => apiGet<PowerOverview>("power/overview"),
  });
}

export function usePowerQuality() {
  return useQuery({
    queryKey: ["power", "quality"],
    queryFn: () => apiGet<PowerQuality>("power/quality"),
  });
}

export function usePowerMeterHistory(id: string) {
  return useQuery({
    queryKey: ["power", "meters", id, "history"],
    queryFn: () => apiGet<PowerReadingPoint[]>(`power/meters/${id}/history`),
    enabled: Boolean(id),
  });
}

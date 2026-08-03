import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import type { FloodSensor, FloodReadingPoint, FloodOverview } from "@/types/flood";

export function useFloodSensors() {
  return useQuery({
    queryKey: ["flood", "sensors"],
    queryFn: () => apiGet<FloodSensor[]>("flood/sensors"),
  });
}

export function useFloodSensor(id: string) {
  return useQuery({
    queryKey: ["flood", "sensors", id],
    queryFn: () => apiGet<FloodSensor>(`flood/sensors/${id}`),
    enabled: Boolean(id),
  });
}

export function useFloodSensorHistory(id: string) {
  return useQuery({
    queryKey: ["flood", "sensors", id, "history"],
    queryFn: () => apiGet<FloodReadingPoint[]>(`flood/sensors/${id}/history`),
    enabled: Boolean(id),
  });
}

export function useFloodOverview() {
  return useQuery({
    queryKey: ["flood", "overview"],
    queryFn: () => apiGet<FloodOverview>("flood/overview"),
  });
}

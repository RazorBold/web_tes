import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import type { FleetVehicle, FleetOverview } from "@/types/fleet";

export function useFleetVehicles() {
  return useQuery({
    queryKey: ["fleet", "vehicles"],
    queryFn: () => apiGet<FleetVehicle[]>("fleet/vehicles"),
  });
}

export function useFleetOverview() {
  return useQuery({
    queryKey: ["fleet", "overview"],
    queryFn: () => apiGet<FleetOverview>("fleet/overview"),
  });
}

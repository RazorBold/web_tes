import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import type { Device } from "@/types/device";

export function useDevices() {
  return useQuery({
    queryKey: ["devices"],
    queryFn: () => apiGet<Device[]>("devices"),
  });
}

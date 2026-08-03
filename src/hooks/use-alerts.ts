import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import type { Alert } from "@/types/alert";

export function useAlerts() {
  return useQuery({
    queryKey: ["alerts"],
    queryFn: () => apiGet<Alert[]>("alerts"),
  });
}

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import type { WeatherStation, WeatherOverview } from "@/types/weather";

export function useWeatherStations() {
  return useQuery({
    queryKey: ["weather", "stations"],
    queryFn: () => apiGet<WeatherStation[]>("weather/stations"),
  });
}

export function useWeatherOverview(stationId = "ws_01") {
  return useQuery({
    queryKey: ["weather", "overview", stationId],
    queryFn: () => apiGet<WeatherOverview>("weather/overview", { stationId }),
  });
}

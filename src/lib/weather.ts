import { query } from "@/lib/db";
import { RETENTION_DAYS } from "@/config/retention";
import type { WeatherStation, WeatherOverview } from "@/types/weather";

interface WeatherStationRow {
  id: string;
  name: string;
  zone: string;
  lat: number;
  lng: number;
}

export async function listWeatherStations(): Promise<WeatherStation[]> {
  const rows = await query<WeatherStationRow>("SELECT * FROM weather_stations");
  return rows;
}

interface WeatherReadingRow {
  temperature: number;
  humidity: number;
  wind_speed: number;
  wind_direction: number;
  rainfall: number;
  pressure: number;
  condition_text: string;
  observed_at: Date;
}

export async function getWeatherOverview(stationId: string): Promise<WeatherOverview | null> {
  const stations = await query<WeatherStationRow>("SELECT * FROM weather_stations WHERE id = ?", [stationId]);
  const station = stations[0];
  if (!station) return null;

  const latestRows = await query<WeatherReadingRow>(
    "SELECT * FROM weather_readings WHERE station_id = ? ORDER BY observed_at DESC LIMIT 1",
    [stationId]
  );
  const latest = latestRows[0];

  const last24h = await query<WeatherReadingRow>(
    `SELECT * FROM weather_readings
     WHERE station_id = ? AND observed_at >= (NOW() - INTERVAL 25 HOUR)
     ORDER BY observed_at ASC`,
    [stationId]
  );

  const dailyRows = await query<{ date: string; rainfall_sum: number }>(
    `SELECT DATE_FORMAT(observed_at, '%Y-%m-%d') AS date, SUM(rainfall) AS rainfall_sum
     FROM weather_readings
     WHERE station_id = ? AND observed_at >= (NOW() - INTERVAL ? DAY)
     GROUP BY DATE_FORMAT(observed_at, '%Y-%m-%d')
     ORDER BY date ASC`,
    [stationId, RETENTION_DAYS]
  );

  const avgTemp = last24h.length ? last24h.reduce((s, r) => s + r.temperature, 0) / last24h.length : 0;
  const maxTemp = last24h.length ? Math.max(...last24h.map((r) => r.temperature)) : 0;
  const avgWindSpeed = last24h.length ? last24h.reduce((s, r) => s + r.wind_speed, 0) / last24h.length : 0;
  const dailyRainfall = last24h.reduce((s, r) => s + r.rainfall, 0);

  return {
    station,
    current: latest
      ? {
          temperature: latest.temperature,
          humidity: latest.humidity,
          windSpeed: latest.wind_speed,
          windDirection: latest.wind_direction,
          rainfall: latest.rainfall,
          pressure: latest.pressure,
          condition: latest.condition_text,
          observedAt: latest.observed_at.toISOString(),
        }
      : {
          temperature: 0, humidity: 0, windSpeed: 0, windDirection: 0,
          rainfall: 0, pressure: 0, condition: "unknown", observedAt: new Date().toISOString(),
        },
    avgTemp: Math.round(avgTemp * 10) / 10,
    maxTemp: Math.round(maxTemp * 10) / 10,
    dailyRainfall: Math.round(dailyRainfall * 10) / 10,
    avgWindSpeed: Math.round(avgWindSpeed * 10) / 10,
    hourlyTemp: last24h.map((r) => ({
      time: `${String(r.observed_at.getHours()).padStart(2, "0")}:${String(r.observed_at.getMinutes()).padStart(2, "0")}`,
      temperature: r.temperature,
    })),
    dailyRainfall7d: dailyRows.map((r) => ({ date: r.date, rainfall: Math.round(Number(r.rainfall_sum) * 10) / 10 })),
  };
}

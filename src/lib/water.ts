import { query } from "@/lib/db";
import { RETENTION_DAYS } from "@/config/retention";
import type { WaterMeter, WaterZone, WaterOverview, WaterReadingPoint } from "@/types/water";

interface WaterMeterRow {
  id: string;
  name: string;
  zone: string;
  status: string;
  battery: number | null;
  flow_rate: number;
  total_volume: number;
  unit: string;
  last_reading_at: Date;
}

function mapMeter(r: WaterMeterRow): WaterMeter {
  return {
    id: r.id,
    name: r.name,
    zone: r.zone,
    status: r.status as WaterMeter["status"],
    battery: r.battery,
    flowRate: r.flow_rate,
    totalVolume: r.total_volume,
    unit: r.unit,
    lastReading: r.last_reading_at.toISOString(),
  };
}

export async function listWaterMeters(): Promise<WaterMeter[]> {
  const rows = await query<WaterMeterRow>("SELECT * FROM water_meters ORDER BY total_volume DESC");
  return rows.map(mapMeter);
}

export async function getWaterMeter(id: string): Promise<WaterMeter | null> {
  const rows = await query<WaterMeterRow>("SELECT * FROM water_meters WHERE id = ?", [id]);
  return rows[0] ? mapMeter(rows[0]) : null;
}

interface WaterReadingRow {
  flow_rate: number;
  total_volume: number;
  recorded_at: Date;
}

export async function getWaterMeterHistory(id: string): Promise<WaterReadingPoint[]> {
  const rows = await query<WaterReadingRow>(
    `SELECT flow_rate, total_volume, recorded_at FROM (
       SELECT flow_rate, total_volume, recorded_at FROM water_readings
       WHERE meter_id = ? ORDER BY recorded_at DESC LIMIT 50
     ) recent ORDER BY recorded_at ASC`,
    [id]
  );
  return rows.map((r) => ({
    recordedAt: r.recorded_at.toISOString(),
    flowRate: r.flow_rate,
    totalVolume: r.total_volume,
  }));
}

interface WaterZoneRow {
  id: string;
  name: string;
  status: string;
  pressure_bar: number;
}

function mapZone(r: WaterZoneRow): WaterZone {
  return { id: r.id, name: r.name, status: r.status as WaterZone["status"], pressureBar: r.pressure_bar };
}

export async function listWaterZones(): Promise<WaterZone[]> {
  const rows = await query<WaterZoneRow>("SELECT * FROM water_zones ORDER BY name ASC");
  return rows.map(mapZone);
}

export async function listLeakingZones(): Promise<WaterZone[]> {
  const zones = await listWaterZones();
  return zones.filter((z) => z.status === "leak");
}

export async function getWaterOverview(): Promise<WaterOverview> {
  // total_volume is a monotonically increasing gauge, not an interval reading — it
  // must never be SUMmed across multiple readings of the same day/meter (that
  // double/triple-counts once there's more than one reading per day, e.g. once a
  // live simulator is ticking every few seconds). Take the last (MAX) reading per
  // meter per day, then sum those per-meter day-end values across meters.
  //
  // Rentangnya mengikuti RETENTION_DAYS, bukan angka tersendiri: menyapu lebih
  // jauh dari umur data yang benar-benar disimpan hanya memperlambat query tanpa
  // menambah satu baris pun hasil.
  const deltas = await query<{ id: string; name: string; zone: string; usage_m3: number }>(
    `SELECT m.id AS id, m.name AS name, m.zone AS zone, (MAX(r.total_volume) - MIN(r.total_volume)) AS usage_m3
     FROM water_meters m
     JOIN water_readings r ON r.meter_id = m.id AND r.recorded_at >= (NOW() - INTERVAL ? DAY)
     GROUP BY m.id, m.name, m.zone
     ORDER BY usage_m3 DESC`,
    [RETENTION_DAYS]
  );

  const trendRows = await query<{ date: string; volume: number }>(
    `SELECT day AS date, SUM(day_end_volume) AS volume FROM (
       SELECT meter_id, DATE_FORMAT(recorded_at, '%Y-%m-%d') AS day, MAX(total_volume) AS day_end_volume
       FROM water_readings
       WHERE recorded_at >= (NOW() - INTERVAL ? DAY)
       GROUP BY meter_id, DATE_FORMAT(recorded_at, '%Y-%m-%d')
     ) per_meter_per_day
     GROUP BY day
     ORDER BY day ASC`,
    [RETENTION_DAYS]
  );

  const totalVolume = deltas.reduce((sum, d) => sum + Number(d.usage_m3), 0);
  const zones = await listWaterZones();

  return {
    totalVolume: Math.round(totalVolume),
    avgDaily: Math.round(totalVolume / (trendRows.length || 1)),
    activeLeaks: zones.filter((z) => z.status === "leak").length,
    topConsumers: deltas
      .slice(0, 10)
      .map((d) => ({ id: d.id, name: d.name, zone: d.zone, usage: Math.round(Number(d.usage_m3)) })),
    trend: trendRows.map((t) => ({ date: t.date, volume: Math.round(Number(t.volume)) })),
  };
}

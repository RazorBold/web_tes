import { query } from "@/lib/db";
import type { FloodSensor, FloodReadingPoint, FloodOverview } from "@/types/flood";

const ALERT_ORDER: FloodSensor["alertLevel"][] = ["normal", "waspada", "siaga", "bahaya"];

interface FloodSensorRow {
  id: string;
  name: string;
  status: string;
  battery: number | null;
  water_level_cm: number;
  rate_of_rise: number;
  alert_level: string;
  updated_at: Date;
}

function mapSensor(r: FloodSensorRow): FloodSensor {
  return {
    id: r.id,
    name: r.name,
    status: r.status as FloodSensor["status"],
    battery: r.battery,
    waterLevelCm: r.water_level_cm,
    rateOfRise: r.rate_of_rise,
    alertLevel: r.alert_level as FloodSensor["alertLevel"],
    updatedAt: r.updated_at.toISOString(),
  };
}

export async function listFloodSensors(): Promise<FloodSensor[]> {
  const rows = await query<FloodSensorRow>("SELECT * FROM flood_sensors ORDER BY water_level_cm DESC");
  return rows.map(mapSensor);
}

export async function getFloodSensor(id: string): Promise<FloodSensor | null> {
  const rows = await query<FloodSensorRow>("SELECT * FROM flood_sensors WHERE id = ?", [id]);
  return rows[0] ? mapSensor(rows[0]) : null;
}

interface FloodReadingRow {
  water_level_cm: number;
  rate_of_rise: number;
  recorded_at: Date;
}

export async function getFloodSensorHistory(id: string): Promise<FloodReadingPoint[]> {
  // Bound to the most recent 20 readings — otherwise this keeps growing forever
  // as more readings accumulate (e.g. a live simulator ticking every few
  // seconds), which would eventually overwhelm the chart and the query.
  const rows = await query<FloodReadingRow>(
    `SELECT water_level_cm, rate_of_rise, recorded_at FROM (
       SELECT water_level_cm, rate_of_rise, recorded_at FROM flood_readings
       WHERE sensor_id = ? ORDER BY recorded_at DESC LIMIT 20
     ) recent ORDER BY recorded_at ASC`,
    [id]
  );
  return rows.map((r) => ({
    recordedAt: r.recorded_at.toISOString(),
    waterLevelCm: r.water_level_cm,
    rateOfRise: r.rate_of_rise,
  }));
}

export async function getFloodOverview(): Promise<FloodOverview> {
  const sensors = await listFloodSensors();
  const counts = { normal: 0, waspada: 0, siaga: 0, bahaya: 0 };
  for (const s of sensors) counts[s.alertLevel]++;

  let highestAlertLevel: FloodSensor["alertLevel"] = "normal";
  for (const s of sensors) {
    if (ALERT_ORDER.indexOf(s.alertLevel) > ALERT_ORDER.indexOf(highestAlertLevel)) {
      highestAlertLevel = s.alertLevel;
    }
  }

  return { highestAlertLevel, counts };
}

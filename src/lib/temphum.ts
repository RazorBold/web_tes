import { query } from "@/lib/db";
import type { RoomType, RoomStatus, TempHumOverview } from "@/types/temphum";

interface RoomTypeRow {
  id: string;
  key_name: string;
  display_name: string;
  temp_min: number;
  temp_max: number;
  humidity_min: number;
  humidity_max: number;
}

function mapRoomType(r: RoomTypeRow): RoomType {
  return {
    id: r.id,
    keyName: r.key_name,
    displayName: r.display_name,
    tempMin: r.temp_min,
    tempMax: r.temp_max,
    humidityMin: r.humidity_min,
    humidityMax: r.humidity_max,
  };
}

export async function listRoomTypes(): Promise<RoomType[]> {
  const rows = await query<RoomTypeRow>("SELECT * FROM room_types");
  return rows.map(mapRoomType);
}

interface RoomStatusRow {
  id: string;
  name: string;
  room_type_name: string;
  temperature: number;
  humidity: number;
  temp_min: number;
  temp_max: number;
  humidity_min: number;
  humidity_max: number;
}

export async function listRoomsWithStatus(): Promise<RoomStatus[]> {
  const rows = await query<RoomStatusRow>(
    `SELECT r.id AS id, r.name AS name, rt.display_name AS room_type_name,
            s.temperature AS temperature, s.humidity AS humidity,
            rt.temp_min AS temp_min, rt.temp_max AS temp_max,
            rt.humidity_min AS humidity_min, rt.humidity_max AS humidity_max
     FROM rooms r
     JOIN room_types rt ON rt.id = r.room_type_id
     LEFT JOIN temphum_sensors s ON s.room_id = r.id`
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    roomTypeName: r.room_type_name,
    temperature: r.temperature,
    humidity: r.humidity,
    ok:
      r.temperature >= r.temp_min &&
      r.temperature <= r.temp_max &&
      r.humidity >= r.humidity_min &&
      r.humidity <= r.humidity_max,
  }));
}

export async function getTempHumOverview(): Promise<TempHumOverview> {
  const sensors = await query<{ temperature: number; humidity: number }>(
    "SELECT temperature, humidity FROM temphum_sensors"
  );
  const n = sensors.length || 1;
  const avgTemp = sensors.reduce((s, r) => s + r.temperature, 0) / n;
  const avgHumidity = sensors.reduce((s, r) => s + r.humidity, 0) / n;

  // Bound to the most recent 20 sampled moments — otherwise this keeps growing
  // forever as more readings accumulate (e.g. a live simulator ticking every
  // few seconds), which would eventually overwhelm the sparkline and the query.
  const historyRows = await query<{ temp_avg: number; hum_avg: number }>(
    `SELECT temp_avg, hum_avg FROM (
       SELECT recorded_at, AVG(temperature) AS temp_avg, AVG(humidity) AS hum_avg
       FROM temphum_readings
       GROUP BY recorded_at
       ORDER BY recorded_at DESC
       LIMIT 20
     ) recent
     ORDER BY recorded_at ASC`
  );

  return {
    avgTemp: Math.round(avgTemp * 10) / 10,
    avgHumidity: Math.round(avgHumidity * 10) / 10,
    tempHistory: historyRows.map((r) => Math.round(Number(r.temp_avg) * 10) / 10),
    humidityHistory: historyRows.map((r) => Math.round(Number(r.hum_avg) * 10) / 10),
  };
}

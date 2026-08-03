import { query } from "@/lib/db";
import type { PowerMeter, PowerReadingPoint, PowerOverview, PowerQuality } from "@/types/power";

interface PowerMeterRow {
  id: string;
  name: string;
  sector: string;
  status: string;
  voltage: number;
  current_amp: number;
  power_kw: number;
  energy_kwh: number;
  power_factor: number;
  frequency_hz: number;
  loss_pct: number;
  unit: string;
  last_reading_at: Date;
}

function mapMeter(r: PowerMeterRow): PowerMeter {
  return {
    id: r.id,
    name: r.name,
    sector: r.sector as PowerMeter["sector"],
    status: r.status as PowerMeter["status"],
    voltage: r.voltage,
    current: r.current_amp,
    power: r.power_kw,
    energy: r.energy_kwh,
    powerFactor: r.power_factor,
    frequency: r.frequency_hz,
    lossPct: r.loss_pct,
    unit: r.unit,
    lastReading: r.last_reading_at.toISOString(),
  };
}

export async function listPowerMeters(): Promise<PowerMeter[]> {
  const rows = await query<PowerMeterRow>("SELECT * FROM power_meters ORDER BY energy_kwh DESC");
  return rows.map(mapMeter);
}

export async function getPowerMeter(id: string): Promise<PowerMeter | null> {
  const rows = await query<PowerMeterRow>("SELECT * FROM power_meters WHERE id = ?", [id]);
  return rows[0] ? mapMeter(rows[0]) : null;
}

interface PowerReadingRow {
  voltage: number;
  current_amp: number;
  power_kw: number;
  energy_kwh: number;
  power_factor: number;
  frequency_hz: number;
  recorded_at: Date;
}

export async function getPowerMeterHistory(id: string): Promise<PowerReadingPoint[]> {
  const rows = await query<PowerReadingRow>(
    `SELECT * FROM (
       SELECT * FROM power_readings WHERE meter_id = ? ORDER BY recorded_at DESC LIMIT 50
     ) recent ORDER BY recorded_at ASC`,
    [id]
  );
  return rows.map((r) => ({
    recordedAt: r.recorded_at.toISOString(),
    voltage: r.voltage,
    current: r.current_amp,
    power: r.power_kw,
    energy: r.energy_kwh,
    powerFactor: r.power_factor,
    frequency: r.frequency_hz,
  }));
}

export async function getPowerOverview(): Promise<PowerOverview> {
  const meters = await listPowerMeters();
  const n = meters.length || 1;
  const totalEnergy = meters.reduce((s, m) => s + m.energy, 0);
  const avgPowerFactor = meters.reduce((s, m) => s + m.powerFactor, 0) / n;
  const avgLossPct = meters.reduce((s, m) => s + m.lossPct, 0) / n;

  const sectorRows = await query<{ sector: string; energy_sum: number }>(
    `SELECT sector, SUM(energy_kwh) AS energy_sum FROM power_meters GROUP BY sector`
  );
  const totalSectorEnergy = sectorRows.reduce((s, r) => s + Number(r.energy_sum), 0) || 1;
  const sectors = sectorRows
    .map((r) => ({
      sector: r.sector,
      energy: Math.round(Number(r.energy_sum)),
      pct: Math.round((Number(r.energy_sum) / totalSectorEnergy) * 100),
    }))
    .sort((a, b) => b.energy - a.energy);

  // power_kw is an instantaneous reading, not additive — if a meter has more than
  // one reading in the same hour (e.g. a live simulator ticking every few
  // seconds), average those first per meter, then sum across meters. Also
  // window to the last 24h so the curve reflects "today", not every historical
  // reading that happens to share an hour label.
  const loadRows = await query<{ hour: string; power_sum: number }>(
    `SELECT hour, SUM(avg_power_kw) AS power_sum FROM (
       SELECT meter_id, DATE_FORMAT(recorded_at, '%H:00') AS hour, AVG(power_kw) AS avg_power_kw
       FROM power_readings
       WHERE recorded_at >= (NOW() - INTERVAL 24 HOUR)
       GROUP BY meter_id, DATE_FORMAT(recorded_at, '%H:00')
     ) per_meter_per_hour
     GROUP BY hour
     ORDER BY hour ASC`
  );

  const peak = loadRows.reduce(
    (best, r) => (Number(r.power_sum) > best.powerKw ? { powerKw: Number(r.power_sum), hour: r.hour } : best),
    { powerKw: 0, hour: "" }
  );

  return {
    totalEnergy: Math.round(totalEnergy),
    peakLoadKw: Math.round(peak.powerKw),
    peakLoadAt: peak.hour,
    avgPowerFactor: Math.round(avgPowerFactor * 100) / 100,
    avgLossPct: Math.round(avgLossPct * 100) / 100,
    sectors,
    loadCurve: loadRows.map((r) => ({ hour: r.hour, powerKw: Math.round(Number(r.power_sum)) })),
  };
}

export async function getPowerQuality(): Promise<PowerQuality> {
  const meters = await listPowerMeters();
  const n = meters.length || 1;
  return {
    voltage: Math.round((meters.reduce((s, m) => s + m.voltage, 0) / n) * 10) / 10,
    current: Math.round((meters.reduce((s, m) => s + m.current, 0) / n) * 10) / 10,
    frequency: Math.round((meters.reduce((s, m) => s + m.frequency, 0) / n) * 10) / 10,
    powerFactor: Math.round((meters.reduce((s, m) => s + m.powerFactor, 0) / n) * 100) / 100,
  };
}

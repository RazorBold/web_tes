// Continuously "drives" the sensor data so the dashboard looks live: every
// tick it nudges each entity's current reading and appends a row to its
// history table. Meant to run alongside the app (e.g. under PM2) — it does
// NOT touch alerts/devices, and it never re-creates schema (that's
// scripts/db-setup.mjs's job).
//
// Usage: node scripts/live-simulator.mjs   (or via PM2, see ecosystem.config.js)

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import mysql from "mysql2/promise";
import { pruneReadings } from "./db-prune.mjs";

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function loadEnvLocal() {
  for (const file of [".env.local", ".env"]) {
    const p = path.join(rootDir, file);
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!(key in process.env)) process.env[key] = value;
    }
    break;
  }
}

loadEnvLocal();

const DB_HOST = process.env.DB_HOST ?? "localhost";
const DB_PORT = Number(process.env.DB_PORT ?? 3306);
const DB_NAME = process.env.DB_NAME ?? "superweb_iot";
const DB_USER = process.env.DB_USER ?? "root";
const DB_PASSWORD = process.env.DB_PASSWORD ?? "";

const TICK_MS = 10_000;
// Simulator ini menulis ~389.000 baris/hari. Tanpa dipangkas, ringkasan air yang
// menyapu rentang waktu makin lambat tiap hari — pernah terukur 9,3 detik. Angka
// hari HARUS sama dengan RETENTION_DAYS di src/config/retention.ts; kalau tidak,
// layar akan menjanjikan rentang yang datanya sudah dihapus.
const RETENTION_DAYS = 3;
const PRUNE_EVERY_MS = 60 * 60_000;
// Each tick is treated as if this many minutes passed in sensor-time — real
// 10s ticks would move total_volume/energy/distance by imperceptible
// amounts, which defeats the point of a *visible* live demo.
const SIMULATED_MINUTES_PER_TICK = 5;
const HOURS_PER_TICK = SIMULATED_MINUTES_PER_TICK / 60;

// Same rationale as scripts/db-setup.mjs: write local time components, not
// UTC, so mysql2 reading the naive DATETIME back (as local time) round-trips
// correctly instead of skewing every timestamp by the server's UTC offset.
const pad = (n) => String(n).padStart(2, "0");
const iso = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
const round = (n, dp = 2) => Number(n.toFixed(dp));
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const jitterPct = (value, pct) => value * (1 + (Math.random() - 0.5) * 2 * pct);

function floodAlertLevel(cm) {
  if (cm > 150) return "bahaya";
  if (cm > 100) return "siaga";
  if (cm > 50) return "waspada";
  return "normal";
}

async function tickWater(db, now) {
  const [meters] = await db.query("SELECT id, flow_rate, total_volume FROM water_meters");
  for (const m of meters) {
    const flowRate = clamp(round(jitterPct(Number(m.flow_rate) || 1.5, 0.2)), 0.3, 6);
    const totalVolume = round(Number(m.total_volume) + flowRate * HOURS_PER_TICK, 2);
    await db.query("UPDATE water_meters SET flow_rate = ?, total_volume = ?, last_reading_at = ? WHERE id = ?", [
      flowRate, totalVolume, now, m.id,
    ]);
    await db.query("INSERT INTO water_readings (meter_id, flow_rate, total_volume, recorded_at) VALUES (?, ?, ?, ?)", [
      m.id, flowRate, totalVolume, now,
    ]);
  }
}

async function tickPower(db, now) {
  const [meters] = await db.query("SELECT id, voltage, current_amp, power_kw, energy_kwh, power_factor FROM power_meters");
  for (const m of meters) {
    const voltage = round(clamp(jitterPct(Number(m.voltage), 0.01), 205, 235));
    const powerKw = round(clamp(jitterPct(Number(m.power_kw) || 10, 0.15), 1, 3000));
    const currentAmp = round((powerKw * 1000) / voltage);
    const energyKwh = round(Number(m.energy_kwh) + powerKw * HOURS_PER_TICK, 2);
    const powerFactor = round(clamp(jitterPct(Number(m.power_factor), 0.01), 0.85, 1));

    await db.query(
      `UPDATE power_meters SET voltage=?, current_amp=?, power_kw=?, energy_kwh=?, power_factor=?, last_reading_at=? WHERE id=?`,
      [voltage, currentAmp, powerKw, energyKwh, powerFactor, now, m.id]
    );
    await db.query(
      `INSERT INTO power_readings (meter_id, voltage, current_amp, power_kw, energy_kwh, power_factor, frequency_hz, recorded_at)
       VALUES (?, ?, ?, ?, ?, ?, 50.0, ?)`,
      [m.id, voltage, currentAmp, powerKw, energyKwh, powerFactor, now]
    );
  }
}

async function tickFleet(db, now) {
  const [vehicles] = await db.query(
    "SELECT id, status, lat, lng, speed, heading, distance_today_km, hours_active_today FROM fleet_vehicles"
  );
  for (const v of vehicles) {
    let status = v.status;
    // Small chance to flip between moving/idle each tick so the map looks alive.
    if (status !== "maintenance" && Math.random() < 0.08) {
      status = status === "moving" ? "idle" : "moving";
    }

    const moving = status === "moving";
    const speed = moving ? clamp(round(jitterPct(Number(v.speed) || 30, 0.3)), 10, 80) : 0;
    const heading = moving ? (v.heading + Math.floor((Math.random() - 0.5) * 40) + 360) % 360 : v.heading;
    const distanceDeltaKm = moving ? speed * HOURS_PER_TICK : 0;
    const lat = moving ? round(Number(v.lat) + (Math.random() - 0.5) * 0.004, 6) : Number(v.lat);
    const lng = moving ? round(Number(v.lng) + (Math.random() - 0.5) * 0.004, 6) : Number(v.lng);
    const distanceTodayKm = round(Number(v.distance_today_km) + distanceDeltaKm, 1);
    const hoursActiveToday = round(Number(v.hours_active_today) + (moving ? HOURS_PER_TICK : 0), 1);

    await db.query(
      `UPDATE fleet_vehicles SET status=?, ignition=?, lat=?, lng=?, speed=?, heading=?, distance_today_km=?, hours_active_today=?, updated_at=? WHERE id=?`,
      [status, moving, lat, lng, speed, heading, distanceTodayKm, hoursActiveToday, now, v.id]
    );
    await db.query(
      `INSERT INTO fleet_positions (vehicle_id, lat, lng, speed, heading, recorded_at) VALUES (?, ?, ?, ?, ?, ?)`,
      [v.id, lat, lng, speed, heading, now]
    );
  }
}

async function tickFlood(db, now) {
  const [sensors] = await db.query("SELECT id, water_level_cm, rate_of_rise FROM flood_sensors");
  for (const s of sensors) {
    const rateOfRise = round(jitterPct(Number(s.rate_of_rise) || 1, 0.5), 1);
    const waterLevelCm = clamp(round(Number(s.water_level_cm) + rateOfRise * (HOURS_PER_TICK * 5), 1), 0, 400);
    const alertLevel = floodAlertLevel(waterLevelCm);

    await db.query(
      `UPDATE flood_sensors SET water_level_cm=?, rate_of_rise=?, alert_level=?, updated_at=? WHERE id=?`,
      [waterLevelCm, rateOfRise, alertLevel, now, s.id]
    );
    await db.query(
      `INSERT INTO flood_readings (sensor_id, water_level_cm, rate_of_rise, recorded_at) VALUES (?, ?, ?, ?)`,
      [s.id, waterLevelCm, rateOfRise, now]
    );
  }
}

async function tickWeather(db, now) {
  const [stations] = await db.query("SELECT id FROM weather_stations");
  for (const st of stations) {
    const [[last]] = await db.query(
      "SELECT * FROM weather_readings WHERE station_id = ? ORDER BY observed_at DESC LIMIT 1",
      [st.id]
    );
    if (!last) continue;

    const temperature = round(clamp(jitterPct(Number(last.temperature), 0.03), 20, 34), 1);
    const humidity = clamp(Math.round(jitterPct(Number(last.humidity), 0.03)), 50, 95);
    const windSpeed = round(clamp(jitterPct(Number(last.wind_speed) || 5, 0.2), 0, 25), 1);
    const rainfall = Math.random() < 0.3 ? round(Math.random() * 6, 1) : 0;
    const pressure = round(clamp(jitterPct(Number(last.pressure), 0.002), 1000, 1015), 1);
    const condition = rainfall > 2 ? "hujan_ringan" : temperature > 30 ? "cerah" : "cerah_berawan";

    await db.query(
      `INSERT INTO weather_readings (station_id, temperature, humidity, wind_speed, wind_direction, rainfall, pressure, condition_text, observed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [st.id, temperature, humidity, windSpeed, last.wind_direction, rainfall, pressure, condition, now]
    );
  }
}

async function tickTempHum(db, now) {
  const [sensors] = await db.query("SELECT id, temperature, humidity, aqi, pm25, co2 FROM temphum_sensors");
  for (const s of sensors) {
    const temperature = round(jitterPct(Number(s.temperature) || 24, 0.02), 1);
    const humidity = clamp(Math.round(jitterPct(Number(s.humidity) || 50, 0.03)), 10, 95);
    const aqi = s.aqi != null ? clamp(Math.round(jitterPct(Number(s.aqi), 0.1)), 0, 200) : null;
    const pm25 = s.pm25 != null ? clamp(Math.round(jitterPct(Number(s.pm25), 0.1)), 0, 150) : null;
    const co2 = s.co2 != null ? clamp(Math.round(jitterPct(Number(s.co2), 0.05)), 350, 2000) : null;

    await db.query(
      `UPDATE temphum_sensors SET temperature=?, humidity=?, aqi=?, pm25=?, co2=?, updated_at=? WHERE id=?`,
      [temperature, humidity, aqi, pm25, co2, now, s.id]
    );
    await db.query(
      `INSERT INTO temphum_readings (sensor_id, temperature, humidity, aqi, pm25, co2, recorded_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [s.id, temperature, humidity, aqi, pm25, co2, now]
    );
  }
}

async function tick(db) {
  const now = iso(new Date());
  await tickWater(db, now);
  await tickPower(db, now);
  await tickFleet(db, now);
  await tickFlood(db, now);
  await tickWeather(db, now);
  await tickTempHum(db, now);
  console.log(`[${now}] live-simulator tick complete`);
}

async function main() {
  console.log(`Connecting to ${DB_HOST}:${DB_PORT}/${DB_NAME} as ${DB_USER}...`);
  const db = await mysql.createConnection({
    host: DB_HOST, port: DB_PORT, user: DB_USER, password: DB_PASSWORD, database: DB_NAME,
  });
  console.log(`live-simulator running — ticking every ${TICK_MS / 1000}s (Ctrl+C to stop)`);

  const run = () => tick(db).catch((err) => console.error("tick failed:", err.message));
  await run();
  setInterval(run, TICK_MS);

  // Pemangkasan dijalankan berkala di proses yang sama supaya tidak perlu cron
  // terpisah — sumber pertumbuhannya memang di sini.
  const prune = async () => {
    try {
      const removed = await pruneReadings(db, RETENTION_DAYS);
      if (removed) console.log(`[${iso(new Date())}] prune: ${removed} baris kedaluwarsa dihapus`);
    } catch (err) {
      console.error("prune failed:", err.message);
    }
  };
  await prune();
  setInterval(prune, PRUNE_EVERY_MS);
}

main().catch((err) => {
  console.error("live-simulator failed to start:", err.message);
  process.exit(1);
});

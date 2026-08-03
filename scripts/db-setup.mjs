// Creates the database (if needed), (re)creates all sensor-module tables from
// sql/schema.sql, then seeds them with realistic starting data — replacing the
// hardcoded arrays that used to live inside the React components.
//
// Usage: npm run db:setup
// Requires a reachable MySQL server; connection info comes from .env.local.

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import mysql from "mysql2/promise";

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

const now = new Date();
// Formats as a naive "YYYY-MM-DD HH:mm:ss" using LOCAL time components — MySQL's
// DATETIME has no timezone, and mysql2 reads it back assuming the process's
// local timezone, so writing local time here keeps read/write self-consistent
// (using toISOString()/UTC here would silently skew every timestamp by the
// server's UTC offset).
const pad = (n) => String(n).padStart(2, "0");
const iso = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
const hoursAgo = (h) => iso(new Date(now.getTime() - h * 3600_000));
const daysAgo = (d) => iso(new Date(now.getTime() - d * 86_400_000));
const round = (n, dp = 2) => Number(n.toFixed(dp));

async function main() {
  console.log(`Connecting to ${DB_HOST}:${DB_PORT} as ${DB_USER}...`);
  const admin = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    multipleStatements: true,
  });

  await admin.query(
    `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await admin.end();

  const db = await mysql.createConnection({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    multipleStatements: true,
  });

  console.log(`Applying schema to database "${DB_NAME}"...`);
  const schema = readFileSync(path.join(rootDir, "sql", "schema.sql"), "utf8");
  await db.query(schema);

  console.log("Seeding water module...");
  await seedWater(db);
  console.log("Seeding fleet module...");
  await seedFleet(db);
  console.log("Seeding power module...");
  await seedPower(db);
  console.log("Seeding weather module...");
  await seedWeather(db);
  console.log("Seeding flood module...");
  await seedFlood(db);
  console.log("Seeding temphum module...");
  await seedTempHum(db);
  console.log("Seeding alerts...");
  await seedAlerts(db);
  console.log("Seeding devices...");
  await seedDevices(db);

  await db.end();
  console.log("Done. Database is ready.");
}

// ─── Water ────────────────────────────────────────────────────────────

async function seedWater(db) {
  const meters = [
    { id: "wm_01", name: "Resto Selera Rakyat", zone: "Jakarta Timur", totalVolume: 12600 },
    { id: "wm_02", name: "PT. Sinar Abadi Utama", zone: "Jakarta Pusat", totalVolume: 21600 },
    { id: "wm_03", name: "Mall Nusantara Plaza", zone: "Jakarta Pusat", totalVolume: 19400 },
    { id: "wm_04", name: "Hotel Sentosa Indah", zone: "Jakarta Selatan", totalVolume: 16400 },
    { id: "wm_05", name: "Apartemen Green Garden", zone: "Jakarta Barat", totalVolume: 15600 },
    { id: "wm_06", name: "Pabrik Maju Jaya Tekstil", zone: "Bekasi", totalVolume: 11200 },
    { id: "wm_07", name: "RS Medika Nusantara", zone: "Jakarta Pusat", totalVolume: 10600 },
    { id: "wm_08", name: "Univ Indonesia Depok", zone: "Depok", totalVolume: 9600 },
    { id: "wm_09", name: "PT. Kreasi Baru Mandiri", zone: "Jakarta Pusat", totalVolume: 8600 },
    { id: "wm_10", name: "Kantor Pemerintahan RI", zone: "Jakarta Pusat", totalVolume: 7800 },
    { id: "wm_11", name: "Larang Prabu 3", zone: "Jakarta Selatan", totalVolume: 22200 },
    { id: "wm_12", name: "Larang Prabu 1", zone: "Jakarta Barat", totalVolume: 15840 },
    { id: "wm_13", name: "Larang Prabu 2", zone: "Jakarta Barat", totalVolume: 11560 },
    { id: "wm_14", name: "Loka Citra", zone: "Jakarta Timur", totalVolume: 8840 },
    { id: "wm_15", name: "Cikondang", zone: "Bekasi", totalVolume: 4120 },
  ];

  for (const m of meters) {
    await db.query(
      `INSERT INTO water_meters (id, name, zone, status, battery, flow_rate, total_volume, unit, last_reading_at)
       VALUES (?, ?, ?, 'online', ?, ?, ?, 'm3', ?)`,
      [m.id, m.name, m.zone, 70 + Math.floor(Math.random() * 30), round(1.5 + Math.random() * 3), m.totalVolume, iso(now)]
    );

    // 15-day rising trend feeding the usage chart
    for (let dayOffset = 14; dayOffset >= 0; dayOffset--) {
      const progress = (14 - dayOffset) / 14;
      const dayVolume = round(m.totalVolume * (0.85 + 0.15 * progress));
      const flow = round(1.5 + Math.random() * 3);
      await db.query(
        `INSERT INTO water_readings (meter_id, flow_rate, total_volume, recorded_at) VALUES (?, ?, ?, ?)`,
        [m.id, flow, dayVolume, daysAgo(dayOffset)]
      );
    }
  }

  const zones = [
    { id: "wz_a", name: "Zona A · Jakarta Pusat", status: "normal", pressure: 3.2 },
    { id: "wz_b", name: "Zona B · Jakarta Selatan", status: "leak", pressure: 2.1 },
    { id: "wz_c", name: "Zona C · Jakarta Timur", status: "normal", pressure: 3.0 },
    { id: "wz_d", name: "Zona D · Bekasi", status: "normal", pressure: 3.4 },
  ];
  for (const z of zones) {
    await db.query(`INSERT INTO water_zones (id, name, status, pressure_bar) VALUES (?, ?, ?, ?)`, [
      z.id,
      z.name,
      z.status,
      z.pressure,
    ]);
  }
}

// ─── Fleet ────────────────────────────────────────────────────────────

async function seedFleet(db) {
  const vehicles = [
    { id: "veh_01", plate: "B 9876 ABC", type: "Heavy Truck 12", status: "moving", driver: "Budi Santoso", distance: 254, hours: 9.8 },
    { id: "veh_02", plate: "B 1234 XYZ", type: "Box Van 07", status: "moving", driver: "Ahmad Yani", distance: 210, hours: 8.5 },
    { id: "veh_03", plate: "B 5432 LPT", type: "Utility Truck 05", status: "idle", driver: "Adi Wijaya", distance: 185, hours: 7.6 },
    { id: "veh_04", plate: "B 7777 VVV", type: "Passenger Car 03", status: "moving", driver: "Deni Setiawan", distance: 142, hours: 5.8 },
    { id: "veh_05", plate: "B 6655 KKK", type: "Service Truck 08", status: "maintenance", driver: "Eko Prasetyo", distance: 130, hours: 5.5 },
    { id: "veh_06", plate: "B 2201 TLK", type: "Mitsubishi Xpander", status: "idle", driver: "Rian Hidayat", distance: 98, hours: 4.2 },
    { id: "veh_07", plate: "B 1234 SKA", type: "Daihatsu Sigra", status: "moving", driver: "Yusuf Maulana", distance: 88, hours: 4.0 },
    { id: "veh_08", plate: "B 9876 DPT", type: "Hyundai Ioniq 5", status: "moving", driver: "Nur Aisyah", distance: 120, hours: 5.1 },
    { id: "veh_09", plate: "B 8821 PPK", type: "Honda HR-V", status: "moving", driver: "Fajar Nugroho", distance: 76, hours: 3.6 },
    { id: "veh_10", plate: "B 7731 WQA", type: "Suzuki Carry", status: "idle", driver: "Sri Wulandari", distance: 54, hours: 2.9 },
    { id: "veh_11", plate: "B 9081 FFA", type: "Hino Ranger", status: "idle", driver: "Bambang Kusuma", distance: 61, hours: 3.1 },
    { id: "veh_12", plate: "B 4412 RTY", type: "Isuzu Elf", status: "maintenance", driver: "Joko Prasetya", distance: 40, hours: 1.8 },
  ];

  // Spread across Jabodetabek, centered near -6.21, 106.85
  for (const v of vehicles) {
    const lat = round(-6.21 + (Math.random() - 0.5) * 0.12, 6);
    const lng = round(106.85 + (Math.random() - 0.5) * 0.12, 6);
    const speed = v.status === "moving" ? round(20 + Math.random() * 40, 1) : 0;
    const heading = Math.floor(Math.random() * 360);
    const fuel = 40 + Math.floor(Math.random() * 55);

    await db.query(
      `INSERT INTO fleet_vehicles
        (id, plate, type, status, ignition, fuel, driver_name, lat, lng, speed, heading, distance_today_km, hours_active_today, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [v.id, v.plate, v.type, v.status, v.status === "moving", fuel, v.driver, lat, lng, speed, heading, v.distance, v.hours, iso(now)]
    );

    for (let i = 5; i >= 0; i--) {
      await db.query(
        `INSERT INTO fleet_positions (vehicle_id, lat, lng, speed, heading, recorded_at) VALUES (?, ?, ?, ?, ?, ?)`,
        [v.id, round(lat + (Math.random() - 0.5) * 0.01, 6), round(lng + (Math.random() - 0.5) * 0.01, 6), speed, heading, hoursAgo(i)]
      );
    }
  }

  await db.query(
    `INSERT INTO fleet_geofences (id, name, type, center_lat, center_lng, radius_m) VALUES (?, ?, ?, ?, ?, ?)`,
    ["geo_01", "Depot Cakung", "circle", -6.18, 106.95, 300]
  );
}

// ─── Power ────────────────────────────────────────────────────────────

async function seedPower(db) {
  const meters = [
    { id: "pm_01", name: "Sub-Panel Distribusi Thamrin", sector: "residensial", energy: 680, loss: 2.5 },
    { id: "pm_02", name: "Kuningan Smart Hub", sector: "residensial", energy: 820, loss: 1.5 },
    { id: "pm_03", name: "Panel Pusat Rasuna Said", sector: "komersial", energy: 980, loss: 2.1 },
    { id: "pm_04", name: "Gardu Hub Gatot Subroto", sector: "komersial", energy: 1210, loss: 1.8 },
    { id: "pm_05", name: "Substasiun Sudirman Utama", sector: "industri", energy: 1450, loss: 1.2 },
  ];

  for (const m of meters) {
    const voltage = round(218 + Math.random() * 6);
    const powerFactor = round(0.94 + Math.random() * 0.04);
    const powerKw = round(m.energy / 24, 2);
    const currentAmp = round((powerKw * 1000) / voltage, 2);

    await db.query(
      `INSERT INTO power_meters
        (id, name, sector, status, voltage, current_amp, power_kw, energy_kwh, power_factor, frequency_hz, loss_pct, unit, last_reading_at)
       VALUES (?, ?, ?, 'online', ?, ?, ?, ?, ?, 50.0, ?, 'MWh', ?)`,
      [m.id, m.name, m.sector, voltage, currentAmp, powerKw, m.energy, powerFactor, m.loss, iso(now)]
    );

    for (let h = 23; h >= 0; h--) {
      const shape = 0.5 + 0.5 * Math.sin(((h - 6) / 24) * Math.PI * 2 - Math.PI / 2);
      await db.query(
        `INSERT INTO power_readings (meter_id, voltage, current_amp, power_kw, energy_kwh, power_factor, frequency_hz, recorded_at)
         VALUES (?, ?, ?, ?, ?, ?, 50.0, ?)`,
        [
          m.id,
          round(voltage + (Math.random() - 0.5) * 2),
          round(currentAmp * (0.6 + shape)),
          round(powerKw * (0.6 + shape)),
          round(m.energy * (0.6 + shape) / 24),
          powerFactor,
          hoursAgo(h),
        ]
      );
    }
  }
}

// ─── Weather ────────────────────────────────────────────────────────

async function seedWeather(db) {
  await db.query(`INSERT INTO weather_stations (id, name, zone, lat, lng) VALUES (?, ?, ?, ?, ?)`, [
    "ws_01",
    "Stasiun Jakarta Pusat",
    "Jakarta Pusat",
    -6.1944,
    106.8229,
  ]);

  // Last 24h, hourly — mirrors the temp curve used on the weather widget/page
  const hourlyTemps = [25, 24.5, 25, 27, 29, 29.5, 27.5, 26];
  const conditions = ["hujan_ringan", "hujan_ringan", "cerah_berawan", "cerah", "cerah_berawan", "hujan_ringan", "berawan", "berawan"];
  for (let i = 0; i < hourlyTemps.length; i++) {
    const hoursBack = (hourlyTemps.length - 1 - i) * 3; // spread across last 21h in 3h steps
    await db.query(
      `INSERT INTO weather_readings
        (station_id, temperature, humidity, wind_speed, wind_direction, rainfall, pressure, condition_text, observed_at)
       VALUES ('ws_01', ?, ?, ?, 210, ?, ?, ?, ?)`,
      [hourlyTemps[i], 70 + Math.floor(Math.random() * 10), round(2 + Math.random() * 3, 1), i % 3 === 0 ? round(2 + Math.random() * 3, 1) : 0, round(1008 + Math.random() * 3, 1), conditions[i], hoursAgo(hoursBack)]
    );
  }

  // Last 7 days — one representative daily reading carrying that day's rainfall total
  const dailyRainfall = [12, 28, 6, 44, 18, 3, 22];
  for (let d = 0; d < dailyRainfall.length; d++) {
    await db.query(
      `INSERT INTO weather_readings
        (station_id, temperature, humidity, wind_speed, wind_direction, rainfall, pressure, condition_text, observed_at)
       VALUES ('ws_01', ?, ?, ?, 200, ?, ?, 'hujan_ringan', ?)`,
      [round(26 + Math.random() * 3), 72 + Math.floor(Math.random() * 8), round(3 + Math.random() * 4, 1), dailyRainfall[dailyRainfall.length - 1 - d], round(1009 + Math.random() * 2, 1), daysAgo(d + 1)]
    );
  }

  // Current conditions (latest row) — matches the widget's headline numbers
  await db.query(
    `INSERT INTO weather_readings
      (station_id, temperature, humidity, wind_speed, wind_direction, rainfall, pressure, condition_text, observed_at)
     VALUES ('ws_01', 29, 74, 10, 210, 4.2, 1009.2, 'hujan_ringan', ?)`,
    [iso(now)]
  );
}

// ─── Flood ──────────────────────────────────────────────────────────

function floodAlertLevel(cm) {
  if (cm > 150) return "bahaya";
  if (cm > 100) return "siaga";
  if (cm > 50) return "waspada";
  return "normal";
}

async function seedFlood(db) {
  const gates = [
    { id: "fs_01", name: "Pintu Air Manggarai", level: 185, rate: 5 },
    { id: "fs_02", name: "Pintu Air Karet", level: 210, rate: 3 },
    { id: "fs_03", name: "Pintu Air Angke Hulu", level: 320, rate: 12 },
    { id: "fs_04", name: "Pintu Air Pasar Ikan", level: 140, rate: 1 },
    { id: "fs_05", name: "Pintu Air Sunter Hulu", level: 90, rate: -1 },
    { id: "fs_06", name: "Pintu Air Depok", level: 110, rate: 0 },
  ];

  for (const g of gates) {
    await db.query(
      `INSERT INTO flood_sensors (id, name, status, battery, water_level_cm, rate_of_rise, alert_level, updated_at)
       VALUES (?, ?, 'online', ?, ?, ?, ?, ?)`,
      [g.id, g.name, 80 + Math.floor(Math.random() * 20), g.level, g.rate, floodAlertLevel(g.level), iso(now)]
    );
  }

  // Manggarai gets the full 12h trend shown on the flood detail chart
  const manggaraiTrend = [110, 130, 145, 170, 185, 190, 185];
  for (let i = 0; i < manggaraiTrend.length; i++) {
    await db.query(
      `INSERT INTO flood_readings (sensor_id, water_level_cm, rate_of_rise, recorded_at) VALUES ('fs_01', ?, ?, ?)`,
      [manggaraiTrend[i], round((manggaraiTrend[i] - (manggaraiTrend[i - 1] ?? manggaraiTrend[0])) / 2, 1), hoursAgo((manggaraiTrend.length - 1 - i) * 2)]
    );
  }

  for (const g of gates.filter((g) => g.id !== "fs_01")) {
    for (let i = 3; i >= 0; i--) {
      const drift = (Math.random() - 0.5) * 6;
      await db.query(
        `INSERT INTO flood_readings (sensor_id, water_level_cm, rate_of_rise, recorded_at) VALUES (?, ?, ?, ?)`,
        [g.id, round(g.level - drift * i, 1), g.rate, hoursAgo(i * 3)]
      );
    }
  }
}

// ─── TempHum & rooms ────────────────────────────────────────────────

async function seedTempHum(db) {
  const roomTypes = [
    { id: "rt_server_room", key: "server_room", name: "Server Room", tempMin: 18, tempMax: 27, humMin: 30, humMax: 60 },
    { id: "rt_warehouse", key: "warehouse", name: "Gudang", tempMin: 15, tempMax: 35, humMin: 30, humMax: 70 },
    { id: "rt_office", key: "office", name: "Office", tempMin: 20, tempMax: 28, humMin: 40, humMax: 65 },
    { id: "rt_cold_storage", key: "cold_storage", name: "Cold Storage", tempMin: -5, tempMax: 5, humMin: 80, humMax: 95 },
    { id: "rt_lab", key: "lab", name: "Laboratorium", tempMin: 18, tempMax: 25, humMin: 35, humMax: 55 },
  ];
  for (const rt of roomTypes) {
    await db.query(
      `INSERT INTO room_types (id, key_name, display_name, temp_min, temp_max, humidity_min, humidity_max)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [rt.id, rt.key, rt.name, rt.tempMin, rt.tempMax, rt.humMin, rt.humMax]
    );
  }

  const rooms = [
    { id: "room_server", name: "Server Room", typeId: "rt_server_room" },
    { id: "room_gudang_a", name: "Gudang A", typeId: "rt_warehouse" },
    { id: "room_office_1", name: "Office Lt. 1", typeId: "rt_office" },
    { id: "room_cold_storage", name: "Cold Storage", typeId: "rt_cold_storage" },
    { id: "room_lab", name: "Laboratorium", typeId: "rt_lab" },
    { id: "room_panel", name: "Ruang Panel", typeId: "rt_office" },
  ];
  for (const r of rooms) {
    await db.query(`INSERT INTO rooms (id, name, room_type_id) VALUES (?, ?, ?)`, [r.id, r.name, r.typeId]);
  }

  const sensors = [
    { id: "TH-SRV-01", name: "Server Room 1", roomId: "room_server", temp: 22.4, hum: 45, aqi: 38, pm25: 9, co2: 620, battery: 91 },
    { id: "TH-GDA-02", name: "Gudang A", roomId: "room_gudang_a", temp: 28.4, hum: 65, aqi: 52, pm25: 16, co2: 780, battery: 18 },
    { id: "th_03", name: "Office Lt. 1", roomId: "room_office_1", temp: 24.0, hum: 55, aqi: 40, pm25: 11, co2: 640, battery: 84 },
    { id: "th_04", name: "Cold Storage", roomId: "room_cold_storage", temp: -2.1, hum: 88, aqi: 20, pm25: 5, co2: 500, battery: 97 },
    { id: "th_05", name: "Laboratorium", roomId: "room_lab", temp: 20.5, hum: 40, aqi: 30, pm25: 7, co2: 560, battery: 88 },
    { id: "th_06", name: "Ruang Panel", roomId: "room_panel", temp: 31.2, hum: 42, aqi: 58, pm25: 18, co2: 710, battery: 76 },
  ];

  for (const s of sensors) {
    await db.query(
      `INSERT INTO temphum_sensors (id, name, room_id, status, battery, temperature, humidity, aqi, pm25, co2, updated_at)
       VALUES (?, ?, ?, 'online', ?, ?, ?, ?, ?, ?, ?)`,
      [s.id, s.name, s.roomId, s.battery, s.temp, s.hum, s.aqi, s.pm25, s.co2, iso(now)]
    );

    for (let h = 6; h >= 0; h--) {
      const jitter = (Math.random() - 0.5) * 1.5;
      await db.query(
        `INSERT INTO temphum_readings (sensor_id, temperature, humidity, aqi, pm25, co2, recorded_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [s.id, round(s.temp + jitter, 1), Math.max(0, Math.round(s.hum + jitter * 2)), s.aqi, s.pm25, s.co2, hoursAgo(h)]
      );
    }
  }
}

// ─── Alerts (CCTV entries excluded on purpose) ───────────────────────

async function seedAlerts(db) {
  const alerts = [
    { id: "alr_01", module: "power", sourceId: "pm_01", severity: "critical", title: "Power Meter Offline", label: "Energy · Sub-Panel Distribusi Thamrin", value: null, threshold: null, hoursBack: 0.8 },
    { id: "alr_02", module: "flood", sourceId: "fs_03", severity: "critical", title: "Ketinggian Air Bahaya", label: "Flood · Pintu Air Angke Hulu (Siaga I — Bahaya, 3.20 m)", value: 320, threshold: 150, hoursBack: 0.92 },
    { id: "alr_03", module: "flood", sourceId: "fs_01", severity: "warning", title: "Ketinggian Air Waspada", label: "Flood · Pintu Air Manggarai (Siaga II — Waspada, 1.85 m)", value: 185, threshold: 100, hoursBack: 0.95 },
    { id: "alr_04", module: "fleet", sourceId: "veh_09", severity: "warning", title: "Overspeed Terdeteksi", label: "Fleet · Toyota Avanza (B 2291 TTT) — Gatot Subroto", value: null, threshold: null, hoursBack: 1.2 },
    { id: "alr_05", module: "temphum", sourceId: "th_06", severity: "warning", title: "Suhu Ruang Panel Tinggi", label: "Environment · Ruang Panel 31,2°C (Waspada)", value: 31.2, threshold: 28, hoursBack: 1.4 },
    { id: "alr_06", module: "power", sourceId: "pm_04", severity: "warning", title: "Overcurrent Detected", label: "Energy · Gardu Hub Gatot Subroto", value: null, threshold: null, hoursBack: 2.0 },
  ];

  for (const a of alerts) {
    await db.query(
      `INSERT INTO alerts (id, module, source_id, severity, status, title, source_label, value, threshold, created_at, acknowledged_at)
       VALUES (?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, NULL)`,
      [a.id, a.module, a.sourceId, a.severity, a.title, a.label, a.value, a.threshold, hoursAgo(a.hoursBack)]
    );
  }
}

// ─── Devices (CCTV entries excluded on purpose) ──────────────────────

async function seedDevices(db) {
  const devices = [
    { id: "PWS-01", type: "Flood Sensor", module: "flood", location: "Pintu Air Manggarai", status: "online", battery: 94, signal: "-71 dBm", minsAgo: 1 },
    { id: "MTR-WTR-08", type: "Water Meter", module: "water", location: "Loka Citra", status: "online", battery: 88, signal: "-80 dBm", minsAgo: 3 },
    { id: "MTR-WTR-11", type: "Water Meter", module: "water", location: "Cikondang", status: "offline", battery: 12, signal: "—", minsAgo: 58 },
    { id: "MTR-PWR-02", type: "Power Meter", module: "power", location: "Gardu 3", status: "online", battery: null, signal: "-64 dBm", minsAgo: 0.5 },
    { id: "MTR-PWR-04", type: "Power Meter", module: "power", location: "Gedung B", status: "offline", battery: null, signal: "—", minsAgo: 60 },
    { id: "GPS-B9876", type: "GPS Tracker", module: "fleet", location: "Heavy Truck 12", status: "online", battery: 76, signal: "4G", minsAgo: 0.5 },
    { id: "TH-SRV-01", type: "TempHum Sensor", module: "temphum", location: "Server Room", status: "online", battery: 91, signal: "-58 dBm", minsAgo: 2 },
    { id: "TH-GDA-02", type: "TempHum Sensor", module: "temphum", location: "Gudang A", status: "online", battery: 18, signal: "-77 dBm", minsAgo: 4 },
  ];

  for (const d of devices) {
    await db.query(
      `INSERT INTO devices (id, type, module, location, status, battery, signal_text, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [d.id, d.type, d.module, d.location, d.status, d.battery, d.signal, hoursAgo(d.minsAgo / 60)]
    );
  }
}

main().catch((err) => {
  console.error("db:setup failed:", err.message);
  process.exit(1);
});

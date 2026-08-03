-- SuperWeb IoT — schema for sensor modules (water, power, fleet, flood, weather, temphum)
-- + cross-module alerts & devices. CCTV is intentionally out of scope.
-- Run against a database that already exists (see scripts/db-setup.mjs, which creates it).

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS water_readings;
DROP TABLE IF EXISTS water_meters;
DROP TABLE IF EXISTS water_zones;

DROP TABLE IF EXISTS fleet_positions;
DROP TABLE IF EXISTS fleet_vehicles;
DROP TABLE IF EXISTS fleet_geofences;

DROP TABLE IF EXISTS power_readings;
DROP TABLE IF EXISTS power_meters;

DROP TABLE IF EXISTS weather_readings;
DROP TABLE IF EXISTS weather_stations;

DROP TABLE IF EXISTS flood_readings;
DROP TABLE IF EXISTS flood_sensors;

DROP TABLE IF EXISTS temphum_readings;
DROP TABLE IF EXISTS temphum_sensors;
DROP TABLE IF EXISTS rooms;
DROP TABLE IF EXISTS room_types;

DROP TABLE IF EXISTS alerts;
DROP TABLE IF EXISTS devices;

SET FOREIGN_KEY_CHECKS = 1;

-- ─── Water ──────────────────────────────────────────────────────────

CREATE TABLE water_meters (
  id               VARCHAR(32)  PRIMARY KEY,
  name             VARCHAR(120) NOT NULL,
  zone             VARCHAR(80)  NOT NULL,
  status           ENUM('online','offline','error') NOT NULL DEFAULT 'online',
  battery          TINYINT UNSIGNED NULL,
  flow_rate        DECIMAL(6,2) NOT NULL DEFAULT 0,
  total_volume     DECIMAL(12,2) NOT NULL DEFAULT 0,
  unit             VARCHAR(10) NOT NULL DEFAULT 'm3',
  last_reading_at  DATETIME NOT NULL
);

CREATE TABLE water_readings (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  meter_id    VARCHAR(32) NOT NULL,
  flow_rate   DECIMAL(6,2) NOT NULL,
  total_volume DECIMAL(12,2) NOT NULL,
  recorded_at DATETIME NOT NULL,
  FOREIGN KEY (meter_id) REFERENCES water_meters(id) ON DELETE CASCADE,
  INDEX idx_water_readings_meter_time (meter_id, recorded_at)
);

CREATE TABLE water_zones (
  id           VARCHAR(32) PRIMARY KEY,
  name         VARCHAR(120) NOT NULL,
  status       ENUM('normal','leak') NOT NULL DEFAULT 'normal',
  pressure_bar DECIMAL(4,2) NOT NULL
);

-- ─── Fleet ──────────────────────────────────────────────────────────

CREATE TABLE fleet_vehicles (
  id                  VARCHAR(32) PRIMARY KEY,
  plate               VARCHAR(20) NOT NULL,
  type                VARCHAR(60) NOT NULL,
  status              ENUM('moving','idle','maintenance') NOT NULL DEFAULT 'idle',
  ignition            BOOLEAN NOT NULL DEFAULT FALSE,
  fuel                TINYINT UNSIGNED NULL,
  driver_name         VARCHAR(120) NULL,
  lat                 DECIMAL(9,6) NOT NULL,
  lng                 DECIMAL(9,6) NOT NULL,
  speed               DECIMAL(5,1) NOT NULL DEFAULT 0,
  heading             SMALLINT NOT NULL DEFAULT 0,
  distance_today_km   DECIMAL(6,1) NOT NULL DEFAULT 0,
  hours_active_today  DECIMAL(4,1) NOT NULL DEFAULT 0,
  updated_at          DATETIME NOT NULL
);

CREATE TABLE fleet_positions (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id  VARCHAR(32) NOT NULL,
  lat         DECIMAL(9,6) NOT NULL,
  lng         DECIMAL(9,6) NOT NULL,
  speed       DECIMAL(5,1) NOT NULL,
  heading     SMALLINT NOT NULL,
  recorded_at DATETIME NOT NULL,
  FOREIGN KEY (vehicle_id) REFERENCES fleet_vehicles(id) ON DELETE CASCADE,
  INDEX idx_fleet_positions_vehicle_time (vehicle_id, recorded_at)
);

CREATE TABLE fleet_geofences (
  id          VARCHAR(32) PRIMARY KEY,
  name        VARCHAR(120) NOT NULL,
  type        VARCHAR(20) NOT NULL,
  center_lat  DECIMAL(9,6) NOT NULL,
  center_lng  DECIMAL(9,6) NOT NULL,
  radius_m    INT NOT NULL
);

-- ─── Power ──────────────────────────────────────────────────────────

CREATE TABLE power_meters (
  id               VARCHAR(32) PRIMARY KEY,
  name             VARCHAR(120) NOT NULL,
  sector           ENUM('industri','komersial','residensial') NOT NULL,
  status           ENUM('online','offline','error') NOT NULL DEFAULT 'online',
  voltage          DECIMAL(6,2) NOT NULL,
  current_amp      DECIMAL(6,2) NOT NULL,
  power_kw         DECIMAL(8,2) NOT NULL,
  energy_kwh       DECIMAL(12,2) NOT NULL,
  power_factor     DECIMAL(3,2) NOT NULL,
  frequency_hz     DECIMAL(4,1) NOT NULL,
  loss_pct         DECIMAL(4,2) NOT NULL DEFAULT 0,
  unit             VARCHAR(10) NOT NULL DEFAULT 'kWh',
  last_reading_at  DATETIME NOT NULL
);

CREATE TABLE power_readings (
  id            BIGINT AUTO_INCREMENT PRIMARY KEY,
  meter_id      VARCHAR(32) NOT NULL,
  voltage       DECIMAL(6,2) NOT NULL,
  current_amp   DECIMAL(6,2) NOT NULL,
  power_kw      DECIMAL(8,2) NOT NULL,
  energy_kwh    DECIMAL(12,2) NOT NULL,
  power_factor  DECIMAL(3,2) NOT NULL,
  frequency_hz  DECIMAL(4,1) NOT NULL,
  recorded_at   DATETIME NOT NULL,
  FOREIGN KEY (meter_id) REFERENCES power_meters(id) ON DELETE CASCADE,
  INDEX idx_power_readings_meter_time (meter_id, recorded_at)
);

-- ─── Weather ────────────────────────────────────────────────────────

CREATE TABLE weather_stations (
  id    VARCHAR(32) PRIMARY KEY,
  name  VARCHAR(120) NOT NULL,
  zone  VARCHAR(80) NOT NULL,
  lat   DECIMAL(9,6) NOT NULL,
  lng   DECIMAL(9,6) NOT NULL
);

CREATE TABLE weather_readings (
  id             BIGINT AUTO_INCREMENT PRIMARY KEY,
  station_id     VARCHAR(32) NOT NULL,
  temperature    DECIMAL(4,1) NOT NULL,
  humidity       TINYINT UNSIGNED NOT NULL,
  wind_speed     DECIMAL(5,1) NOT NULL,
  wind_direction SMALLINT NOT NULL,
  rainfall       DECIMAL(5,1) NOT NULL,
  pressure       DECIMAL(6,1) NOT NULL,
  condition_text VARCHAR(40) NOT NULL,
  observed_at    DATETIME NOT NULL,
  FOREIGN KEY (station_id) REFERENCES weather_stations(id) ON DELETE CASCADE,
  INDEX idx_weather_readings_station_time (station_id, observed_at)
);

-- ─── Flood ──────────────────────────────────────────────────────────

CREATE TABLE flood_sensors (
  id              VARCHAR(32) PRIMARY KEY,
  name            VARCHAR(120) NOT NULL,
  status          ENUM('online','offline','error') NOT NULL DEFAULT 'online',
  battery         TINYINT UNSIGNED NULL,
  water_level_cm  DECIMAL(6,1) NOT NULL,
  rate_of_rise    DECIMAL(5,1) NOT NULL DEFAULT 0,
  alert_level     ENUM('normal','waspada','siaga','bahaya') NOT NULL DEFAULT 'normal',
  updated_at      DATETIME NOT NULL
);

CREATE TABLE flood_readings (
  id             BIGINT AUTO_INCREMENT PRIMARY KEY,
  sensor_id      VARCHAR(32) NOT NULL,
  water_level_cm DECIMAL(6,1) NOT NULL,
  rate_of_rise   DECIMAL(5,1) NOT NULL,
  recorded_at    DATETIME NOT NULL,
  FOREIGN KEY (sensor_id) REFERENCES flood_sensors(id) ON DELETE CASCADE,
  INDEX idx_flood_readings_sensor_time (sensor_id, recorded_at)
);

-- ─── TempHum & rooms ────────────────────────────────────────────────

CREATE TABLE room_types (
  id            VARCHAR(32) PRIMARY KEY,
  key_name      VARCHAR(40) NOT NULL UNIQUE,
  display_name  VARCHAR(80) NOT NULL,
  temp_min      DECIMAL(4,1) NOT NULL,
  temp_max      DECIMAL(4,1) NOT NULL,
  humidity_min  TINYINT UNSIGNED NOT NULL,
  humidity_max  TINYINT UNSIGNED NOT NULL
);

CREATE TABLE rooms (
  id            VARCHAR(32) PRIMARY KEY,
  name          VARCHAR(120) NOT NULL,
  room_type_id  VARCHAR(32) NOT NULL,
  FOREIGN KEY (room_type_id) REFERENCES room_types(id)
);

CREATE TABLE temphum_sensors (
  id           VARCHAR(32) PRIMARY KEY,
  name         VARCHAR(120) NOT NULL,
  room_id      VARCHAR(32) NULL,
  status       ENUM('online','offline','error') NOT NULL DEFAULT 'online',
  battery      TINYINT UNSIGNED NULL,
  temperature  DECIMAL(4,1) NOT NULL,
  humidity     TINYINT UNSIGNED NOT NULL,
  aqi          SMALLINT UNSIGNED NULL,
  pm25         SMALLINT UNSIGNED NULL,
  co2          SMALLINT UNSIGNED NULL,
  updated_at   DATETIME NOT NULL,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL
);

CREATE TABLE temphum_readings (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  sensor_id   VARCHAR(32) NOT NULL,
  temperature DECIMAL(4,1) NOT NULL,
  humidity    TINYINT UNSIGNED NOT NULL,
  aqi         SMALLINT UNSIGNED NULL,
  pm25        SMALLINT UNSIGNED NULL,
  co2         SMALLINT UNSIGNED NULL,
  recorded_at DATETIME NOT NULL,
  FOREIGN KEY (sensor_id) REFERENCES temphum_sensors(id) ON DELETE CASCADE,
  INDEX idx_temphum_readings_sensor_time (sensor_id, recorded_at)
);

-- ─── Cross-module: alerts & devices ─────────────────────────────────

CREATE TABLE alerts (
  id              VARCHAR(32) PRIMARY KEY,
  module          VARCHAR(20) NOT NULL,
  source_id       VARCHAR(32) NULL,
  severity        ENUM('info','warning','critical') NOT NULL,
  status          ENUM('active','acknowledged','resolved') NOT NULL DEFAULT 'active',
  title           VARCHAR(200) NOT NULL,
  source_label    VARCHAR(200) NOT NULL,
  value           DECIMAL(10,2) NULL,
  threshold       DECIMAL(10,2) NULL,
  created_at      DATETIME NOT NULL,
  acknowledged_at DATETIME NULL,
  INDEX idx_alerts_module (module),
  INDEX idx_alerts_created (created_at)
);

CREATE TABLE devices (
  id          VARCHAR(32) PRIMARY KEY,
  type        VARCHAR(60) NOT NULL,
  module      VARCHAR(20) NOT NULL,
  location    VARCHAR(160) NOT NULL,
  status      ENUM('online','offline') NOT NULL DEFAULT 'online',
  battery     TINYINT UNSIGNED NULL,
  signal_text VARCHAR(30) NOT NULL,
  updated_at  DATETIME NOT NULL
);

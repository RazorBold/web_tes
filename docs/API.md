# SuperWeb IoT — API Documentation

Dokumentasi kontrak API yang **dikonsumsi oleh frontend** SuperWeb IoT Platform.

> **Status:** Ini adalah spesifikasi kontrak (interface) antara frontend dan backend.
> Pada fase saat ini frontend masih memakai data mock; dokumen ini menjadi acuan
> saat integrasi backend dilakukan. Sumber kebenaran desain: `PRD_Frontend_SuperWeb_IoT_v1.0.md` §7–§9.

- **REST base URL:** `NEXT_PUBLIC_API_URL` → mis. `http://localhost:8000/api/v1`
- **Realtime (MQTT over WebSocket):** `NEXT_PUBLIC_MQTT_URL` → mis. `ws://localhost:8083/mqtt`
- **Format:** JSON (`Content-Type: application/json`)
- **Auth:** Bearer JWT di header `Authorization` (lihat [§ Authentication](#authentication))
- **HTTP client:** [`ky`](https://github.com/sindresorhus/ky) singleton di `src/lib/api.ts`, di-cache & di-poll oleh TanStack React Query.

> 🧪 **Swagger UI interaktif:** jalankan `npm run dev`, buka **`/api-docs`**.
> Sumber spec: [`public/openapi.json`](../public/openapi.json) (OpenAPI 3.1), di-render via `swagger-ui-dist`.
> Dokumen markdown ini dan `openapi.json` harus dijaga tetap selaras.

---

## Konvensi

### Envelope respons

Semua respons sukses (kecuali stream biner) memakai envelope berikut:

```json
{
  "success": true,
  "data": { },
  "meta": { "timestamp": "2026-07-15T08:00:00Z" }
}
```

List/koleksi menambahkan `meta.pagination`:

```json
{
  "success": true,
  "data": [ ],
  "meta": {
    "timestamp": "2026-07-15T08:00:00Z",
    "pagination": { "page": 1, "pageSize": 20, "total": 137, "totalPages": 7 }
  }
}
```

### Envelope error

```json
{
  "success": false,
  "error": { "code": "RESOURCE_NOT_FOUND", "message": "Meter tidak ditemukan" },
  "meta": { "timestamp": "2026-07-15T08:00:00Z" }
}
```

| HTTP | code                | Arti |
|-----:|---------------------|------|
| 400  | `VALIDATION_ERROR`  | Parameter/body tidak valid |
| 401  | `UNAUTHENTICATED`   | Token hilang / kedaluwarsa (memicu refresh otomatis) |
| 403  | `FORBIDDEN`         | Role tidak punya izin (lihat RBAC di PRD §9.2) |
| 404  | `RESOURCE_NOT_FOUND`| Entitas tidak ada |
| 422  | `UNPROCESSABLE`     | Validasi domain gagal |
| 429  | `RATE_LIMITED`      | Terlalu banyak request |
| 500  | `INTERNAL_ERROR`    | Kesalahan server |

### Parameter query umum (list & history)

| Param      | Tipe               | Keterangan |
|------------|--------------------|------------|
| `page`     | int (default 1)    | Halaman |
| `pageSize` | int (default 20)   | Item per halaman (maks 100) |
| `q`        | string             | Pencarian teks bebas |
| `status`   | enum               | `online` \| `offline` \| `error` |
| `zone`     | string             | Filter per zona/area |
| `from`     | ISO-8601 datetime  | Batas awal (endpoint `history`) |
| `to`       | ISO-8601 datetime  | Batas akhir (endpoint `history`) |
| `interval` | enum               | `raw` \| `1m` \| `5m` \| `1h` \| `1d` (agregasi history) |

---

## Authentication

Alur: login → simpan `refreshToken` di httpOnly cookie, `accessToken` di memory (Zustand `auth-store`).
Middleware Next.js (`middleware.ts`) melindungi seluruh route kecuali `/login`, `/forgot-password`.

| Method | Path                     | Deskripsi |
|--------|--------------------------|-----------|
| POST   | `/auth/login`            | Login, mengembalikan pasangan token + profil user |
| POST   | `/auth/refresh`          | Tukar refresh token → access token baru |
| POST   | `/auth/logout`           | Revoke sesi |
| GET    | `/auth/me`               | Profil user + roles saat ini |

**POST `/auth/login`** — request:
```json
{ "email": "operator@superweb-iot.id", "password": "••••••••" }
```
respons `data`:
```json
{
  "accessToken": "eyJhbGciOi...",
  "refreshToken": "eyJhbGciOi...",
  "expiresIn": 900,
  "user": {
    "id": "usr_01", "name": "Budi", "email": "operator@superweb-iot.id",
    "role": "operator", "permissions": ["alert.acknowledge", "report.generate"]
  }
}
```

Setiap request terproteksi wajib menyertakan:
```
Authorization: Bearer <accessToken>
```
Pada respons `401`, client otomatis memanggil `/auth/refresh` lalu retry sekali.

---

## REST Endpoints per Modul

### CCTV & AI Analytics — `/cctv`

| Method | Path | Deskripsi |
|--------|------|-----------|
| GET | `/cctv/cameras` | List kamera |
| GET | `/cctv/cameras/:id` | Detail kamera |
| GET | `/cctv/cameras/:id/stream-url` | URL stream HLS (`.m3u8`) |
| GET | `/cctv/analytics/people-count` | Ringkasan people counting |
| GET | `/cctv/analytics/events` | Log event deteksi (intrusion/crowd/loitering) |
| GET | `/cctv/analytics/heatmap` | Data heatmap pergerakan |

`Camera`:
```json
{
  "id": "cam_01", "name": "Lobby Utama", "zone": "Gedung A",
  "status": "online", "resolution": "1080p",
  "lat": -6.2088, "lng": 106.8456,
  "capabilities": ["people_count", "intrusion", "anpr"],
  "lastSeen": "2026-07-15T07:59:50Z"
}
```
`GET /cctv/cameras/:id/stream-url` → `{ "url": "https://cdn.../cam_01/index.m3u8", "protocol": "hls", "expiresAt": "..." }`

### Smart Water Meter — `/water`

| Method | Path | Deskripsi |
|--------|------|-----------|
| GET | `/water/meters` | List meter |
| GET | `/water/meters/:id` | Detail meter |
| GET | `/water/meters/:id/history` | Data historis (`from`,`to`,`interval`) |
| GET | `/water/overview` | Ringkasan (total, rata-rata, top consumers) |
| GET | `/water/leaks` | Deteksi kebocoran aktif |
| GET | `/water/zones` | List zona + status |

`WaterMeter`:
```json
{
  "id": "wm_01", "name": "Resto Selera Rakyat", "zone": "Jakarta Timur",
  "status": "online", "battery": 87,
  "flowRate": 3.2, "totalVolume": 12840.5, "unit": "m3",
  "lastReading": "2026-07-15T07:58:00Z"
}
```
`WaterOverview`:
```json
{
  "totalVolume": 98230, "avgDaily": 4120, "activeLeaks": 2,
  "topConsumers": [{ "id": "wm_01", "name": "Resto Selera Rakyat", "usage": 315 }]
}
```

### Fleet Tracking — `/fleet`

| Method | Path | Deskripsi |
|--------|------|-----------|
| GET | `/fleet/vehicles` | List kendaraan + posisi terakhir |
| GET | `/fleet/vehicles/:id` | Detail kendaraan |
| GET | `/fleet/vehicles/:id/trips` | Riwayat perjalanan |
| GET | `/fleet/vehicles/:id/position` | Posisi terkini |
| GET | `/fleet/geofences` | List geofence |
| POST | `/fleet/geofences` | Buat geofence *(admin)* |
| GET | `/fleet/overview` | Ringkasan KPI armada |

`Vehicle`:
```json
{
  "id": "veh_01", "plate": "B 1234 XYZ", "type": "truck",
  "status": "moving", "ignition": true, "fuel": 62,
  "position": { "lat": -6.21, "lng": 106.85, "speed": 42, "heading": 135 },
  "updatedAt": "2026-07-15T07:59:55Z"
}
```
`POST /fleet/geofences` — body: `{ "name": "Depot Cakung", "type": "circle", "center": [-6.18,106.95], "radius": 300 }`

### Power Meter — `/power`

| Method | Path | Deskripsi |
|--------|------|-----------|
| GET | `/power/meters` | List meter |
| GET | `/power/meters/:id` | Detail meter |
| GET | `/power/meters/:id/history` | Data historis |
| GET | `/power/overview` | Ringkasan (total, loss, per kategori) |
| GET | `/power/quality` | V, I, Hz, PF real-time |
| GET | `/power/cost` | Estimasi biaya |

`PowerMeter`:
```json
{
  "id": "pm_01", "name": "Panel Gedung A", "status": "online",
  "voltage": 220.4, "current": 18.7, "power": 4.1, "energy": 15230.8,
  "powerFactor": 0.98, "frequency": 50.0, "unit": "kWh",
  "lastReading": "2026-07-15T07:59:00Z"
}
```

### Surveillance Weather Station — `/weather`

| Method | Path | Deskripsi |
|--------|------|-----------|
| GET | `/weather/stations` | List stasiun |
| GET | `/weather/stations/:id/current` | Cuaca terkini |
| GET | `/weather/stations/:id/history` | Data historis |
| GET | `/weather/stations/:id/forecast` | Prakiraan (integrasi BMKG) |

`CurrentWeather`:
```json
{
  "stationId": "ws_01", "temperature": 31.2, "humidity": 74,
  "windSpeed": 3.4, "windDirection": 210, "rainfall": 0.0,
  "pressure": 1009.2, "condition": "cerah_berawan",
  "observedAt": "2026-07-15T08:00:00Z"
}
```

### Flood Smart Meter — `/flood`

| Method | Path | Deskripsi |
|--------|------|-----------|
| GET | `/flood/sensors` | List sensor |
| GET | `/flood/sensors/:id` | Detail + level terkini |
| GET | `/flood/sensors/:id/history` | Historis ketinggian air |
| GET | `/flood/overview` | Status semua sensor |
| GET | `/flood/risk-map` | Level risiko per area |

`FloodSensor`:
```json
{
  "id": "fs_01", "name": "Pintu Air Manggarai", "status": "online", "battery": 91,
  "waterLevelCm": 180, "rateOfRise": 4.5,
  "alertLevel": "siaga", "updatedAt": "2026-07-15T08:00:00Z"
}
```
`alertLevel`: `normal` \| `waspada` \| `siaga` \| `bahaya`.

### TempHum & Air Quality — `/temphum`

| Method | Path | Deskripsi |
|--------|------|-----------|
| GET | `/temphum/sensors` | List sensor |
| GET | `/temphum/sensors/:id` | Detail + pembacaan terkini |
| GET | `/temphum/sensors/:id/history` | Data historis |
| GET | `/temphum/rooms` | List ruangan + status |
| GET | `/temphum/overview` | Ringkasan (AQI, rata-rata temp/hum) |

`TempHumSensor`:
```json
{
  "id": "th_01", "name": "Server Room 1", "room": "Data Center",
  "status": "online", "battery": 100,
  "temperature": 22.4, "humidity": 45, "aqi": 38, "pm25": 9, "co2": 620,
  "updatedAt": "2026-07-15T08:00:00Z"
}
```

### Cross-module

| Method | Path | Deskripsi |
|--------|------|-----------|
| GET   | `/alerts` | List alert (filter: `module`,`severity`,`status`,`from`,`to`) |
| PATCH | `/alerts/:id/acknowledge` | Acknowledge alert *(operator+)* |
| GET   | `/devices` | Inventaris perangkat |
| GET   | `/reports/templates` | Template laporan |
| POST  | `/reports/generate` | Generate laporan (async job) |
| GET   | `/users` | List user *(admin)* |

`Alert`:
```json
{
  "id": "alr_01", "module": "flood", "sourceId": "fs_01",
  "severity": "critical", "status": "active",
  "title": "Ketinggian air BAHAYA di Pintu Air Manggarai",
  "value": 210, "threshold": 200,
  "createdAt": "2026-07-15T07:55:00Z", "acknowledgedAt": null
}
```
`severity`: `info` \| `warning` \| `critical`. `status`: `active` \| `acknowledged` \| `resolved`.

`POST /reports/generate` — body: `{ "templateId": "rpt_daily_water", "from": "...", "to": "...", "format": "pdf" }` → `{ "jobId": "job_01", "status": "queued" }`

---

## Realtime — MQTT over WebSocket

Client: `mqtt.js` singleton (`src/lib/mqtt-client.ts`), dipakai via hook `useMqtt` (PRD §7.2).
Broker: `NEXT_PUBLIC_MQTT_URL`. Payload = JSON. Setiap payload menyertakan `timestamp` (ISO-8601).

### Struktur topic

```
swiot/
├── cctv/{cameraId}/{status|analytics|event}
├── water/{meterId}/{data|status|alert}
├── fleet/{vehicleId}/{position|status|alert}
├── power/{meterId}/{data|status|alert}
├── weather/{stationId}/{data|status}
├── flood/{sensorId}/{level|status|alert}
├── temphum/{sensorId}/{data|status|alert}
└── system/{alert/broadcast|status}
```

### Contoh payload

| Topic | Payload |
|-------|---------|
| `swiot/power/{id}/data` | `{ "timestamp": "...", "voltage": 220.4, "current": 18.7, "power": 4.1, "energy": 15230.8 }` |
| `swiot/water/{id}/data` | `{ "timestamp": "...", "flowRate": 3.2, "totalVolume": 12840.5 }` |
| `swiot/fleet/{id}/position` | `{ "timestamp": "...", "lat": -6.21, "lng": 106.85, "speed": 42, "heading": 135, "ignition": true }` |
| `swiot/weather/{id}/data` | `{ "timestamp": "...", "temp": 31.2, "humidity": 74, "wind": 3.4, "rain": 0, "pressure": 1009.2 }` |
| `swiot/flood/{id}/level` | `{ "timestamp": "...", "waterLevelCm": 180, "rateOfRise": 4.5 }` |
| `swiot/temphum/{id}/data` | `{ "timestamp": "...", "temperature": 22.4, "humidity": 45, "aqi": 38, "pm25": 9, "co2": 620 }` |
| `swiot/cctv/{id}/analytics` | `{ "timestamp": "...", "peopleCount": 14, "events": ["crowd"] }` |
| `swiot/system/alert/broadcast` | `{ "timestamp": "...", "severity": "critical", "module": "flood", "title": "...", "sourceId": "fs_01" }` |

Topic `*/alert` dan `system/alert/broadcast` memicu notifikasi in-app, browser push, dan sound alert (PRD §10).

---

## Referensi

- Desain lengkap & data-source per widget: `PRD_Frontend_SuperWeb_IoT_v1.0.md`
- Pola integrasi (ky client, React Query, useMqtt): PRD §7–§8
- RBAC & proteksi middleware: PRD §9

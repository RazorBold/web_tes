# SuperWeb IoT — Frontend

Dashboard monitoring **IoT multi-modul** untuk platform SuperWeb IoT: CCTV & AI analytics,
smart water meter, fleet tracking, power meter, weather station, flood sensor, dan
temp/humidity + air quality — dengan update **real-time via MQTT/WebSocket** dan visualisasi
chart & peta.

Dibangun dengan **Next.js (App Router) + TypeScript + Tailwind CSS v4**.

> **Catatan:** ini bukan Next.js versi standar — ada breaking changes pada API & konvensi.
> Selalu rujuk `node_modules/next/dist/docs/` sebelum menulis kode Next.js (lihat `AGENTS.md`).

---

## Tech Stack

| Kategori | Teknologi |
|----------|-----------|
| Framework | Next.js 16 (App Router), React 19, TypeScript 5 |
| Styling | Tailwind CSS v4, `class-variance-authority`, `tailwind-merge` |
| Data & State | TanStack React Query, Zustand |
| HTTP client | `ky` |
| Realtime | `mqtt.js` (MQTT over WebSocket), `socket.io-client` |
| Visualisasi | ECharts (`echarts-for-react`), Leaflet (`react-leaflet`) |
| Video | `hls.js` (stream CCTV) |
| Form & Validasi | `react-hook-form`, `zod`, `@hookform/resolvers` |
| Tabel & Layout | `@tanstack/react-table`, `react-grid-layout` |
| Auth | `next-auth` |
| Export | `xlsx`, `jspdf`, `html2canvas` |
| Notifikasi | `sonner` |

---

## Prasyarat

- Node.js 20+
- npm (repo memakai `package-lock.json`)

## Menjalankan

```bash
# 1. Install dependencies
npm install

# 2. Siapkan environment
cp .env.example .env.local
# lalu isi NEXT_PUBLIC_API_URL, NEXT_PUBLIC_MQTT_URL, NEXTAUTH_SECRET, dst.

# 3. Jalankan dev server
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

### Scripts

| Perintah | Fungsi |
|----------|--------|
| `npm run dev` | Development server |
| `npm run build` | Build produksi |
| `npm run start` | Menjalankan hasil build |
| `npm run lint` | ESLint |

---

## Environment Variables

Konfigurasi via `.env.local` (template: [`.env.example`](.env.example)).

| Variabel | Keterangan |
|----------|-----------|
| `NEXT_PUBLIC_API_URL` | Base URL REST backend (mis. `http://localhost:8000/api/v1`) |
| `NEXT_PUBLIC_MQTT_URL` | Broker MQTT over WebSocket untuk data realtime |
| `NEXT_PUBLIC_MQTT_USERNAME` / `_PASSWORD` | Kredensial broker |
| `NEXTAUTH_URL` / `NEXTAUTH_SECRET` | Konfigurasi NextAuth |
| `NEXT_PUBLIC_MAP_*` | Tile URL, center, & zoom default peta |
| `NEXT_PUBLIC_ENABLE_*` | Feature flag (dark mode, push, sound alert) |

---

## Modul & Halaman

Seluruh halaman berada di route group `src/app/(dashboard)/`:

| Route | Modul |
|-------|-------|
| `/` | Overview dashboard (ringkasan semua modul) |
| `/cctv` | CCTV & AI analytics (people count, event) |
| `/live` | Live view kamera |
| `/water` | Smart water meter |
| `/fleet` | Fleet tracking (peta GPS) |
| `/power` | Power meter |
| `/weather` | Surveillance weather station |
| `/flood` | Flood smart meter |
| `/temphum` | Temp/humidity & air quality |
| `/alerts` | Alert & notifikasi |
| `/analytics` | Analitik lintas modul |
| `/reports` | Laporan & export |
| `/devices` | Inventaris perangkat |
| `/settings`, `/settings/integrations` | Pengaturan & integrasi (API/MQTT/webhook) |

---

## Struktur Proyek

```
src/
├── app/
│   ├── (dashboard)/        # Route group: semua halaman modul
│   ├── layout.tsx          # Root layout
│   └── globals.css         # Tailwind + token global
├── components/
│   ├── layout/             # Sidebar, topbar, footer, page-header
│   ├── widgets/            # Widget per modul (KPI, chart, feed, map)
│   ├── charts/             # BaseChart (wrapper ECharts)
│   └── maps/               # BaseMap (wrapper Leaflet)
├── config/                 # Tema & navigasi
├── stores/                 # Zustand stores (theme, dst.)
└── images/                 # Aset lokal
```

> Arsitektur target penuh (hooks `use-mqtt`, `lib/api.ts`, `types/`, dsb.) diuraikan di
> `PRD_Frontend_SuperWeb_IoT_v1.0.md` §3. Sebagian belum diimplementasi (lihat status di bawah).

---

## Integrasi Data & API

Frontend mengonsumsi **REST API** (via `ky` + React Query) dan **MQTT** (realtime).
Kontrak lengkap — endpoint, skema JSON, topic MQTT, dan autentikasi — didokumentasikan di:

### 📄 [`docs/API.md`](docs/API.md) &nbsp;·&nbsp; 🧪 Swagger UI interaktif di **`/api-docs`**

Ringkasan:
- **REST**: `GET/POST/PATCH /api/v1/{cctv,water,fleet,power,weather,flood,temphum,alerts,...}`
- **Realtime**: topic `swiot/{modul}/{deviceId}/{data|status|alert}` (JSON payload)
- **Auth**: Bearer JWT (`/auth/login`, `/auth/refresh`), diproteksi middleware Next.js

**Swagger UI tertanam di dalam app.** Jalankan `npm run dev` lalu buka
[http://localhost:3000/api-docs](http://localhost:3000/api-docs) — spesifikasi
OpenAPI 3.1 disajikan sebagai file statis di [`public/openapi.json`](public/openapi.json)
dan di-render dengan `swagger-ui-dist`. Link "API Docs" juga tersedia di sidebar.

> **Status integrasi:** saat ini komponen masih memakai **data mock hardcoded**.
> Layer API (`src/lib/api.ts`), hook React Query, dan MQTT client sesuai `docs/API.md`
> belum diimplementasikan — dokumen tersebut menjadi acuan kontrak backend.

---

## Dokumentasi

| Dokumen | Isi |
|---------|-----|
| [`docs/API.md`](docs/API.md) | Kontrak REST + MQTT + auth yang dikonsumsi frontend |
| [`PRD_Frontend_SuperWeb_IoT_v1.0.md`](PRD_Frontend_SuperWeb_IoT_v1.0.md) | PRD lengkap: desain, arsitektur, RBAC, milestone |
| [`AGENTS.md`](AGENTS.md) | Catatan penting soal versi Next.js di repo ini |

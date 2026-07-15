# PRD Frontend — SuperWeb IoT Platform

> **Version**: 1.0  
> **Tanggal**: 14 Juli 2026  
> **Status**: Draft  
> **Stack**: Next.js 15 + React 19 + TypeScript

---

## 1. Overview

Dokumen ini mendefinisikan spesifikasi teknis frontend untuk SuperWeb IoT Platform. Frontend bertanggung jawab untuk menampilkan data real-time dari 7 modul IoT dalam satu dashboard terpadu dengan tema visual Merah-Putih.

### 1.1 Goals

- Single-pane-of-glass dashboard untuk monitoring 7 modul IoT
- Real-time data update via MQTT/WebSocket tanpa full page reload
- Responsive layout (desktop-first, tablet-friendly)
- Customizable widget layout dengan drag & drop
- Performa tinggi: FCP < 2 detik, TTI < 3 detik
- Dark mode & light mode support

### 1.2 Non-Goals (Fase 1)

- Mobile native app (React Native — fase 2)
- Offline-first / PWA mode
- AI/ML model inference di browser
- Multi-language i18n (Bahasa Indonesia only dulu)

---

## 2. Tech Stack

### 2.1 Core

| Layer | Teknologi | Versi | Alasan |
|-------|-----------|-------|--------|
| Framework | Next.js (App Router) | 15.x | SSR, API routes, file-based routing |
| UI Library | React | 19.x | RSC, concurrent features |
| Language | TypeScript | 5.x | Type safety untuk data IoT yang kompleks |
| Styling | Tailwind CSS | 4.x | Utility-first, theme customization cepat |
| Component Library | shadcn/ui | latest | Accessible, customizable, Tailwind-native |

### 2.2 State & Data

| Layer | Teknologi | Alasan |
|-------|-----------|--------|
| Client State | Zustand | Ringan, minimal boilerplate, cocok untuk real-time |
| Server State | TanStack Query (React Query) | Cache, refetch, optimistic update |
| Real-time | MQTT.js | Native MQTT over WebSocket ke broker |
| Real-time Fallback | Socket.io Client | Notifikasi, alert broadcast |
| Form | React Hook Form + Zod | Validasi typed, performa bagus |

### 2.3 Visualization

| Kebutuhan | Teknologi | Alasan |
|-----------|-----------|--------|
| Charts & Gauges | Apache ECharts | 10K+ data point, gauge, heatmap, real-time append |
| Maps | Leaflet.js + react-leaflet | Gratis, open-source, fleet tracking & geofence |
| Video Streaming | HLS.js / flv.js | CCTV live stream di browser |
| Dashboard Grid | react-grid-layout | Drag & drop widget, responsive breakpoints |
| Data Table | TanStack Table | Sort, filter, pagination, virtual scroll |
| Date Picker | react-day-picker | Lightweight, range selection |

### 2.4 Utilities

| Kebutuhan | Teknologi |
|-----------|-----------|
| Date/Time | dayjs (timezone plugin) |
| HTTP Client | ky (fetch-based, lighter than axios) |
| Export PDF | jsPDF + html2canvas |
| Export Excel | SheetJS (xlsx) |
| Icons | Lucide React |
| Toast/Notification | Sonner |
| Animation | Framer Motion (minimal, transition only) |

### 2.5 DevOps & Tooling

| Kebutuhan | Teknologi |
|-----------|-----------|
| Linter | ESLint + Prettier |
| Testing | Vitest + Testing Library |
| E2E Testing | Playwright |
| CI/CD | GitHub Actions |
| Containerization | Docker + docker-compose |
| Reverse Proxy | Nginx |

---

## 3. Project Structure

```
superweb-iot/
├── public/
│   ├── icons/                    # Favicon, PWA icons
│   ├── images/                   # Static images, logo
│   └── locales/                  # Translation files (future)
│
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/               # Auth group
│   │   │   ├── login/
│   │   │   ├── forgot-password/
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (dashboard)/          # Main dashboard group
│   │   │   ├── layout.tsx        # Sidebar + Topbar layout
│   │   │   ├── page.tsx          # Overview dashboard
│   │   │   ├── cctv/
│   │   │   │   ├── page.tsx      # CCTV overview
│   │   │   │   ├── [cameraId]/   # Detail per kamera
│   │   │   │   └── playback/     # Playback rekaman
│   │   │   ├── water/
│   │   │   │   ├── page.tsx      # Water meter overview
│   │   │   │   ├── [meterId]/    # Detail per meter
│   │   │   │   └── zones/        # Zone management
│   │   │   ├── fleet/
│   │   │   │   ├── page.tsx      # Fleet map overview
│   │   │   │   ├── [vehicleId]/  # Detail per kendaraan
│   │   │   │   ├── trips/        # Trip history
│   │   │   │   └── geofence/     # Geofence management
│   │   │   ├── power/
│   │   │   │   ├── page.tsx      # Power meter overview
│   │   │   │   ├── [meterId]/    # Detail per meter
│   │   │   │   └── cost/         # Cost analysis
│   │   │   ├── weather/
│   │   │   │   ├── page.tsx      # Weather station overview
│   │   │   │   └── [stationId]/  # Detail per station
│   │   │   ├── flood/
│   │   │   │   ├── page.tsx      # Flood monitor overview
│   │   │   │   ├── [sensorId]/   # Detail per sensor
│   │   │   │   └── map/          # Flood risk map
│   │   │   ├── temphum/
│   │   │   │   ├── page.tsx      # TempHum overview
│   │   │   │   ├── [sensorId]/   # Detail per sensor
│   │   │   │   └── floorplan/    # Floor plan view
│   │   │   ├── alerts/
│   │   │   │   ├── page.tsx      # Alert center
│   │   │   │   └── rules/        # Alert rules config
│   │   │   ├── reports/
│   │   │   │   ├── page.tsx      # Report builder
│   │   │   │   └── scheduled/    # Scheduled reports
│   │   │   ├── devices/
│   │   │   │   ├── page.tsx      # Device inventory
│   │   │   │   └── [deviceId]/   # Device detail
│   │   │   └── settings/
│   │   │       ├── page.tsx      # General settings
│   │   │       ├── users/        # User management
│   │   │       ├── roles/        # Role & permission
│   │   │       ├── integrations/ # API & webhook
│   │   │       └── profile/      # User profile
│   │   │
│   │   ├── api/                  # API route handlers (proxy)
│   │   │   ├── auth/
│   │   │   ├── mqtt/             # MQTT WebSocket proxy config
│   │   │   └── export/           # Server-side PDF/Excel gen
│   │   │
│   │   ├── layout.tsx            # Root layout
│   │   ├── not-found.tsx
│   │   └── error.tsx
│   │
│   ├── components/
│   │   ├── ui/                   # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── table.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── tooltip.tsx
│   │   │   └── ...
│   │   │
│   │   ├── layout/
│   │   │   ├── sidebar.tsx       # Sidebar navigation
│   │   │   ├── topbar.tsx        # Top navigation bar
│   │   │   ├── breadcrumb.tsx    # Breadcrumb navigation
│   │   │   ├── search-command.tsx # Global search (⌘K)
│   │   │   └── notification-panel.tsx
│   │   │
│   │   ├── widgets/              # Dashboard widget cards
│   │   │   ├── widget-wrapper.tsx       # Base widget dengan header/actions
│   │   │   ├── stat-card.tsx            # Angka + trend + icon
│   │   │   ├── kpi-row.tsx              # Row of stat cards
│   │   │   │
│   │   │   ├── cctv/
│   │   │   │   ├── camera-grid.tsx      # Grid kamera live
│   │   │   │   ├── camera-card.tsx      # Single camera feed
│   │   │   │   ├── people-count.tsx     # People counting widget
│   │   │   │   ├── heatmap-overlay.tsx  # Heatmap pada floorplan
│   │   │   │   └── event-log.tsx        # Event detection log
│   │   │   │
│   │   │   ├── water/
│   │   │   │   ├── water-overview.tsx   # Total usage + trend
│   │   │   │   ├── top-meters.tsx       # Ranking meter teratas
│   │   │   │   ├── usage-trend.tsx      # Area chart 30 hari
│   │   │   │   ├── leak-status.tsx      # Leak detection cards
│   │   │   │   └── zone-map.tsx         # Peta distribusi meter
│   │   │   │
│   │   │   ├── fleet/
│   │   │   │   ├── fleet-map.tsx        # Peta live kendaraan
│   │   │   │   ├── fleet-kpi.tsx        # Total/Transit/Idle/Maint
│   │   │   │   ├── recent-activity.tsx  # Feed aktivitas
│   │   │   │   ├── trip-replay.tsx      # Playback rute
│   │   │   │   └── geofence-panel.tsx   # Geofence alert log
│   │   │   │
│   │   │   ├── power/
│   │   │   │   ├── energy-overview.tsx  # Total MWh + trend
│   │   │   │   ├── energy-category.tsx  # Donut chart kategori
│   │   │   │   ├── energy-loss.tsx      # Gauge energy loss
│   │   │   │   ├── load-profile.tsx     # Line chart 24 jam
│   │   │   │   ├── power-quality.tsx    # Multi-gauge V/I/Hz/PF
│   │   │   │   └── cost-overview.tsx    # Estimasi biaya
│   │   │   │
│   │   │   ├── weather/
│   │   │   │   ├── weather-today.tsx    # Current weather card
│   │   │   │   ├── hourly-forecast.tsx  # Horizontal forecast strip
│   │   │   │   ├── temp-trend.tsx       # Temperature line chart
│   │   │   │   ├── wind-rose.tsx        # Polar chart angin
│   │   │   │   └── rain-gauge.tsx       # Bar chart curah hujan
│   │   │   │
│   │   │   ├── flood/
│   │   │   │   ├── water-level.tsx      # Level cards (color-coded)
│   │   │   │   ├── level-gauge.tsx      # Gauge per titik pantau
│   │   │   │   ├── level-trend.tsx      # Area chart 24 jam
│   │   │   │   ├── flood-risk-map.tsx   # Map + status overlay
│   │   │   │   └── rain-correlation.tsx # Dual-axis chart
│   │   │   │
│   │   │   └── temphum/
│   │   │       ├── env-overview.tsx     # 6 metric cards
│   │   │       ├── room-status.tsx      # Room status grid
│   │   │       ├── temp-trend.tsx       # Multi-line temp chart
│   │   │       ├── humidity-trend.tsx   # Area chart humidity
│   │   │       └── floorplan-view.tsx   # Interactive floor plan
│   │   │
│   │   ├── charts/                # ECharts wrapper components
│   │   │   ├── base-chart.tsx     # Base ECharts component
│   │   │   ├── line-chart.tsx
│   │   │   ├── bar-chart.tsx
│   │   │   ├── area-chart.tsx
│   │   │   ├── donut-chart.tsx
│   │   │   ├── gauge-chart.tsx
│   │   │   ├── heatmap-chart.tsx
│   │   │   ├── polar-chart.tsx    # Wind rose
│   │   │   └── realtime-chart.tsx # Auto-appending chart
│   │   │
│   │   ├── maps/                  # Leaflet wrapper components
│   │   │   ├── base-map.tsx       # Base Leaflet component
│   │   │   ├── vehicle-marker.tsx # Custom vehicle icon marker
│   │   │   ├── sensor-marker.tsx  # Sensor status marker
│   │   │   ├── geofence-layer.tsx # Polygon/circle geofence
│   │   │   ├── trip-polyline.tsx  # Trip history polyline
│   │   │   └── flood-overlay.tsx  # Color-coded flood zone
│   │   │
│   │   ├── video/                 # Video streaming components
│   │   │   ├── hls-player.tsx     # HLS.js player wrapper
│   │   │   ├── camera-ptz.tsx     # PTZ control overlay
│   │   │   └── timeline-scrubber.tsx # Playback timeline
│   │   │
│   │   └── shared/                # Shared/common components
│   │       ├── date-range-picker.tsx
│   │       ├── export-button.tsx
│   │       ├── status-badge.tsx
│   │       ├── alert-card.tsx
│   │       ├── device-status.tsx
│   │       ├── loading-skeleton.tsx
│   │       ├── empty-state.tsx
│   │       └── error-boundary.tsx
│   │
│   ├── hooks/
│   │   ├── use-mqtt.ts            # MQTT connection & subscribe
│   │   ├── use-realtime.ts        # WebSocket connection
│   │   ├── use-device-data.ts     # Generic device data fetcher
│   │   ├── use-alert.ts           # Alert subscription
│   │   ├── use-media-query.ts     # Responsive breakpoint
│   │   ├── use-debounce.ts
│   │   ├── use-local-storage.ts   # Persist user preferences
│   │   └── use-widget-layout.ts   # Dashboard layout state
│   │
│   ├── stores/                    # Zustand stores
│   │   ├── auth-store.ts          # User session, token
│   │   ├── dashboard-store.ts     # Widget layout, preferences
│   │   ├── alert-store.ts         # Active alerts, unread count
│   │   ├── cctv-store.ts          # Camera status, selected camera
│   │   ├── fleet-store.ts         # Vehicle positions, selected vehicle
│   │   ├── notification-store.ts  # Notification queue
│   │   └── theme-store.ts         # Dark/light mode, accent color
│   │
│   ├── lib/
│   │   ├── api.ts                 # API client (ky instance)
│   │   ├── mqtt-client.ts         # MQTT.js singleton
│   │   ├── socket-client.ts       # Socket.io singleton
│   │   ├── auth.ts                # NextAuth config
│   │   ├── utils.ts               # Utility functions
│   │   └── constants.ts           # API URLs, MQTT topics, thresholds
│   │
│   ├── types/                     # TypeScript type definitions
│   │   ├── api.ts                 # API response types
│   │   ├── sensor.ts              # Sensor data models
│   │   ├── device.ts              # Device models
│   │   ├── alert.ts               # Alert models
│   │   ├── cctv.ts                # Camera, event types
│   │   ├── fleet.ts               # Vehicle, trip, geofence types
│   │   ├── water.ts               # Water meter types
│   │   ├── power.ts               # Power meter types
│   │   ├── weather.ts             # Weather data types
│   │   ├── flood.ts               # Flood sensor types
│   │   ├── temphum.ts             # TempHum sensor types
│   │   └── user.ts                # User, role, permission types
│   │
│   └── config/
│       ├── site.ts                # Site metadata, branding
│       ├── navigation.ts          # Sidebar menu structure
│       ├── dashboard-widgets.ts   # Widget registry & defaults
│       ├── theme.ts               # Tailwind theme tokens
│       └── mqtt-topics.ts         # MQTT topic mapping per modul
│
├── tailwind.config.ts
├── next.config.ts
├── tsconfig.json
├── package.json
├── docker-compose.yml
├── Dockerfile
├── .env.example
└── .env.local
```

---

## 4. Design System & Theming

### 4.1 Color Tokens

```typescript
// config/theme.ts
export const colors = {
  // Brand — Merah Putih
  primary: {
    50:  '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    300: '#FCA5A5',
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',  // ← Primary action
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
    950: '#450A0A',
  },

  // Neutral
  surface: {
    background: '#FFFFFF',     // Light mode page bg
    card: '#F9FAFB',           // Card background
    sidebar: '#1F2937',        // Sidebar bg (dark)
    'sidebar-hover': '#374151',
  },

  // Semantic
  success: '#10B981',    // Normal, online, healthy
  warning: '#F59E0B',    // Waspada, idle, attention needed
  danger:  '#EF4444',    // Bahaya, critical, offline
  info:    '#3B82F6',    // Informational

  // Flood Level Colors
  flood: {
    normal:  '#10B981',  // < 50cm
    waspada: '#F59E0B',  // 50-100cm
    siaga:   '#F97316',  // 100-150cm
    bahaya:  '#EF4444',  // > 150cm
  },
}
```

### 4.2 Typography

```
Font Family : Inter (primary), "Segoe UI" (fallback)
Heading 1   : 24px / 700 — Page title
Heading 2   : 20px / 600 — Section title
Heading 3   : 16px / 600 — Widget title
Body         : 14px / 400 — Default text
Caption      : 12px / 400 — Subtitle, metadata
Mono         : JetBrains Mono — Data values, sensor readings
```

### 4.3 Component Tokens

```
Border Radius : 8px (cards), 6px (buttons), 4px (inputs), 9999px (badges)
Shadow Card   : 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)
Shadow Hover  : 0 4px 6px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)
Spacing Unit  : 4px (0.25rem base)
Sidebar Width : 256px (expanded), 64px (collapsed)
Topbar Height : 64px
```

### 4.4 Dark Mode

Dark mode menggunakan Tailwind `dark:` variant. Toggle disimpan di `theme-store` dan di-persist ke `localStorage`.

```
Background : #0F172A (slate-900)
Surface    : #1E293B (slate-800)
Card       : #334155 (slate-700)
Text       : #F1F5F9 (slate-100)
Muted      : #94A3B8 (slate-400)
Border     : #475569 (slate-600)
```

---

## 5. Layout & Navigation

### 5.1 Shell Layout

```
┌─────────────────────────────────────────────────────┐
│ Topbar [Search ⌘K] [Notif 🔔] [User ▾]            │
├──────┬──────────────────────────────────────────────┤
│      │                                              │
│  S   │           Main Content Area                  │
│  I   │                                              │
│  D   │  ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  E   │  │ Widget 1 │ │ Widget 2 │ │ Widget 3 │    │
│  B   │  └──────────┘ └──────────┘ └──────────┘    │
│  A   │  ┌──────────────────┐ ┌──────────────────┐  │
│  R   │  │    Widget 4      │ │    Widget 5      │  │
│      │  └──────────────────┘ └──────────────────┘  │
│      │                                              │
├──────┴──────────────────────────────────────────────┤
│ Footer: © 2026 SuperWeb IoT | Data in Indonesia 🇮🇩 │
└─────────────────────────────────────────────────────┘
```

### 5.2 Sidebar Navigation Structure

```typescript
// config/navigation.ts
export const navigation = [
  {
    label: 'Overview',
    icon: 'LayoutDashboard',
    href: '/',
  },
  {
    label: 'Live Monitoring',
    icon: 'Monitor',
    href: '/live',
  },
  {
    label: 'Sensors',
    icon: 'Cpu',
    collapsible: true,
    children: [
      { label: 'Water', icon: 'Droplets', href: '/water' },
      { label: 'Energy', icon: 'Zap', href: '/power' },
    ],
  },
  {
    label: 'Fleet Tracking',
    icon: 'Truck',
    href: '/fleet',
  },
  {
    label: 'CCTV & Analytics',
    icon: 'Camera',
    href: '/cctv',
  },
  {
    label: 'Environment',
    icon: 'Thermometer',
    collapsible: true,
    children: [
      { label: 'Weather', icon: 'CloudSun', href: '/weather' },
      { label: 'Flood', icon: 'Waves', href: '/flood' },
      { label: 'TempHum', icon: 'ThermometerSun', href: '/temphum' },
    ],
  },
  { type: 'divider' },
  { label: 'Alerts', icon: 'Bell', href: '/alerts', badge: 'unreadCount' },
  { label: 'Reports', icon: 'FileText', href: '/reports' },
  { label: 'Devices', icon: 'HardDrive', href: '/devices' },
  { label: 'Integrations', icon: 'Plug', href: '/settings/integrations' },
  { label: 'Settings', icon: 'Settings', href: '/settings' },
]
```

### 5.3 Responsive Breakpoints

| Breakpoint | Width | Sidebar | Widget Grid | Behavior |
|------------|-------|---------|-------------|----------|
| `2xl` | ≥ 1536px | Expanded (256px) | 4 columns | Full dashboard |
| `xl` | ≥ 1280px | Expanded (256px) | 3 columns | Default desktop |
| `lg` | ≥ 1024px | Collapsed (64px) | 2 columns | Compact desktop |
| `md` | ≥ 768px | Hidden (overlay) | 2 columns | Tablet |
| `sm` | < 768px | Hidden (overlay) | 1 column | Mobile (future) |

---

## 6. Halaman & Komponen per Modul

### 6.1 Overview Dashboard (`/`)

Halaman utama yang menampilkan ringkasan dari seluruh modul.

**Layout**: `react-grid-layout` dengan default widget arrangement. User bisa drag, resize, add, remove widget.

**Default Widgets**:

| Widget | Size (cols × rows) | Data Source | Refresh |
|--------|-------------------|-------------|---------|
| Live Camera Grid (5 kamera) | 4 × 2 | RTSP via HLS proxy | Streaming |
| Weather Today | 1 × 2 | REST API + MQTT | 5 menit |
| Water Overview | 1 × 1 | REST API | 15 menit |
| Top Water Meters | 1 × 1 | REST API | 15 menit |
| Energy Overview | 1 × 1 | REST API + MQTT | 1 menit |
| Energy by Category | 1 × 1 | REST API | 15 menit |
| Fleet Map Overview | 2 × 2 | MQTT (GPS) | 30 detik |
| CCTV Analytics (People Count) | 2 × 1 | REST API + MQTT | Real-time |
| Environment Overview | 1 × 1 | MQTT | 1 menit |
| Alert Feed | 1 × 2 | WebSocket | Real-time |

**Widget Toolbar Actions** (per widget):
- Refresh data
- Expand fullscreen
- Configure (threshold, display options)
- Remove from dashboard

**Header Actions**:
- `+ Add Widget` — dialog untuk pilih widget dari katalog
- `Export Data` — export dashboard snapshot ke PDF

### 6.2 CCTV & AI Analytics (`/cctv`)

**Halaman Overview** (`/cctv`):

```
┌─ Filter Bar ──────────────────────────────────────┐
│ [Semua Lokasi ▾] [Jakarta Pusat] [Timur] [Barat] │
│ [Semua Kamera ▾]           [Lihat Semua Kamera →] │
└───────────────────────────────────────────────────┘

┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ 🔴 Live  │ │ 🔴 Live  │ │ 🔴 Live  │ │ 🔴 Live  │
│ Camera 1 │ │ Camera 2 │ │ Camera 3 │ │ Camera 4 │
│          │ │          │ │          │ │          │
│ Lobby    │ │ Parking  │ │ Gate     │ │ Corridor │
│ 👤 125   │ │ 👤 98    │ │ 👤 78    │ │ 👤 63    │
└──────────┘ └──────────┘ └──────────┘ └──────────┘

┌─ Tabs ────────────────────────────────────────────┐
│ [People Counting] [Vehicle] [Event] [Heatmap]     │
├───────────────────────────────────────────────────┤
│  People Count (Today)    │  Top Areas by Count     │
│  12,458  ↑ 12.5%         │  1. Lobby      3,245    │
│                          │  2. Main Gate  2,876    │
│  ┌─ Line Chart ───────┐ │  3. Corridor   2,120    │
│  │   hourly trend      │ │  4. Parking    1,987    │
│  └─────────────────────┘ │  5. Office     1,245    │
│                          │                         │
│  Avg per hour: 519       │                         │
├──────────────────────────┴─────────────────────────┤
│  Live Heatmap — Lobby                              │
│  ┌─────────────────────────────────────────┐       │
│  │ [Heatmap overlay on floorplan]           │       │
│  └─────────────────────────────────────────┘       │
└───────────────────────────────────────────────────┘
```

**Komponen**:
- `CameraGrid` — grid view kamera, switch layout 1×1/2×2/3×3/4×4
- `CameraCard` — HLS player + badge live + people count overlay
- `PeopleCountWidget` — angka + trend chart
- `TopAreasChart` — horizontal bar chart
- `HeatmapOverlay` — canvas overlay pada floorplan image
- `EventLog` — filterable event timeline

**Interaksi**:
- Klik kamera → expand fullscreen / buka `/cctv/[cameraId]`
- Filter lokasi → update grid kamera
- Tab switch → ubah analytics view
- Heatmap period selector → 1 jam / 6 jam / 24 jam

**Detail Kamera** (`/cctv/[cameraId]`):
- Full-size HLS player dengan PTZ controls
- People count real-time overlay
- Event timeline sidebar
- Snapshot capture button
- Playback mode toggle

### 6.3 Smart Water Meter (`/water`)

**Halaman Overview**:

```
┌─ KPI Row ─────────────────────────────────────────┐
│ Total Usage     │ vs Last Month  │ Daily Average   │
│ 9,265 m³        │ ↑ 6.2%         │ 308 m³/day      │
└─────────────────┴────────────────┴─────────────────┘

┌─ Top Water Meters ────┐ ┌─ Usage Trend (30d) ────┐
│ 1. Loka Citra  221 m³ │ │ ┌─ Area Chart ────────┐ │
│ 2. Larang P.3  555 m³ │ │ │                      │ │
│ 3. Cikondang   103 m³ │ │ └──────────────────────┘ │
│ 4. Larang P.1  396 m³ │ │ [1D] [7D] [30D] [Custom]│
│ 5. Larang P.2  289 m³ │ └────────────────────────┘
│ [Lihat Semua →]       │
└───────────────────────┘

┌─ Leak Detection ──────────────────────────────────┐
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ │
│ │ Zone A  │ │ Zone B  │ │ Zone C  │ │ Zone D  │ │
│ │ ✅ Normal│ │ ⚠️ Leak │ │ ✅ Normal│ │ ✅ Normal│ │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘ │
└───────────────────────────────────────────────────┘

┌─ Zone Map ────────────────────────────────────────┐
│ [Leaflet map dengan meter markers per zona]       │
└───────────────────────────────────────────────────┘
```

**Komponen**:
- `WaterOverview` — stat cards (total, trend, avg)
- `TopMeters` — ranked list + bar
- `UsageTrend` — ECharts area chart, switchable period
- `LeakStatus` — card grid status per zona
- `ZoneMap` — Leaflet map + meter markers

**Data Flow**:
```
Water Meter → LoRaWAN Gateway → ChirpStack → MQTT → Backend API
                                                   ↓
                                            TimescaleDB → REST API → Frontend
                                                   ↓
                                            MQTT topic: swiot/water/{meterId}/data
```

### 6.4 Fleet Tracking (`/fleet`)

**Halaman Overview**:

```
┌─ KPI Row ─────────────────────────────────────────┐
│ 🚛 Total: 124 │ 🟢 Transit: 86 │ 🟡 Idle: 21 │ 🔴 Maint: 17 │
└────────────────┴─────────────────┴──────────────┴──────────────┘

┌─ Fleet Map (Full Width) ──────────────────────────────────────┐
│ ┌─────────────────────────────────────────┐ ┌─ Recent ──────┐│
│ │                                         │ │ Truck 12      ││
│ │      [Leaflet Map]                      │ │ Jl. Sudirman  ││
│ │      Vehicle markers + routes           │ │ 2 min ago     ││
│ │                                         │ │               ││
│ │                                         │ │ Van 07        ││
│ │                                         │ │ Tol Cikampek  ││
│ │                                         │ │ 5 min ago     ││
│ └─────────────────────────────────────────┘ └───────────────┘│
└───────────────────────────────────────────────────────────────┘
```

**Komponen**:
- `FleetMap` — Leaflet full-width, custom vehicle markers (icon per status)
- `FleetKPI` — 4 stat cards dengan filter
- `RecentActivity` — scrollable feed, klik → center map ke kendaraan
- `VehiclePopup` — popup di map marker: IMEI, speed, last update, battery
- `GeofenceLayer` — polygon/circle overlay + in/out event log

**Real-time Update**:
```
MQTT topic: swiot/fleet/{vehicleId}/position
Payload: { lat, lng, speed, heading, ignition, timestamp }
Frequency: setiap 30 detik saat bergerak, 5 menit saat idle
```

**Detail Kendaraan** (`/fleet/[vehicleId]`):
- Info kendaraan (plat, driver, tipe, status)
- Live position map
- Trip history dengan date picker → polyline replay
- Sensor data: speed, fuel, temperature, door status
- Alert history per kendaraan
- Geofence assignment

### 6.5 Power Meter (`/power`)

**Halaman Overview**:

```
┌─ Energy Overview ─────┐ ┌─ Energy by Category ──────────────┐
│ Total Energy           │ │                                    │
│ 6,759.13 MWh           │ │    ┌─ Donut Chart ─┐              │
│ ↑ 1.81% vs last month │ │    │                │  Residential │
│                        │ │    │   Total         │  Commercial  │
│ Energy Loss            │ │    │ 6,759.13 MWh    │  Street Light│
│ 1.78%                  │ │    │                │  Internal    │
│                        │ │    └────────────────┘              │
└────────────────────────┘ └────────────────────────────────────┘

┌─ Daily Load Profile (24h) ────────────────────────────────────┐
│ ┌─ Line Chart ──────────────────────────────────────────────┐ │
│ │ [Load curve with peak/off-peak shading]                    │ │
│ └────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘

┌─ Power Quality ───────────────────────────────────────────────┐
│ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐                 │
│ │Voltage │ │Current │ │  Freq  │ │  PF    │                 │
│ │220.5 V │ │ 45.2 A │ │ 50.0Hz │ │ 0.95   │                 │
│ │[gauge] │ │[gauge] │ │[gauge] │ │[gauge] │                 │
│ └────────┘ └────────┘ └────────┘ └────────┘                 │
└───────────────────────────────────────────────────────────────┘
```

**Komponen**:
- `EnergyOverview` — total + trend + loss
- `EnergyCategory` — ECharts donut chart
- `LoadProfile` — ECharts line chart 24h, peak/off-peak area shading
- `PowerQuality` — 4 ECharts gauge (V, I, Hz, PF) dengan threshold zones
- `CostOverview` — card + bar chart estimasi biaya per bulan

### 6.6 Surveillance Weather Station (`/weather`)

**Halaman Overview**:

```
┌─ Weather Today ────────────────────────────────────────────────┐
│ 📍 Jakarta Pusat                          Humidity: 73-92%     │
│ ☁️ 25 – 29 °C                             Wind: 10 km/h       │
│    Hujan Ringan                                                │
│                                                                │
│ ┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐     │
│ │03:00 ││06:00 ││09:00 ││12:00 ││15:00 ││18:00 ││21:00 │     │
│ │ 26°C ││ 26°C ││ 27°C ││ 28°C ││ 29°C ││ 28°C ││ 27°C │     │
│ └──────┘└──────┘└──────┘└──────┘└──────┘└──────┘└──────┘     │
│                                                                │
│ Sumber: BMKG (bmkg.go.id)                    [Lihat Detail →] │
└────────────────────────────────────────────────────────────────┘

┌─ Temp Trend (24h) ────────┐ ┌─ Wind Rose ─────────────────┐
│ [Line chart]               │ │ [Polar chart]               │
└────────────────────────────┘ └─────────────────────────────┘

┌─ Rain Gauge (7 days) ─────────────────────────────────────────┐
│ [Bar chart curah hujan harian]                                │
└───────────────────────────────────────────────────────────────┘
```

**Komponen**:
- `WeatherToday` — large card: icon, temp range, condition, wind, humidity
- `HourlyForecast` — horizontal scrollable card strip
- `TempTrend` — ECharts line chart
- `WindRose` — ECharts polar chart (arah & kecepatan angin)
- `RainGauge` — ECharts bar chart (curah hujan)

### 6.7 Flood Smart Meter (`/flood`)

**Halaman Overview**:

```
┌─ Water Level Status ──────────────────────────────────────────┐
│ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐     │
│ │ 🟢 Normal │ │ 🟡 Waspada│ │ 🟢 Normal │ │ 🔴 Bahaya │     │
│ │ Titik A   │ │ Titik B   │ │ Titik C   │ │ Titik D   │     │
│ │ 32 cm     │ │ 67 cm     │ │ 45 cm     │ │ 158 cm    │     │
│ │ ↑ 2cm/jam │ │ ↑ 5cm/jam │ │ ↓ 1cm/jam │ │ ↑12cm/jam │     │
│ └───────────┘ └───────────┘ └───────────┘ └───────────┘     │
└───────────────────────────────────────────────────────────────┘

┌─ Flood Risk Map ──────────────────────────────────────────────┐
│ [Leaflet map dengan color-coded markers per titik pantau]     │
│ [Legend: 🟢 Normal | 🟡 Waspada | 🟠 Siaga | 🔴 Bahaya]       │
└───────────────────────────────────────────────────────────────┘

┌─ Level Trend (24h) ───────┐ ┌─ Rain Correlation ──────────┐
│ [Area chart multi-sensor]  │ │ [Dual line: rain + level]   │
│ [Threshold lines]          │ │ [Correlation indicator]     │
└────────────────────────────┘ └─────────────────────────────┘
```

**Status Level Logic**:
```typescript
function getFloodStatus(level_cm: number): FloodStatus {
  if (level_cm > 150) return { status: 'bahaya',  color: 'red',    label: 'Bahaya' }
  if (level_cm > 100) return { status: 'siaga',   color: 'orange', label: 'Siaga' }
  if (level_cm > 50)  return { status: 'waspada', color: 'yellow', label: 'Waspada' }
  return                      { status: 'normal',  color: 'green',  label: 'Normal' }
}
```

**Alert Escalation**:
```
Waspada  → Notif operator (in-app + push)
Siaga    → Notif operator + admin (in-app + SMS)
Bahaya   → Broadcast semua stakeholder (in-app + SMS + WA)
Rate > 10cm/jam → Early warning regardless of level
```

### 6.8 TempHum (`/temphum`)

**Halaman Overview**:

```
┌─ Environment Overview ────────────────────────────────────────┐
│ ┌──────────┐ ┌──────────┐ ┌──────────┐                       │
│ │ AQI      │ │ Temp     │ │ Humidity │                       │
│ │ 42       │ │ 26.3 °C  │ │ 77.4%    │                       │
│ │ Good 🟢  │ │          │ │          │                       │
│ ├──────────┤ ├──────────┤ ├──────────┤                       │
│ │ PM2.5    │ │ CO2      │ │ Noise    │                       │
│ │ 12.5 µg  │ │ 410 ppm  │ │ 58 dB    │                       │
│ │ Good 🟢  │ │ Normal 🟢│ │ Moderate │                       │
│ └──────────┘ └──────────┘ └──────────┘                       │
└───────────────────────────────────────────────────────────────┘

┌─ Room Status Grid ────────────────────────────────────────────┐
│ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ │
│ │ Server Room│ │ Gudang A   │ │ Office 1F  │ │ Lab        │ │
│ │ 22.1°C 45% │ │ 28.4°C 65% │ │ 24.0°C 55% │ │ 20.5°C 40% │ │
│ │ ✅ Normal  │ │ ⚠️ Warning │ │ ✅ Normal  │ │ ✅ Normal  │ │
│ └────────────┘ └────────────┘ └────────────┘ └────────────┘ │
└───────────────────────────────────────────────────────────────┘

┌─ Temp Trend (24h) ────────┐ ┌─ Humidity Trend (24h) ──────┐
│ [Multi-line chart]         │ │ [Area chart]                 │
│ [Per room, color-coded]    │ │ [Per room, color-coded]      │
└────────────────────────────┘ └─────────────────────────────┘
```

**Configurable Thresholds per Room**:
```typescript
const roomThresholds = {
  server_room:  { temp: [18, 27], humidity: [30, 60] },
  warehouse:    { temp: [15, 35], humidity: [30, 70] },
  office:       { temp: [20, 28], humidity: [40, 65] },
  cold_storage: { temp: [-5, 5],  humidity: [80, 95] },
  lab:          { temp: [18, 25], humidity: [35, 55] },
}
```

---

## 7. Real-time Data Architecture

### 7.1 MQTT Topic Structure

```
swiot/                              # Root namespace
├── cctv/
│   ├── {cameraId}/status           # online/offline/error
│   ├── {cameraId}/analytics        # people_count, events
│   └── {cameraId}/event            # intrusion, crowd, loitering
│
├── water/
│   ├── {meterId}/data              # flow_rate, total_volume
│   ├── {meterId}/status            # online/offline/battery
│   └── {meterId}/alert             # leak detected
│
├── fleet/
│   ├── {vehicleId}/position        # lat, lng, speed, heading
│   ├── {vehicleId}/status          # ignition, door, fuel
│   └── {vehicleId}/alert           # geofence, overspeed, SOS
│
├── power/
│   ├── {meterId}/data              # voltage, current, power, energy
│   ├── {meterId}/status            # online/offline
│   └── {meterId}/alert             # overload, voltage sag
│
├── weather/
│   ├── {stationId}/data            # temp, humidity, wind, rain, pressure
│   └── {stationId}/status          # online/offline
│
├── flood/
│   ├── {sensorId}/level            # water_level_cm, rate_of_rise
│   ├── {sensorId}/status           # online/offline/battery
│   └── {sensorId}/alert            # waspada, siaga, bahaya
│
├── temphum/
│   ├── {sensorId}/data             # temperature, humidity, aqi, pm25, co2
│   ├── {sensorId}/status           # online/offline/battery
│   └── {sensorId}/alert            # temp/humidity out of range
│
└── system/
    ├── alert/broadcast             # System-wide alerts
    └── status                      # Platform health
```

### 7.2 useMqtt Hook

```typescript
// hooks/use-mqtt.ts
import { useEffect, useRef, useCallback } from 'react'
import mqtt from 'mqtt'
import { useMqttStore } from '@/stores/mqtt-store'

interface UseMqttOptions {
  topics: string | string[]
  onMessage: (topic: string, payload: any) => void
  qos?: 0 | 1 | 2
}

export function useMqtt({ topics, onMessage, qos = 0 }: UseMqttOptions) {
  const client = useMqttStore((s) => s.client)
  const callbackRef = useRef(onMessage)
  callbackRef.current = onMessage

  useEffect(() => {
    if (!client) return

    const topicList = Array.isArray(topics) ? topics : [topics]

    const handler = (receivedTopic: string, message: Buffer) => {
      if (topicList.some((t) => matchTopic(t, receivedTopic))) {
        try {
          const payload = JSON.parse(message.toString())
          callbackRef.current(receivedTopic, payload)
        } catch {
          callbackRef.current(receivedTopic, message.toString())
        }
      }
    }

    topicList.forEach((t) => client.subscribe(t, { qos }))
    client.on('message', handler)

    return () => {
      topicList.forEach((t) => client.unsubscribe(t))
      client.off('message', handler)
    }
  }, [client, topics, qos])
}
```

### 7.3 Real-time Chart Update Pattern

```typescript
// Pattern: ECharts real-time append
function RealtimeChart({ sensorId }: { sensorId: string }) {
  const chartRef = useRef<EChartsInstance>(null)
  const MAX_POINTS = 200

  useMqtt({
    topics: `swiot/power/${sensorId}/data`,
    onMessage: (_, payload) => {
      const chart = chartRef.current
      if (!chart) return

      const option = chart.getOption()
      const data = option.series[0].data as [string, number][]

      data.push([payload.timestamp, payload.power])

      // Sliding window
      if (data.length > MAX_POINTS) data.shift()

      chart.setOption({
        series: [{ data }],
      })
    },
  })

  return <BaseChart ref={chartRef} option={initialOption} />
}
```

---

## 8. API Integration

### 8.1 API Client Setup

```typescript
// lib/api.ts
import ky from 'ky'
import { useAuthStore } from '@/stores/auth-store'

export const api = ky.create({
  prefixUrl: process.env.NEXT_PUBLIC_API_URL,
  hooks: {
    beforeRequest: [
      (request) => {
        const token = useAuthStore.getState().accessToken
        if (token) {
          request.headers.set('Authorization', `Bearer ${token}`)
        }
      },
    ],
    afterResponse: [
      async (_, __, response) => {
        if (response.status === 401) {
          // Attempt token refresh
          await useAuthStore.getState().refreshToken()
        }
      },
    ],
  },
  timeout: 30000,
  retry: { limit: 2, methods: ['get'] },
})
```

### 8.2 API Endpoints per Modul

```typescript
// Contoh endpoint mapping

// CCTV
GET    /api/v1/cctv/cameras                    // List semua kamera
GET    /api/v1/cctv/cameras/:id                // Detail kamera
GET    /api/v1/cctv/cameras/:id/stream-url     // HLS stream URL
GET    /api/v1/cctv/analytics/people-count     // People count summary
GET    /api/v1/cctv/analytics/events           // Event detection log
GET    /api/v1/cctv/analytics/heatmap          // Heatmap data

// Water
GET    /api/v1/water/meters                    // List semua meter
GET    /api/v1/water/meters/:id                // Detail meter
GET    /api/v1/water/meters/:id/history        // Historical data
GET    /api/v1/water/overview                  // Summary (total, avg, top)
GET    /api/v1/water/leaks                     // Active leak detections
GET    /api/v1/water/zones                     // Zone list + status

// Fleet
GET    /api/v1/fleet/vehicles                  // List kendaraan + last position
GET    /api/v1/fleet/vehicles/:id              // Detail kendaraan
GET    /api/v1/fleet/vehicles/:id/trips        // Trip history
GET    /api/v1/fleet/vehicles/:id/position     // Current position
GET    /api/v1/fleet/geofences                 // Geofence list
POST   /api/v1/fleet/geofences                // Create geofence
GET    /api/v1/fleet/overview                  // KPI summary

// Power
GET    /api/v1/power/meters                    // List meter
GET    /api/v1/power/meters/:id                // Detail meter
GET    /api/v1/power/meters/:id/history        // Historical data
GET    /api/v1/power/overview                  // Summary (total, loss, category)
GET    /api/v1/power/quality                   // V, I, Hz, PF real-time
GET    /api/v1/power/cost                      // Cost estimation

// Weather
GET    /api/v1/weather/stations                // List stasiun
GET    /api/v1/weather/stations/:id/current    // Current weather
GET    /api/v1/weather/stations/:id/history    // Historical data
GET    /api/v1/weather/stations/:id/forecast   // Forecast (BMKG integration)

// Flood
GET    /api/v1/flood/sensors                   // List sensor
GET    /api/v1/flood/sensors/:id               // Detail + current level
GET    /api/v1/flood/sensors/:id/history       // Historical level data
GET    /api/v1/flood/overview                  // All sensors status
GET    /api/v1/flood/risk-map                  // Risk level per area

// TempHum
GET    /api/v1/temphum/sensors                 // List sensor
GET    /api/v1/temphum/sensors/:id             // Detail + current reading
GET    /api/v1/temphum/sensors/:id/history     // Historical data
GET    /api/v1/temphum/rooms                   // Room list + status
GET    /api/v1/temphum/overview                // Summary (AQI, avg temp/hum)

// Cross-module
GET    /api/v1/alerts                          // Alert list (filterable)
PATCH  /api/v1/alerts/:id/acknowledge          // Acknowledge alert
GET    /api/v1/devices                         // Device inventory
GET    /api/v1/reports/templates               // Report templates
POST   /api/v1/reports/generate                // Generate report
GET    /api/v1/users                           // User list (admin)
```

### 8.3 React Query Pattern

```typescript
// hooks/use-water-overview.ts
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { WaterOverview } from '@/types/water'

export function useWaterOverview() {
  return useQuery({
    queryKey: ['water', 'overview'],
    queryFn: () => api.get('water/overview').json<WaterOverview>(),
    refetchInterval: 15 * 60 * 1000, // 15 menit
    staleTime: 5 * 60 * 1000,        // 5 menit stale
  })
}
```

---

## 9. Authentication & Authorization

### 9.1 Auth Flow

```
Login Page → POST /api/auth/login → { accessToken, refreshToken }
           → Store di httpOnly cookie (refresh) + memory (access)
           → Redirect ke dashboard

Session Check → Middleware (next middleware.ts)
             → Cek cookie validity
             → Redirect ke login jika expired
```

### 9.2 RBAC Matrix

| Feature | Super Admin | Admin | Operator | Viewer |
|---------|:-----------:|:-----:|:--------:|:------:|
| View dashboard | ✅ | ✅ | ✅ | ✅ |
| View alert | ✅ | ✅ | ✅ | ✅ |
| Acknowledge alert | ✅ | ✅ | ✅ | ❌ |
| Configure alert rules | ✅ | ✅ | ❌ | ❌ |
| Manage devices | ✅ | ✅ | ❌ | ❌ |
| Create geofence | ✅ | ✅ | ❌ | ❌ |
| Generate report | ✅ | ✅ | ✅ | ✅ |
| Export data | ✅ | ✅ | ✅ | ❌ |
| Manage users | ✅ | ❌ | ❌ | ❌ |
| System settings | ✅ | ❌ | ❌ | ❌ |
| Manage roles | ✅ | ❌ | ❌ | ❌ |
| View audit log | ✅ | ✅ | ❌ | ❌ |
| Customize dashboard | ✅ | ✅ | ✅ | ❌ |
| Add/remove widget | ✅ | ✅ | ✅ | ❌ |

### 9.3 Middleware Protection

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const publicPaths = ['/login', '/forgot-password']

export function middleware(request: NextRequest) {
  const token = request.cookies.get('refresh_token')?.value
  const { pathname } = request.nextUrl

  if (publicPaths.includes(pathname)) {
    if (token) return NextResponse.redirect(new URL('/', request.url))
    return NextResponse.next()
  }

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}
```

---

## 10. Alert & Notification System

### 10.1 In-App Notification

```typescript
// stores/alert-store.ts
interface AlertStore {
  alerts: Alert[]
  unreadCount: number
  addAlert: (alert: Alert) => void
  markAsRead: (id: string) => void
  acknowledge: (id: string) => Promise<void>
}
```

**Notification Bell Behavior**:
- Badge merah menunjukkan jumlah unread
- Klik → dropdown panel alert terbaru (max 10)
- Severity icon: 🔵 Info, 🟡 Warning, 🔴 Critical, 🚨 Emergency
- Klik alert → navigate ke modul terkait
- "Lihat Semua" → `/alerts`

### 10.2 Browser Push Notification

```typescript
// Minta permission saat login pertama kali
if ('Notification' in window && Notification.permission === 'default') {
  Notification.requestPermission()
}

// Trigger dari MQTT critical alert
useMqtt({
  topics: 'swiot/system/alert/broadcast',
  onMessage: (_, alert) => {
    if (alert.severity === 'critical' || alert.severity === 'emergency') {
      new Notification(`⚠️ ${alert.title}`, {
        body: alert.message,
        icon: '/icons/alert-icon.png',
        tag: alert.id, // Prevent duplicate
      })
    }
  },
})
```

### 10.3 Sound Alert

```typescript
const alertSounds = {
  info: null,                    // No sound
  warning: '/sounds/warning.mp3', // Gentle chime
  critical: '/sounds/critical.mp3', // Urgent beep
  emergency: '/sounds/emergency.mp3', // Siren loop
}
```

---

## 11. Performance Optimization

### 11.1 Targets

| Metric | Target | Tool |
|--------|--------|------|
| First Contentful Paint (FCP) | < 1.5s | Lighthouse |
| Largest Contentful Paint (LCP) | < 2.5s | Lighthouse |
| Time to Interactive (TTI) | < 3.0s | Lighthouse |
| Cumulative Layout Shift (CLS) | < 0.1 | Lighthouse |
| First Input Delay (FID) | < 100ms | Web Vitals |
| Bundle Size (initial) | < 250KB gzipped | next/bundle-analyzer |

### 11.2 Strategies

**Code Splitting**:
```typescript
// Lazy load module halaman
const FleetMap = dynamic(() => import('@/components/widgets/fleet/fleet-map'), {
  ssr: false,   // Leaflet tidak support SSR
  loading: () => <MapSkeleton />,
})

const HLSPlayer = dynamic(() => import('@/components/video/hls-player'), {
  ssr: false,
})
```

**Data Optimization**:
- React Query cache: staleTime & cacheTime per data type
- MQTT: subscribe hanya topic yang visible di viewport
- ECharts: `large: true` mode untuk > 1000 data point
- Virtual scroll untuk device list & alert log (TanStack Virtual)
- Image lazy loading untuk camera thumbnails

**Bundle Optimization**:
- Tree-shake ECharts: import hanya chart types yang dipakai
- Leaflet: conditional import (ssr: false)
- dayjs: import locale & plugin on-demand

```typescript
// ECharts tree-shaking
import * as echarts from 'echarts/core'
import { LineChart, BarChart, GaugeChart, PieChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([
  LineChart, BarChart, GaugeChart, PieChart,
  GridComponent, TooltipComponent, LegendComponent,
  CanvasRenderer,
])
```

---

## 12. Testing Strategy

### 12.1 Test Pyramid

| Level | Tool | Coverage Target | Scope |
|-------|------|----------------|-------|
| Unit | Vitest | > 80% | Hooks, utils, stores, pure logic |
| Component | Testing Library | > 60% | Widget rendering, interaction |
| Integration | Vitest + MSW | > 50% | API integration, data flow |
| E2E | Playwright | Critical paths | Login, dashboard, alerts |

### 12.2 Critical E2E Scenarios

1. Login → muncul dashboard overview → widget loaded
2. Alert masuk → notification bell update → klik → navigate
3. Fleet map → klik kendaraan → popup detail → klik trip history
4. Water leak alert → status card berubah merah → alert log updated
5. Flood level naik → status card kuning/merah → notifikasi muncul
6. CCTV grid → klik kamera → fullscreen player → PTZ controls work
7. Export report → pilih modul + date range → download PDF/Excel
8. Settings → tambah user → assign role → user bisa login

---

## 13. Deployment

### 13.1 Docker Setup

```yaml
# docker-compose.yml
services:
  superweb-frontend:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=https://api.superweb-iot.id
      - NEXT_PUBLIC_MQTT_URL=wss://mqtt.superweb-iot.id:8084/mqtt
      - NEXTAUTH_URL=https://superweb-iot.id
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - superweb-frontend
```

### 13.2 Environment Variables

```bash
# .env.example

# API
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_MQTT_URL=ws://localhost:8083/mqtt
NEXT_PUBLIC_MQTT_USERNAME=frontend
NEXT_PUBLIC_MQTT_PASSWORD=

# Auth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Map
NEXT_PUBLIC_MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
NEXT_PUBLIC_MAP_DEFAULT_CENTER=[-6.2088,106.8456]  # Jakarta
NEXT_PUBLIC_MAP_DEFAULT_ZOOM=12

# Feature Flags
NEXT_PUBLIC_ENABLE_DARK_MODE=true
NEXT_PUBLIC_ENABLE_PUSH_NOTIFICATION=true
NEXT_PUBLIC_ENABLE_SOUND_ALERT=true
```

---

## 14. Development Milestones

### Fase 1: Foundation (Minggu 3-6)

- [x] Project scaffolding (Next.js + Tailwind + shadcn/ui)
- [ ] Auth pages (login, forgot password)
- [ ] Shell layout (sidebar, topbar, breadcrumb)
- [ ] Dashboard grid skeleton (react-grid-layout)
- [ ] Base chart component (ECharts wrapper)
- [ ] Base map component (Leaflet wrapper)
- [ ] MQTT hook & connection manager
- [ ] API client setup
- [ ] Theme system (light/dark mode)
- [ ] Notification system skeleton

### Fase 2: Core Modules (Minggu 7-14)

- [ ] CCTV: camera grid, HLS player, people counting
- [ ] Water: overview, top meters, usage trend, leak detection
- [ ] Power: energy overview, category donut, load profile, gauges
- [ ] TempHum: env overview, room status, trends

### Fase 3: Advanced Modules (Minggu 15-20)

- [ ] Fleet: map, KPI, recent activity, trip replay, geofence
- [ ] Weather: today card, forecast, temp trend, wind rose, rain gauge
- [ ] Flood: level status, risk map, trend, rain correlation

### Fase 4: Polish (Minggu 21-24)

- [ ] Alert center: unified feed, acknowledge, escalation
- [ ] Report builder: template, date range, export PDF/Excel
- [ ] Device management: inventory, health, grouping
- [ ] Settings: users, roles, integrations, profile
- [ ] Performance tuning, bundle optimization
- [ ] Responsive testing (tablet)
- [ ] E2E testing (Playwright)

### Fase 5: Launch (Minggu 25-26)

- [ ] UAT with stakeholders
- [ ] Bug fixing
- [ ] Docker production build
- [ ] Deployment & monitoring setup
- [ ] Handover documentation

---

## 15. Dependencies & Package List

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "typescript": "^5.6.0",

    "@tanstack/react-query": "^5.60.0",
    "@tanstack/react-table": "^8.20.0",
    "zustand": "^5.0.0",
    "react-hook-form": "^7.53.0",
    "zod": "^3.23.0",
    "@hookform/resolvers": "^3.9.0",

    "echarts": "^5.5.0",
    "echarts-for-react": "^3.0.0",
    "leaflet": "^1.9.0",
    "react-leaflet": "^4.2.0",
    "react-grid-layout": "^1.4.0",
    "hls.js": "^1.5.0",

    "mqtt": "^5.10.0",
    "socket.io-client": "^4.8.0",
    "ky": "^1.7.0",
    "next-auth": "^5.0.0",

    "tailwindcss": "^4.0.0",
    "@radix-ui/react-dialog": "latest",
    "@radix-ui/react-dropdown-menu": "latest",
    "@radix-ui/react-tabs": "latest",
    "lucide-react": "^0.400.0",
    "sonner": "^1.7.0",
    "framer-motion": "^11.11.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.5.0",

    "dayjs": "^1.11.0",
    "jspdf": "^2.5.0",
    "html2canvas": "^1.4.0",
    "xlsx": "^0.18.0",
    "react-day-picker": "^9.4.0"
  },

  "devDependencies": {
    "vitest": "^2.1.0",
    "@testing-library/react": "^16.0.0",
    "@playwright/test": "^1.49.0",
    "msw": "^2.6.0",
    "eslint": "^9.0.0",
    "prettier": "^3.4.0",
    "@next/bundle-analyzer": "^15.0.0",
    "@types/leaflet": "^1.9.0",
    "@types/react-grid-layout": "^1.3.0"
  }
}
```

---

## 16. Glossary

| Term | Definisi |
|------|---------|
| Widget | Komponen visual mandiri di dashboard (chart, stat card, map, dll) |
| Modul | Grup fitur per domain (CCTV, Water, Fleet, dll) |
| FCP | First Contentful Paint — waktu pertama konten muncul |
| TTI | Time to Interactive — waktu halaman bisa diinteraksi |
| MQTT | Message Queuing Telemetry Transport — protokol messaging IoT |
| HLS | HTTP Live Streaming — protokol video streaming |
| RBAC | Role-Based Access Control — kontrol akses berbasis peran |
| SSR | Server-Side Rendering |
| RSC | React Server Components |
| PTZ | Pan-Tilt-Zoom — kontrol kamera CCTV |
| AQI | Air Quality Index |
| QoS | Quality of Service (MQTT: 0=at most once, 1=at least once, 2=exactly once) |

---

> **© 2026 SuperWeb IoT Platform**  
> *Data stays in Indonesia. Secure. Reliable. Independent.*

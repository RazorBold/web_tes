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
    600: '#DC2626',  // ← Primary action (Solid Sovereign Red)
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
    950: '#450A0A',
  },

  // Neutral (Light Mode)
  surface: {
    background: '#F8FAFC',     // Light mode canvas bg
    card: '#FFFFFF',           // Card background
    border: '#E2E8F0',         // Card borders
    sidebar: '#FFFFFF',        // Sidebar bg
    text: '#0F172A',           // Main text
    muted: '#64748B',          // Muted text
  },

  // Neutral (Dark Mode)
  dark: {
    background: '#0F172A',     // Deep slate page bg
    surface: '#1E293B',        // Card background
    border: '#334155',         // Card borders
    sidebar: '#1E293B',        // Sidebar bg
    text: '#F1F5F9',           // Main text
    muted: '#94A3B8',          // Muted text
  },

  // Semantic
  success: '#22C55E',    // Normal, online, healthy
  warning: '#F97316',    // Waspada, idle, attention needed
  danger:  '#EF4444',    // Bahaya, critical, offline
  info:    '#3B82F6',    // Informational

  // Flood Level Colors
  flood: {
    normal:  '#22C55E',  // < 50cm
    waspada: '#EAB308',  // 50-100cm
    siaga:   '#F97316',  // 100-150cm
    bahaya:  '#EF4444',  // > 150cm
  },
};

export const roomThresholds = {
  server_room:  { temp: [18, 27], humidity: [30, 60] },
  warehouse:    { temp: [15, 35], humidity: [30, 70] },
  office:       { temp: [20, 28], humidity: [40, 65] },
  cold_storage: { temp: [-5, 5],  humidity: [80, 95] },
  lab:          { temp: [18, 25], humidity: [35, 55] },
};

export const navigation = [
  {
    label: 'Dashboard',
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
    label: 'CCTV & AI',
    icon: 'Camera',
    href: '/cctv',
  },
  {
    label: 'Environment',
    icon: 'Leaf',
    collapsible: true,
    children: [
      { label: 'Weather', icon: 'CloudSun', href: '/weather' },
      { label: 'Flood', icon: 'Waves', href: '/flood' },
      { label: 'TempHum', icon: 'ThermometerSun', href: '/temphum' },
    ],
  },
  {
    label: 'Analytics',
    icon: 'BarChart3',
    href: '/analytics',
  },
  { type: 'divider' },
  { label: 'Alert Center', icon: 'Bell', href: '/alerts', badge: '5' },
  { label: 'Reports', icon: 'FileText', href: '/reports' },
  { label: 'Devices', icon: 'HardDrive', href: '/devices' },
  { label: 'Integrations', icon: 'Plug', href: '/settings/integrations' },
  { label: 'API Docs', icon: 'FileText', href: '/api-docs' },
  { label: 'Settings', icon: 'Settings', href: '/settings' },
];

// config/theme.ts
export const colors = {
  // Brand — Merah Putih
  primary: {
    50: '#FEF2F2',
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
  danger: '#EF4444',    // Bahaya, critical, offline
  info: '#3B82F6',    // Informational

  // Flood Level Colors
  flood: {
    normal: '#22C55E',  // < 50cm
    waspada: '#EAB308',  // 50-100cm
    siaga: '#F97316',  // 100-150cm
    bahaya: '#EF4444',  // > 150cm
  },
};

export type NavItem = {
  label?: string;
  icon?: string;
  href?: string;
  badge?: string;
  type?: 'divider' | 'header';
  collapsible?: boolean;
  children?: { label: string; icon: string; href: string }[];
  /**
   * Awalan alamat yang ikut membuat menu ini menyala, selain `href` itu sendiri.
   *
   * Dipakai menu yang punya beberapa halaman setara: CCTV & AI menunjuk langsung
   * ke /cctv/v1, tapi menunya harus tetap menyala saat /cctv/v2 dibuka.
   */
  activePrefix?: string;
  /**
   * Sembunyikan dari sidebar tanpa menghapus entrinya.
   *
   * Halamannya TETAP HIDUP dan bisa dibuka lewat alamatnya langsung — yang
   * hilang hanya tautannya. Dipakai untuk menu yang sedang tidak ingin
   * ditampilkan tapi belum tentu dibuang, supaya menghidupkannya kembali cukup
   * menghapus satu baris, bukan menyusun ulang entrinya dari ingatan.
   */
  hidden?: boolean;
};

export const navigation: NavItem[] = [
  // 1. Dashboard — overview semua data: CCTV + Sensor + Tracking.
  //
  // Disembunyikan 2026-08-03 atas permintaan pemakai. Halamannya tetap hidup di
  // "/" dan tetap ikut ter-build; yang hilang cuma tautannya di sidebar. Hapus
  // baris `hidden` untuk menampilkannya lagi.
  {
    label: 'Dashboard',
    icon: 'LayoutDashboard',
    href: '/',
    hidden: true,
  },
  // 2. CCTV & AI — fokus kamera & AI, menu utama terpisah.
  //
  // Menunjuk LANGSUNG ke varian yang dipakai, bukan ke /cctv. Lewat /cctv,
  // kliknya melewati pengalihan; kalau kebetulan sudah berada di varian tujuan,
  // pengalihan itu mendarat di halaman yang sama sehingga menunya terasa mati
  // ditekan. Untuk mengunci varian lain, ganti baris href di bawah ini.
  {
    label: 'CCTV & AI',
    icon: 'Camera',
    href: '/cctv/v1',
    activePrefix: '/cctv',
  },
  // 3. IoT Dashboard Platform — analitik lintas modul, menu utama terpisah
  {
    label: 'IoT Dashboard Platform',
    icon: 'BarChart3',
    href: '/analytics',
  },
  // 4. Sensor IoT — semua sensor + tracking (tanpa CCTV/AI), dalam 1 menu collapsible
  {
    label: 'Sensor IoT',
    icon: 'Cpu',
    collapsible: true,
    children: [
      { label: 'Water', icon: 'Droplets', href: '/water' },
      { label: 'Energy', icon: 'Zap', href: '/power' },
      { label: 'Fleet Tracking', icon: 'Truck', href: '/fleet' },
      { label: 'Flood', icon: 'Waves', href: '/flood' },
      { label: 'Weather', icon: 'CloudSun', href: '/weather' },
      { label: 'Environment', icon: 'ThermometerSun', href: '/temphum' },
    ],
  },
  { type: 'divider' },
  { label: 'Alert Center', icon: 'Bell', href: '/alerts', badge: '5' },
  { label: 'Reports', icon: 'FileText', href: '/reports' },
  { label: 'Devices', icon: 'HardDrive', href: '/devices' },
  { label: 'Settings', icon: 'Settings', href: '/settings' },
];

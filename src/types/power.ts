export interface PowerMeter {
  id: string;
  name: string;
  sector: "industri" | "komersial" | "residensial";
  status: "online" | "offline" | "error";
  voltage: number;
  current: number;
  power: number;
  energy: number;
  powerFactor: number;
  frequency: number;
  lossPct: number;
  unit: string;
  lastReading: string;
}

export interface PowerReadingPoint {
  recordedAt: string;
  voltage: number;
  current: number;
  power: number;
  energy: number;
  powerFactor: number;
  frequency: number;
}

export interface PowerOverview {
  totalEnergy: number;
  peakLoadKw: number;
  peakLoadAt: string;
  avgPowerFactor: number;
  avgLossPct: number;
  sectors: { sector: string; energy: number; pct: number }[];
  loadCurve: { hour: string; powerKw: number }[];
}

export interface PowerQuality {
  voltage: number;
  current: number;
  frequency: number;
  powerFactor: number;
}

export interface WaterMeter {
  id: string;
  name: string;
  zone: string;
  status: "online" | "offline" | "error";
  battery: number | null;
  flowRate: number;
  totalVolume: number;
  unit: string;
  lastReading: string;
}

export interface WaterZone {
  id: string;
  name: string;
  status: "normal" | "leak";
  pressureBar: number;
}

export interface WaterReadingPoint {
  recordedAt: string;
  flowRate: number;
  totalVolume: number;
}

export interface WaterOverview {
  totalVolume: number;
  avgDaily: number;
  activeLeaks: number;
  topConsumers: { id: string; name: string; zone: string; usage: number }[];
  trend: { date: string; volume: number }[];
}

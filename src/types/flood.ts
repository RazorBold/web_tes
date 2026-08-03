export interface FloodSensor {
  id: string;
  name: string;
  status: "online" | "offline" | "error";
  battery: number | null;
  waterLevelCm: number;
  rateOfRise: number;
  alertLevel: "normal" | "waspada" | "siaga" | "bahaya";
  updatedAt: string;
}

export interface FloodReadingPoint {
  recordedAt: string;
  waterLevelCm: number;
  rateOfRise: number;
}

export interface FloodOverview {
  highestAlertLevel: FloodSensor["alertLevel"];
  counts: Record<FloodSensor["alertLevel"], number>;
}

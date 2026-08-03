export interface FleetVehicle {
  id: string;
  plate: string;
  type: string;
  status: "moving" | "idle" | "maintenance";
  ignition: boolean;
  fuel: number | null;
  driverName: string | null;
  position: { lat: number; lng: number; speed: number; heading: number };
  distanceTodayKm: number;
  hoursActiveToday: number;
  updatedAt: string;
}

export interface FleetOverview {
  total: number;
  moving: number;
  idle: number;
  maintenance: number;
  totalDistanceTodayKm: number;
  totalHoursActiveToday: number;
}

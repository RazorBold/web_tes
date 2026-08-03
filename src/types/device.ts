export interface Device {
  id: string;
  type: string;
  module: string;
  location: string;
  status: "online" | "offline";
  battery: number | null;
  signal: string;
  updatedAt: string;
}

export interface DeviceOverview {
  total: number;
  online: number;
  offline: number;
  lowBattery: number;
}

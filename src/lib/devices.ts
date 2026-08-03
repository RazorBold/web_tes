import { query } from "@/lib/db";
import type { Device, DeviceOverview } from "@/types/device";

interface DeviceRow {
  id: string;
  type: string;
  module: string;
  location: string;
  status: string;
  battery: number | null;
  signal_text: string;
  updated_at: Date;
}

function mapDevice(r: DeviceRow): Device {
  return {
    id: r.id,
    type: r.type,
    module: r.module,
    location: r.location,
    status: r.status as Device["status"],
    battery: r.battery,
    signal: r.signal_text,
    updatedAt: r.updated_at.toISOString(),
  };
}

export async function listDevices(): Promise<Device[]> {
  const rows = await query<DeviceRow>("SELECT * FROM devices ORDER BY updated_at DESC");
  return rows.map(mapDevice);
}

export async function getDeviceOverview(): Promise<DeviceOverview> {
  const devices = await listDevices();
  return {
    total: devices.length,
    online: devices.filter((d) => d.status === "online").length,
    offline: devices.filter((d) => d.status === "offline").length,
    lowBattery: devices.filter((d) => d.battery != null && d.battery < 20).length,
  };
}

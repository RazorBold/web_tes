import { query } from "@/lib/db";
import type { FleetVehicle, FleetOverview } from "@/types/fleet";

interface FleetVehicleRow {
  id: string;
  plate: string;
  type: string;
  status: string;
  ignition: number;
  fuel: number | null;
  driver_name: string | null;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  distance_today_km: number;
  hours_active_today: number;
  updated_at: Date;
}

function mapVehicle(r: FleetVehicleRow): FleetVehicle {
  return {
    id: r.id,
    plate: r.plate,
    type: r.type,
    status: r.status as FleetVehicle["status"],
    ignition: Boolean(r.ignition),
    fuel: r.fuel,
    driverName: r.driver_name,
    position: { lat: r.lat, lng: r.lng, speed: r.speed, heading: r.heading },
    distanceTodayKm: r.distance_today_km,
    hoursActiveToday: r.hours_active_today,
    updatedAt: r.updated_at.toISOString(),
  };
}

export async function listFleetVehicles(): Promise<FleetVehicle[]> {
  const rows = await query<FleetVehicleRow>("SELECT * FROM fleet_vehicles ORDER BY updated_at DESC");
  return rows.map(mapVehicle);
}

export async function getFleetVehicle(id: string): Promise<FleetVehicle | null> {
  const rows = await query<FleetVehicleRow>("SELECT * FROM fleet_vehicles WHERE id = ?", [id]);
  return rows[0] ? mapVehicle(rows[0]) : null;
}

export async function getFleetOverview(): Promise<FleetOverview> {
  const vehicles = await listFleetVehicles();
  return {
    total: vehicles.length,
    moving: vehicles.filter((v) => v.status === "moving").length,
    idle: vehicles.filter((v) => v.status === "idle").length,
    maintenance: vehicles.filter((v) => v.status === "maintenance").length,
    totalDistanceTodayKm: Math.round(vehicles.reduce((s, v) => s + v.distanceTodayKm, 0) * 10) / 10,
    totalHoursActiveToday: Math.round(vehicles.reduce((s, v) => s + v.hoursActiveToday, 0) * 10) / 10,
  };
}

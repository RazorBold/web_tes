"use client";

import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for leaflet default marker icon assets
const defaultIcon = L.icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Custom SVG divIcon for colored vehicle status markers with embedded icons
const createVehicleIcon = (status: "transit" | "idle" | "maint", name: string) => {
  const color =
    status === "transit"
      ? "#22C55E" // green
      : status === "idle"
      ? "#F97316" // orange
      : "#EF4444"; // red

  const isTruck = name.toLowerCase().includes("truck") || name.toLowerCase().includes("fuso") || name.toLowerCase().includes("hilux");

  const svgIcon = isTruck
    ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: 11px; height: 11px;"><path d="M14 18H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h11l3 4v6a2 2 0 0 1-2 2z"/><circle cx="7.5" cy="18.5" r="2.5"/><circle cx="16.5" cy="18.5" r="2.5"/></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: 11px; height: 11px;"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>`;

  return L.divIcon({
    html: `
      <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
        <span style="position: absolute; width: 100%; height: 100%; background-color: ${color}; opacity: 0.25; border-radius: 50%; animation: ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
        <div style="width: 22px; height: 22px; background-color: ${color}; border: 2px solid white; border-radius: 50%; box-shadow: 0 3px 6px rgba(0,0,0,0.25); z-index: 5; display: flex; align-items: center; justify-content: center;">
          ${svgIcon}
        </div>
      </div>
    `,
    className: "custom-leaflet-marker",
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
};

interface VehicleMarker {
  id: string;
  name: string;
  plate: string;
  coords: [number, number];
  status: "transit" | "idle" | "maint";
  speed: number;
}

const mockVehicles: VehicleMarker[] = [
  { id: "1", name: "Daihatsu Sigra", plate: "B 1234 SKA", coords: [-6.2088, 106.8456], status: "transit", speed: 54 },
  { id: "2", name: "Hyundai Ioniq 5", plate: "B 9876 DPT", coords: [-6.2388, 106.8856], status: "transit", speed: 62 },
  { id: "3", name: "Toyota Hilux", plate: "B 5432 LPT", coords: [-6.1754, 106.8272], status: "idle", speed: 0 },
  { id: "4", name: "Mitsubishi Fuso", plate: "B 6655 KKK", coords: [-6.2588, 106.8056], status: "maint", speed: 0 },
  { id: "5", name: "Honda HR-V", plate: "B 8821 PPK", coords: [-6.1834, 106.8312], status: "transit", speed: 48 },
  { id: "6", name: "Suzuki Carry", plate: "B 7731 WQA", coords: [-6.2241, 106.8122], status: "idle", speed: 0 },
  { id: "7", name: "Toyota Avanza", plate: "B 2291 TTT", coords: [-6.2418, 106.7998], status: "transit", speed: 38 },
  { id: "8", name: "Hino Ranger", plate: "B 9081 FFA", coords: [-6.1554, 106.8612], status: "idle", speed: 0 },
  { id: "9", name: "Wuling Air EV", plate: "B 3341 XYZ", coords: [-6.1254, 106.8422], status: "idle", speed: 0 },
  { id: "10", name: "Isuzu Elf", plate: "B 4412 RTY", coords: [-6.2754, 106.8356], status: "maint", speed: 0 },
];

const routes = {
  route1: [
    [-6.2088, 106.8456] as [number, number],
    [-6.2188, 106.8356] as [number, number],
    [-6.2288, 106.8256] as [number, number],
    [-6.2388, 106.8056] as [number, number],
  ],
  route2: [
    [-6.1754, 106.8272] as [number, number],
    [-6.1854, 106.8572] as [number, number],
    [-6.1954, 106.8772] as [number, number],
    [-6.2388, 106.8856] as [number, number],
  ],
};

export default function BaseMap() {
  return (
    <MapContainer
      center={[-6.2088, 106.8456]}
      zoom={12}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {/* Route paths */}
      <Polyline positions={routes.route1} color="#DC2626" weight={3} opacity={0.8} />
      <Polyline positions={routes.route2} color="#94A3B8" weight={3} opacity={0.8} />

      {/* Vehicle Markers */}
      {mockVehicles.map((vehicle) => (
        <Marker
          key={vehicle.id}
          position={vehicle.coords}
          icon={createVehicleIcon(vehicle.status, vehicle.name)}
        >
          <Popup>
            <div className="p-1 leading-tight text-slate-800">
              <h5 className="font-bold text-xs">{vehicle.name}</h5>
              <span className="text-[10px] text-slate-400 font-bold block mt-0.5">{vehicle.plate}</span>
              <span className="text-[10px] text-slate-500 font-semibold uppercase block mt-1.5">
                Status: {vehicle.status}
              </span>
              {vehicle.speed > 0 && (
                <span className="text-[10px] font-bold text-slate-700 block mt-1">
                  Speed: {vehicle.speed} km/h
                </span>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

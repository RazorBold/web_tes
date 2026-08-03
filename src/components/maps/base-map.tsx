"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export type MapVehicleStatus = "transit" | "idle" | "maint";

export interface MapVehicle {
  id: string;
  name: string;
  plate: string;
  coords: [number, number];
  status: MapVehicleStatus;
  speed: number;
  driver?: string | null;
}

interface BaseMapProps {
  /** Live vehicles to plot. Falls back to the demo set when omitted. */
  vehicles?: MapVehicle[];
  /** Vehicle to centre on and highlight (e.g. the row hovered in a list). */
  focusId?: string | null;
  /**
   * Preview mode: no zoom control, no panning, no pointer events — the map is a
   * thumbnail inside a clickable card, so every click belongs to the card.
   */
  compact?: boolean;
}

/**
 * Leaflet measures its container size once at mount. When BaseMap sits inside a
 * flex/grid layout whose height is only resolved after mount (or changes later,
 * e.g. a card getting taller/narrower as sibling cards show/hide), the map is
 * left stuck at a stale/incorrect size — this keeps it in sync.
 */
function MapResizeHandler() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();

    // Recompute now, on the next frame, and shortly after — the container's
    // final size in a flex/grid card isn't always known on the first tick, so a
    // single invalidateSize() can leave gray/half-loaded tiles.
    const recompute = () => map.invalidateSize({ animate: false });
    recompute();
    const raf = requestAnimationFrame(recompute);
    const t1 = setTimeout(recompute, 200);
    const t2 = setTimeout(recompute, 600);

    // Keep it in sync whenever the card is resized (e.g. sibling cards toggled).
    const observer = new ResizeObserver(recompute);
    observer.observe(container);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t1);
      clearTimeout(t2);
      observer.disconnect();
    };
  }, [map]);

  return null;
}

/** Frames every vehicle on mount and whenever the fleet's positions change. */
function FitToVehicles({ vehicles }: { vehicles: MapVehicle[] }) {
  const map = useMap();
  const key = vehicles.map((v) => `${v.id}:${v.coords[0]},${v.coords[1]}`).join("|");

  useEffect(() => {
    if (!vehicles.length) return;
    const bounds = L.latLngBounds(vehicles.map((v) => v.coords));
    map.fitBounds(bounds, { padding: [34, 34], maxZoom: 13, animate: false });
    // `key` stands in for the positions themselves — refit only when they move.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key]);

  return null;
}

/** Flies to the highlighted vehicle and opens its popup. */
function FocusVehicle({
  vehicles,
  focusId,
  markerRefs,
}: {
  vehicles: MapVehicle[];
  focusId?: string | null;
  markerRefs: React.RefObject<Record<string, L.Marker | null>>;
}) {
  const map = useMap();

  useEffect(() => {
    if (!focusId) return;
    const vehicle = vehicles.find((v) => v.id === focusId);
    if (!vehicle) return;
    map.flyTo(vehicle.coords, Math.max(map.getZoom(), 14), { duration: 0.6 });
    markerRefs.current?.[focusId]?.openPopup();
  }, [map, focusId, vehicles, markerRefs]);

  return null;
}

const STATUS_COLOR: Record<MapVehicleStatus, string> = {
  transit: "#22C55E", // green
  idle: "#F97316", // orange
  maint: "#EF4444", // red
};

// Custom SVG divIcon for colored vehicle status markers with embedded icons
const createVehicleIcon = (status: MapVehicleStatus, name: string, focused = false) => {
  const color = STATUS_COLOR[status];

  const isTruck =
    name.toLowerCase().includes("truck") ||
    name.toLowerCase().includes("fuso") ||
    name.toLowerCase().includes("hilux") ||
    name.toLowerCase().includes("van") ||
    name.toLowerCase().includes("elf") ||
    name.toLowerCase().includes("ranger");

  const iconSize = focused ? 13 : 11;
  const svgIcon = isTruck
    ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: ${iconSize}px; height: ${iconSize}px;"><path d="M14 18H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h11l3 4v6a2 2 0 0 1-2 2z"/><circle cx="7.5" cy="18.5" r="2.5"/><circle cx="16.5" cy="18.5" r="2.5"/></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: ${iconSize}px; height: ${iconSize}px;"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>`;

  const dot = focused ? 28 : 22;
  const box = focused ? 42 : 34;

  return L.divIcon({
    html: `
      <div style="position: relative; width: ${box}px; height: ${box}px; display: flex; align-items: center; justify-content: center;">
        <span style="position: absolute; width: 100%; height: 100%; background-color: ${color}; opacity: 0.25; border-radius: 50%; animation: vehicle-ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
        <div style="width: ${dot}px; height: ${dot}px; background-color: ${color}; border: ${
          focused ? 3 : 2
        }px solid white; border-radius: 50%; box-shadow: 0 3px 8px rgba(15,23,42,0.3); z-index: 5; display: flex; align-items: center; justify-content: center;">
          ${svgIcon}
        </div>
      </div>
    `,
    className: "custom-leaflet-marker",
    iconSize: [box, box],
    iconAnchor: [box / 2, box / 2],
  });
};

const mockVehicles: MapVehicle[] = [
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

const statusText: Record<MapVehicleStatus, string> = {
  transit: "Berjalan",
  idle: "Idle",
  maint: "Perawatan",
};

export default function BaseMap({ vehicles, focusId, compact = false }: BaseMapProps) {
  const markerRefs = useRef<Record<string, L.Marker | null>>({});

  // Live vehicles when supplied; the demo set keeps the map populated otherwise.
  const points = useMemo(
    () => (vehicles && vehicles.length ? vehicles : mockVehicles),
    [vehicles]
  );
  const isLive = Boolean(vehicles && vehicles.length);

  return (
    <MapContainer
      center={[-6.2088, 106.8456]}
      zoom={12}
      scrollWheelZoom={false}
      zoomControl={!compact}
      dragging={!compact}
      doubleClickZoom={!compact}
      touchZoom={!compact}
      keyboard={!compact}
      attributionControl={!compact}
      className={`map-soft ${compact ? "map-static" : ""}`}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapResizeHandler />
      <FitToVehicles vehicles={points} />
      {/* In compact mode the marker simply grows — flying would drift the
          thumbnail away from the framing set by FitToVehicles. */}
      {!compact && <FocusVehicle vehicles={points} focusId={focusId} markerRefs={markerRefs} />}

      {/* Illustrative route paths — only alongside the demo fleet */}
      {!isLive && (
        <>
          <Polyline positions={routes.route1} color="#DC2626" weight={3} opacity={0.8} />
          <Polyline positions={routes.route2} color="#94A3B8" weight={3} opacity={0.8} />
        </>
      )}

      {/* Vehicle Markers */}
      {points.map((vehicle) => {
        const focused = vehicle.id === focusId;
        return (
          <Marker
            key={`${vehicle.id}${focused ? "-focused" : ""}`}
            position={vehicle.coords}
            icon={createVehicleIcon(vehicle.status, vehicle.name, focused)}
            zIndexOffset={focused ? 1000 : 0}
            ref={(instance) => {
              markerRefs.current[vehicle.id] = instance;
            }}
          >
            <Popup>
              <div className="p-1 leading-tight text-slate-800">
                <h5 className="font-bold text-xs">{vehicle.name}</h5>
                <span className="text-[12px] text-slate-400 font-bold block mt-0.5">{vehicle.plate}</span>
                <span className="text-[12px] font-semibold block mt-1.5" style={{ color: STATUS_COLOR[vehicle.status] }}>
                  ● {statusText[vehicle.status]}
                </span>
                {vehicle.driver && (
                  <span className="text-[12px] text-slate-500 block mt-1">Sopir: {vehicle.driver}</span>
                )}
                {vehicle.speed > 0 && (
                  <span className="text-[12px] font-bold text-slate-700 block mt-1">
                    Kecepatan: {vehicle.speed} km/h
                  </span>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}

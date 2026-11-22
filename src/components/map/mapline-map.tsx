'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import { STATIONS, LINES, STATION_INDEX, LINE_INDEX, getLineById, getStationById } from '@/lib/railway-data';
import { buildRailwayNetwork, type RailwayNetwork, computeLineCorridors, type CorridorConfig } from '@/features/railway/railway-graph';
import { formatTimeWIB } from '@/lib/railway-data';
import type { RailwayStation, RailwayLine, LatLng } from '@/types/railway';

// Leaflet CSS (required)
import 'leaflet/dist/leaflet.css';

// Fix default icon issues
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Map centers (Fallback for when stations are loaded)
const DEFAULT_CENTER: [number, number] = [-6.215, 106.825];
const DEFAULT_ZOOM = 12;

// ============================================================
// Types
// ============================================================

export interface MapViewProps {
  /** Initial center [lat, lon]. */
  initialCenter?: [number, number];
  /** Initial zoom. */
  initialZoom?: number;
  /** Stations to highlight / show active. */
  activeStationIds?: string[];
  /** Lines to highlight / show active. */
  activeLineIds?: string[];
  /** Train positions from the simulation (server-provided). */
  trainPositions?: { ka: string; pos: number[]; lineId: string }[];
  /** Callbacks. */
  onStationSelect?: (stationId: string) => void;
  onLineSelect?: (lineId: string) => void;
  onTrainSelect?: (ka: string) => void;
  /** Whether the map is loading. */
  loading?: boolean;
}

// ============================================================
// Helper: convert station coords [lat, lon] to [lat, lon] for Leaflet
// ============================================================

const stationToLatLng = (station: RailwayStation): [number, number] => {
  return [station.coords[0], station.coords[1]];
};

// ============================================================
// Marker icon factory
// ============================================================

export function StationMarkerIcon({ size = 'sm' }: { size?: 'sm' | 'lg' }) {
  const isLg = size === 'lg';
  const iconSize: [number, number] = isLg ? [32, 32] : [24, 24];
  const iconAnchor: [number, number] = isLg ? [16, 16] : [12, 12];
  return L.divIcon({
    className: 'station-marker',
    iconSize,
    iconAnchor,
    html: `
      <div style="
        width: ${size === 'lg' ? '32px' : '24px'};
        height: ${size === 'lg' ? '32px' : '24px'};
        border-radius: 50%;
        background: #0a84ff;
        border: 2px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.35);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: ${size === 'lg' ? '14px' : '11px'};
        font-weight: 700;
      ">
        📍
      </div>
    `,
  });
}

// ============================================================
// Main Map Component
// ============================================================

export default function MaplineMap({
  initialCenter = DEFAULT_CENTER,
  initialZoom = DEFAULT_ZOOM,
  activeStationIds = [],
  activeLineIds = [],
  trainPositions = [],
  onStationSelect,
  onLineSelect,
  onTrainSelect,
  loading = false,
}: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null);
  const [network, setNetwork] = useState<ReturnType<typeof buildRailwayNetwork> | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Build the railway network on mount.
  useEffect(() => {
    const net = buildRailwayNetwork();
    setNetwork(net);
  }, []);

  // Rebuild network when stations/lines change (shouldn't be needed, but safe).
  // Compute corridor polylines for a line.
  const computeLineCorridors = (line: RailwayLine, n: RailwayNetwork, cfg: CorridorConfig = {}) => {
    return computeLineCorridors(line, n, cfg);
  };

  // Build the polylines to render.
  const renderPolylines = useCallback(() => {
    if (!network) return [];

    const polylines = [];
    const seen = new Set<string>();

    // Railway lines.
    for (const line of LINES) {
      if (activeLineIds.length > 0 && !activeLineIds.includes(line.id)) continue;
      const corridors = computeLineCorridors(line, network);
      const corridorList = corridors as LatLng[][];
      for (let ci = 0; ci < corridorList.length; ci++) {
        const corridor = corridorList[ci];
        if (!corridor || corridor.length < 2) continue;
        // Deduplicate consecutive points (leaflet doesn't like duplicated latlngs)
        const deduped: [number, number][] = [];
        for (let pi = 0; pi < corridor.length; pi++) {
          const p = corridor[pi];
          if (!p) continue;
          if (deduped.length === 0 || deduped[deduped.length - 1]![0] !== p[0] || deduped[deduped.length - 1]![1] !== p[1]) {
            deduped.push(p);
          }
        }
        if (deduped.length < 2) continue;
        polylines.push(
          <Polyline
            key={line.id}
            positions={deduped}
            color={line.color}
            weight={4}
            opacity={0.7}
            fillColor={line.color}
            fillOpacity={0.08}
            className="railway-line"
          />
        );
      }
    }

    // Railway corridors (parallel tracks).
    for (const line of LINES) {
      if (activeLineIds.length > 0 && !activeLineIds.includes(line.id)) continue;
      const corridors = computeLineCorridors(line, network);
      const corridorList = corridors as LatLng[][];
      for (let ci = 0; ci < corridorList.length; ci++) {
        const corridor = corridorList[ci];
        if (!corridor || corridor.length < 2) continue;
        const deduped: [number, number][] = [];
        for (let pi = 0; pi < corridor.length; pi++) {
          const p = corridor[pi];
          if (!p) continue;
          if (deduped.length === 0 || deduped[deduped.length - 1]![0] !== p[0] || deduped[deduped.length - 1]![1] !== p[1]) {
            deduped.push(p);
          }
        }
        if (deduped.length < 2) continue;
        polylines.push(
          <Polyline
            key={`${line.id}-corridor`}
            positions={deduped}
            color={line.color}
            weight={2}
            opacity={0.35}
            fillColor={line.color}
            fillOpacity={0.04}
          />
        );
      }
    }

    return polylines;
  }, [network, activeLineIds]);

  // Render stations.
  const renderStations = useCallback(() => {
    return STATIONS.map((station) => {
      const isActive = activeStationIds.includes(station.id);
      return (
        <Marker
          key={station.id}
          position={stationToLatLng(station)}
          icon={StationMarkerIcon({ size: isActive ? 'lg' : 'sm' })}
          eventHandlers={{
            click: () => {
              onStationSelect?.(station.id);
            },
          }}
        >
          <Popup>
            <div style={{ minWidth: '180px' }}>
              <div style={{ fontWeight: 700, color: '#0c4a6e' }}>{station.name}</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                {station.id} · {station.region}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                {station.interchange ? '🔄 Interchange' : ''}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                Lines: {station.lines.map((l) => getLineById(l)?.shortName ?? l).join(', ')}
              </div>
            </div>
          </Popup>
        </Marker>
      );
    });
  }, [activeStationIds, onStationSelect]);

  // Render train positions (from simulation).
  const renderTrains = useCallback(() => {
    return (trainPositions ?? []).map((train) => {
      const line = getLineById(train.lineId);
      const color = line?.color ?? '#0a84ff';
      const lat = train.pos[0];
      const lon = train.pos[1];
      if (lat === undefined || lon === undefined) return null;
      return (
        <Marker
          key={train.ka}
          position={[lat, lon]}
          icon={L.divIcon({
            className: 'train-marker',
            iconSize: [32, 18],
            iconAnchor: [16, 9],
            html: `
              <div style="
                background: ${color};
                width: 32px;
                height: 18px;
                border-radius: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 11px;
                font-weight: 700;
                box-shadow: 0 0 0 2px rgba(0,0,0,0.4);
              ">
                🚄 ${train.ka}
              </div>
            `,
          })}
          eventHandlers={{
            click: () => {
              onTrainSelect?.(train.ka);
            },
          }}
        >
          <Popup>
            <div style={{ minWidth: '180px' }}>
              <div style={{ fontWeight: 700 }}>Train {train.ka}</div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                On line {line?.name ?? train.lineId}
              </div>
            </div>
          </Popup>
        </Marker>
      );
    });
  }, [trainPositions, onTrainSelect]);

  // Pan to a specific station.
  const focusToStation = useCallback((stationId: string) => {
    const station = STATION_INDEX.byId.get(stationId);
    if (!station || !mapRef.current) return;
    mapRef.current.setView(stationToLatLng(station), initialZoom);
  }, [initialZoom]);

  return (
    <div className="w-full h-full">
      <MapContainer
        center={initialCenter}
        zoom={initialZoom}
        className="h-full w-full"
        zoomControl={true}
        attributionControl={true}
        ref={mapRef}
        whenReady={() => setMapLoaded(true)}
      >
        {/* Basemap tiles - OpenStreetMap (light) */}
        <TileLayer
          attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
          opacity={0.6}
        />
        {/* Railway network overlay (drawn first so it's below stations) */}
        {renderPolylines()}
        {/* Train positions (drawn above corridors) */}
        {renderTrains()}
        {/* Station markers */}
        {renderStations()}
      </MapContainer>

      {/* Loading state */}
      {loading && !mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-slate-900/80 z-10">
          <div className="flex items-center gap-3 text-slate-500">
            <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
            <span>Loading railway data...</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Hook: useMapController
// ============================================================

export function useMapController() {
  // This hook provides map controller functions for parent components.
  return {
    focusToStation: (stationId: string) => {},
  };
}

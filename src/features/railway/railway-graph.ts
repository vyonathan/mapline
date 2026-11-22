import { STATIONS, LINES } from '@/lib/railway-data';
import type { RailwayLine, LatLng } from '@/types/railway';

/**
 * Railway graph engine.
 *
 * The railway geometry logic lives here, completely separate from the map
 * presentation layer.  It builds a graph whose nodes are physical rail track
 * positions, using the version-controlled station and line datasets.
 */

// RailwayEdge is the type used in the adjacency list.
export interface RailEdge {
  to: string;
  lineId: string;
  /** Distance in degrees (lat/lon) between the two stations. */
  cost: number;
}

export interface GraphNode {
  key: string;
  coords: LatLng; // [lat, lon]
  /** Physical rail track node (true node) vs station-implanted node. */
  isStation: boolean;
  /** Associated station id, if any. */
  stationId: string | null;
}

export interface GraphBuildOptions {
  /** OSM rail geometry (array of polylines, each a list of [lon, lat]). */
  osmWays?: LatLng[][];
  /** If true, don't throw when OSM data is absent; return only the schematic graph. */
  tolerant?: boolean;
}

export interface RailwayNetwork {
  /** The adjacency list. Node key -> edges. */
  adj: Map<string, RailEdge[]>;
  /** Node key -> physical coords. */
  coords: Map<string, LatLng>;
  /** Station id -> node key. */
  stationNodes: Map<string, string>;
  /** Line id -> list of station ids in sequence. */
  lineSequences: Map<string, string[]>;
  /** Line id -> rail corridor polylines (for rendering). */
  corridors: Map<string, LatLng[][]>;
  /** Station id -> projection point on the nearest physical track. */
  stationProjections: Map<string, LatLng>;
}

// ---------------------------------------------------------------------------
// Graph construction
// ---------------------------------------------------------------------------

function weldKey(lon: number, lat: number): string {
  return `${lon.toFixed(5)},${lat.toFixed(5)}`;
}

function ensureNode(
  adj: Map<string, { to: string; cost: number; lineId: string }[]>,
  coords: Map<string, LatLng>,
  key: string,
  coordsValue: LatLng,
): string {
  if (!adj.has(key)) {
    adj.set(key, []);
    coords.set(key, coordsValue);
  }
  return key;
}


function stationById(id: string): typeof STATIONS[number] | undefined {
  return STATIONS.find((s) => s.id === id);
}


/**
 * Build a railway graph from the local dataset plus optional OSM geometry.
 *
 * Stations are welded onto the nearest OSM track segment when the segment
 * is within tolerance.  Otherwise the station's own coordinates become the node.
 */
export function buildRailwayNetwork(): RailwayNetwork {
  const adj = new Map<string, RailEdge[]>();
  const coords = new Map<string, LatLng>();
  const stationNodes = new Map<string, string>();
  const lineSequences = new Map<string, string[]>();
  const corridors = new Map<string, LatLng[][]>();
  const stationProjections = new Map<string, LatLng>();

  // 1. Register every station as a node.
  for (const st of STATIONS) {
    const nodeKey = `station:${st.id}`;
    stationNodes.set(st.id, nodeKey);
    stationProjections.set(st.id, st.coords);
    coords.set(nodeKey, st.coords);
    adj.set(nodeKey, []);
  }

  // 2. Add edges per line sequence.
  for (const line of LINES) {
    for (let seqIdx = 0; seqIdx < line.sequences.length; seqIdx++) {
      const sequence = line.sequences[seqIdx];
      if (!sequence || sequence.length < 2) continue;

      const seqIds: string[] = sequence.filter((id): id is string => typeof id === 'string' && id.length > 0);

      // Record the station sequence for this line.
      if (!lineSequences.has(line.id) || lineSequences.get(line.id)!.length < seqIds.length) {
        lineSequences.set(line.id, seqIds);
      }

      // Build the corridor polyline for this sequence.
      const corridor: LatLng[] = [];
      for (let i = 0; i < seqIds.length - 1; i++) {
        const a = stationById(seqIds[i]!);
        const b = stationById(seqIds[i + 1]!);
        if (a && b) {
          corridor.push([a.coords[0], a.coords[1]]);
          corridor.push([b.coords[0], b.coords[1]]);
        }
      }
      if (corridor.length > 0) { corridors.set(line.id, [...(corridors.get(line.id) ?? []), corridor]); }

      // Add graph edges between consecutive stations of this line.
      for (let i = 0; i < seqIds.length - 1; i++) {
        const u = `station:${seqIds[i]!}`;
        const v = `station:${seqIds[i + 1]!}`;
        const sa = stationById(seqIds[i]!);
        const sb = stationById(seqIds[i + 1]!);
        const cost = sa && sb ? Math.hypot(sa.coords[1] - sb.coords[1], sa.coords[0] - sb.coords[0]) : 1;

        (adj.get(u) ?? []).push({ to: v, lineId: line.id, cost });
        (adj.get(v) ?? []).push({ to: u, lineId: line.id, cost });
      }
    }
  }

  // Build the lineSequences map from the dataset (source of truth).
  for (const line of LINES) {
    for (const seq of line.sequences) {
      const seqIds = seq.filter((id): id is string => typeof id === 'string' && id.length > 0);
      if (seqIds.length >= 2) {
        if (!lineSequences.has(line.id) || lineSequences.get(line.id)!.length < seqIds.length) {
          lineSequences.set(line.id, seqIds);
        }
      }
    }
  }

  return {
    adj,
    coords,
    stationNodes,
    lineSequences,
    corridors,
    stationProjections,
  };
}

// ---------------------------------------------------------------------------
// Graph queries
// ---------------------------------------------------------------------------

export function getStationNode(network: RailwayNetwork, stationId: string): string | null {
  return network.stationNodes.get(stationId) ?? null;
}

export function getStationCoords(network: RailwayNetwork, stationId: string): LatLng | null {
  const node = network.stationNodes.get(stationId);
  if (!node) return null;
  return network.coords.get(node) ?? null;
}

export function getNearestStation(network: RailwayNetwork, lat: number, lon: number): string | null {
  let bestId: string | null = null;
  let bestDist = Infinity;
  for (const [id, node] of network.coords.entries()) {
    if (network.stationNodes.has(id)) {
      const d = Math.hypot(lat - node[0], lon - node[1]);
      if (d < bestDist) {
        bestDist = d;
        bestId = id;
      }
    }
  }
  return bestId;
}

// ---------------------------------------------------------------------------
// Railway rendering: corridor sequences with parallel offsets.
// ---------------------------------------------------------------------------

export interface CorridorConfig {
  /** Per-line corridor offsets (meters, sign convention: positive = one side). */
  offsets?: number[];
  /** Base width of the corridor (meters). */
  width?: number;
}

/**
 * Compute rendered track polylines for a railway line.
 *
 * The railway rendering engine draws two parallel corridors + centre line.
 * This keeps geometry calculation separate from leaflet marker/polyline drawing.
 */
export function computeLineCorridors(
  line: RailwayLine,
  network: RailwayNetwork,
  config: CorridorConfig = {},
): LatLng[][] {
  const { offsets = [], width = 60 } = config;
  const seq = line.sequences[0];
  if (!seq || seq.length < 2) return [];

  const rendered: LatLng[][] = [];
  const offsetMagnitude = width / 2;

  // We render one corridor per sequence of the line.
  for (let seqIdx = 0; seqIdx < line.sequences.length; seqIdx++) {
    const sequence = line.sequences[seqIdx];
    if (!sequence || sequence.length < 2) continue;

    // For each sequence we emit a centred baseline + two offset copies.
    const baseline: LatLng[] = [];
    const offsetA: LatLng[] = [];
    const offsetB: LatLng[] = [];

    // Determine offset direction from the previous OSM geometry (if any).
    // Without OSM, use a plain coordinate-space approach: offset perpendicular
    // to the average direction of the corridor.
    const segs: { a: LatLng; b: LatLng }[] = [];
    for (let i = 0; i < sequence.length - 1; i++) {
      const a = network.coords.get(`station:${sequence[i]}`);
      const b = network.coords.get(`station:${sequence[i + 1]}`);
      if (a && b) {
        segs.push({ a, b });
      }
    }
    if (segs.length === 0) continue;

    // Compute an average direction for offset rotation.
    let avgDx = 0;
    let avgDy = 0;
    for (const s of segs) {
      avgDx += s.b[1] - s.a[1];
      avgDy += s.b[0] - s.a[0];
    }
    const n = segs.length;
    avgDx /= n;
    avgDy /= n;
    const len = Math.hypot(avgDx, avgDy);
    const ux = len > 1e-9 ? avgDx / len : 1;
    const uy = len > 1e-9 ? avgDy / len : 0;
    // Perpendicular.
    const px = -uy;
    const py = ux;

    for (const s of segs) {
      const [lat, lon] = s.a;
      const [lat2, lon2] = s.b;
      baseline.push([lat, lon]);
      baseline.push([lat2, lon2]);
      offsetA.push([lat + px * offsetMagnitude, lon + py * offsetMagnitude]);
      offsetA.push([lat2 + px * offsetMagnitude, lon2 + py * offsetMagnitude]);
      offsetB.push([lat - px * offsetMagnitude, lon - py * offsetMagnitude]);
      offsetB.push([lat2 - px * offsetMagnitude, lon2 - py * offsetMagnitude]);
    }
    rendered.push(baseline, offsetA, offsetB);
  }

  return rendered;
}

// ---------------------------------------------------------------------------
// Train path interpolation (shared between simulation and rendering)
// ---------------------------------------------------------------------------

/**
 * Interpolate a position along a polyline at a given fraction.
 * Used by the simulation engine to place train markers.
 */
export function interpolateAlongPath(points: LatLng[], fraction: number): LatLng {
  if (!points || points.length === 0) return [0, 0];
  if (points.length === 1 || fraction <= 0) return points[0]!;
  if (fraction >= 1) return points[points.length - 1]!;

  let totalLen = 0;
  const segLens: number[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i]!;
    const p1 = points[i + 1]!;
    const d = Math.hypot(p1[1] - p0[1], p1[0] - p0[0]);
    segLens.push(d);
    totalLen += d;
  }
  if (totalLen === 0) return points[0]!;

  let target = fraction * totalLen;
  for (let i = 0; i < segLens.length; i++) {
    if (target <= segLens[i]! || i === segLens.length - 1) {
      const t = segLens[i]! > 0 ? target / segLens[i]! : 0;
      const pi = points[i]!;
      const pi1 = points[i + 1]!;
      return [
        pi[0]! + (pi1[0]! - pi[0]!)*t,
        pi[1]! + (pi1[1]! - pi[1]!)*t,
      ];
    }
    target -= segLens[i]!;
  }
  return points[points.length - 1]!;
}

/**
 * Compute the train position along a given line for a trip at a simulated time.
 * Returns null if the trip is not active at the given time.
 */
export function computeTrainPosition(
  trip: { stops: { stationId: string; time: number }[] },
  network: RailwayNetwork,
  simMinutes: number,
): { pos: LatLng; segment: { aIdx: number; bIdx: number } } | null {
  const stops = trip.stops;
  if (!stops || stops.length < 2) return null;
  const firstTime = stops[0]!.time;
  const lastTime = stops[stops.length - 1]!.time;
  if (simMinutes < firstTime || simMinutes > lastTime) return null;

  let segIdx = 0;
  for (let i = 0; i < stops.length - 1; i++) {
    if (simMinutes >= stops[i]!.time && simMinutes <= stops[i + 1]!.time) {
      segIdx = i;
      break;
    }
  }

  const a = stops[segIdx];
  const b = stops[segIdx + 1];
  if (!a || !b) return null;
  const span = Math.max(0.1, b.time - a.time);
  const frac = Math.max(0, Math.min(1, (simMinutes - a.time) / span));

  const aNode = network.stationNodes.get(a.stationId);
  const bNode = network.stationNodes.get(b.stationId);
  if (!aNode || !bNode) return null;

  const path = [network.coords.get(aNode)!, network.coords.get(bNode)!];
  const pos = interpolateAlongPath(path, frac);

  return { pos, segment: { aIdx: segIdx, bIdx: segIdx + 1 } };
}

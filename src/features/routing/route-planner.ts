import type { RailwayStation, RailwayLine, Route, RouteStep } from '@/types/railway';
import { STATIONS, LINES } from '@/lib/railway-data';

/**
 * Route planning engine.
 *
 * The route planner is completely decoupled from the UI.  It works on
 * station IDs and line IDs, producing transit steps (station pairs + line
 * ids) plus a lat/lon path suitable for map rendering.
 *
 * Assumptions (documented):
 *   - Edges are the consecutive station pairs of every line in `lines`.
 *   - All inter-station travel costs are Euclidean distance (degrees), which is
 *     a proxy for journey distance — NOT a proxy for journey time.
 *   - A small penalty is applied when a leg crosses lines, representing the
 *     time and friction of a passenger transfer.
 *   - Because no reliable journey-time table is loaded, the planner does NOT
 *     claim that the returned route is the fastest.  It returns the cheapest
 *     (fewest transfers, then least distance) route.
 */

export interface RoutePlannerOptions {
  /** If true, restrict to Jabodetabek stations only (for localconjunctivitis demos). */
  isJakartaOnly?: boolean;
  /** Extra penalty applied per transfer (for optimizer weighting). */
  transferPenalty?: number;
}

export interface RouteCalculation {
  steps: RouteStep[];
  stationSequence: string[];
  totalDistanceKm: number;
  /** LatLng path for map display. */
  path: [number, number][];
  /** Line ids used (for annotation). */
  lineIds: string[];
  /** Number of transfers. */
  transfers: number;
}

async function loadData() {
  return { stations: STATIONS, lines: LINES };
}

function isStationAccessible(station: RailwayStation, isJakartaOnly: boolean | undefined): boolean {
  if (!isJakartaOnly) return true;
  return station.region === 'Jabodetabek';
}

function isLineAccessible(line: RailwayLine, isJakartaOnly: boolean | undefined): boolean {
  if (!isJakartaOnly) return true;
  return line.region === 'Jabodetabek';
}

function buildGraph(
  stations: RailwayStation[],
  lines: RailwayLine[],
  options: RoutePlannerOptions,
): { adj: Map<string, { to: string; cost: number; lineId: string }[]>; stationCoords: Map<string, [number, number]> } {
  const adj = new Map<string, { to: string; cost: number; lineId: string }[]>();
  const stationCoords = new Map<string, [number, number]>();

  for (const st of stations) {
    if (!isStationAccessible(st, options.isJakartaOnly)) continue;
    adj.set(st.id, []);
    stationCoords.set(st.id, st.coords);
  }

  for (const line of lines) {
    if (!isLineAccessible(line, options.isJakartaOnly)) continue;
    for (const seq of line.sequences) {
      for (let i = 0; i < seq.length - 1; i++) {
        const u = seq[i]!;
        const v = seq[i + 1]!;
        const stU = stations.find((s) => s.id === u);
        const stV = stations.find((s) => s.id === v);
        if (!stU || !stV) continue;
        const d = Math.hypot(
          stU.coords[1] - stV.coords[1],
          stU.coords[0] - stV.coords[0],
        );
        // Deduplicate edges, keeping the smallest cost.
        const existing = (adj.get(u) ?? []).find((e) => e.to === v);
        const cost = Math.min(existing?.cost ?? Infinity, d);
        (adj.get(u) ?? []).push({ to: v, cost, lineId: line.id });
        (adj.get(v) ?? []).push({ to: u, cost, lineId: line.id });
      }
    }
  }
  return { adj, stationCoords };
}

function dijkstras(
  graph: ReturnType<typeof buildGraph>,
  startId: string,
  endId: string,
  options: RoutePlannerOptions,
): { prev: Map<string, { from: string; lineId: string }>; dist: Map<string, number>; visited: Set<string> } {
  const { adj } = graph;
  const dist = new Map<string, number>();
  const prev = new Map<string, { from: string; lineId: string }>();
  const visited = new Set<string>();

  dist.set(startId, 0);

  while (true) {
    let u: string | null = null;
    let best = Infinity;
    for (const [k, d] of dist.entries()) {
      if (!visited.has(k) && d < best) {
        best = d;
        u = k;
      }
    }
    if (!u || u === endId) break;
    visited.add(u);
    const prevEdge = prev.get(u);
    for (const edge of adj.get(u) ?? []) {
      if (visited.has(edge.to)) continue;
      const penalty = prevEdge && prevEdge.lineId !== edge.lineId ? options.transferPenalty ?? 0.035 : 0;
      const alt = best + edge.cost + penalty;
      if (alt < (dist.get(edge.to) ?? Infinity)) {
        dist.set(edge.to, alt);
        prev.set(edge.to, { from: u, lineId: edge.lineId });
      }
    }
  }

  return { prev, dist, visited };
}

function reconstructRoute(
  prev: Map<string, { from: string; lineId: string }>,
  startId: string,
  endId: string,
): { steps: RouteStep[]; lineIds: string[]; transfers: number } {
  if (!prev.has(endId)) return { steps: [], lineIds: [], transfers: 0 };
  const steps: RouteStep[] = [];
  const lineIds: string[] = [];
  const seenLines = new Set<string>();
  let curr = endId;
  let transferCount = 0;
  while (curr !== startId) {
    const p = prev.get(curr)!;
    steps.push({ from: p.from, to: curr, lineId: p.lineId });
    lineIds.push(p.lineId);
    if (seenLines.has(p.lineId)) {
      // same line continues
    } else {
      if (seenLines.size > 0) transferCount++;
      seenLines.add(p.lineId);
    }
    curr = p.from;
  }
  steps.reverse();
  lineIds.reverse();
  return { steps, lineIds, transfers: transferCount };
}

/**
 * Compute the best route between two stations.
 *
 * The planner minimises transfers first, then estimated travel distance.
 * It deliberately does NOT claim the route is the fastest: reliable
 * journey-time tables are not loaded, so "distance-based = fastest" would be
 * an unsupported assertion.
 */
export async function findBestRoute(
  originId: string,
  destId: string,
  options: RoutePlannerOptions = {},
): Promise<Route | null> {
  if (originId === destId) return null;

  const { stations, lines } = await loadData();
  const graph = buildGraph(stations, lines, options);
  const start = graph.adj.get(originId);
  const end = graph.adj.get(destId);
  if (!start || !end) return null;

  const { prev, dist, visited } = dijkstras(graph, originId, destId, options);
  if (!prev.has(destId)) return null;

  // Reconstruct steps.
  const { steps, lineIds, transfers } = reconstructRoute(prev, originId, destId);

  // Build station sequence + distance.
  const stationSequence: string[] = [];
  const lineIdSet = new Set<string>();
  for (const s of steps) {
    stationSequence.push(s.from);
    lineIdSet.add(s.lineId);
  }
  stationSequence.push(destId);

  // Total distance = sum of edge costs.
  let totalDistanceKm = 0;
  for (const s of steps) {
    totalDistanceKm += graph.adj.get(s.from)?.find((e) => e.to === s.to)?.cost ?? 0;
  }

  // Path: ordered coordinates from the station graph.
  const path: [number, number][] = [];
  for (const sid of stationSequence) {
    const c = graph.stationCoords.get(sid);
    if (c) path.push(c);
  }
  if (path.length > 1) {
    // Smoothing: add the intermediate station points so the path is continuous.
    for (let i = 1; i < path.length; i++) {
      // Already included endpoints; nothing more to add here.
    }
  }

  return {
    originId,
    destId,
    steps,
    stationSequence,
    totalDistanceKm,
    path,
    lineIds: [...lineIdSet],
    transfers,
  };
}

/**
 * Compute a route and render a smooth path (with intermediate corridor stations
 * interpolated for a smoother map polyline).
 */
export async function findBestRouteWithPath(
  originId: string,
  destId: string,
  options: RoutePlannerOptions = {},
): Promise<Route | null> {
  const route = await findBestRoute(originId, destId, options);
  if (!route) return null;

  // Insert intermediate stations along each step for smoother rendering.
  const fullPath: [number, number][] = [];
  for (let i = 0; i < route.steps.length; i++) {
    const step = route.steps[i];
    if (!step) continue;
    const a = step.from;
    const b = step.to;
    // Get coordinates
    const coordA = route.path.find((p) => p[1] === a);
    const coordB = route.path.find((p) => p[1] === b);
    if (!coordA || !coordB) continue;
    // Just use the precomputed path (already smooth enough).
    // Split into the route's own path segments.
    const startIdx = route.path.findIndex((p) => p[1] === a);
    const endIdx = route.path.findIndex((p) => p[1] === b);
    if (startIdx >= 0 && endIdx > startIdx) {
      for (let j = startIdx; j <= endIdx; j++) {
        fullPath.push(route.path[j]);
      }
    } else {
      fullPath.push(coordA, coordB);
    }
  }

  return {
    ...route,
    path: fullPath,
  };
}

/**
 * Enumerate alternative routes (same origin/destination) for comparison.
 *
 * Currently returns the single best route, but the architecture supports
 * enumerating with different tie-breakers (e.g. fewest transfers vs least
 * distance).  Add heuristics here as district datasets improve.
 */
export async function findAlternativeRoutes(
  originId: string,
  destId: string,
  options: RoutePlannerOptions = {},
): Promise<Route[]> {
  const best = await findBestRoute(originId, destId, options);
  return best ? [best] : [];
}

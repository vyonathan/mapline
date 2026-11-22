import type { TimetableTrip, LatLng } from '@/types/railway';
import { STATIONS, LINES, STATION_INDEX, LINE_INDEX, tripsByLine, findTrip } from '@/lib/railway-data';
import { buildRailwayNetwork } from '@/features/railway/railway-graph';

/** Simulation clock state (WIB minutes, wall timestamp, speed multiplier). */
interface SimClock {
  minutes: number;
  wallMs: number;
  speed: number;
}

/** Simulation clock singleton (default: 10:00 WIB, realtime speed). */
let clock: SimClock = {
  minutes: 10 * 60,
  wallMs: Date.now(),
  speed: 1,
};

export function getSimClock(): SimClock {
  return { ...clock };
}

export function setSimClock(minutes: number, wallMs: number, speed: number) {
  clock = { minutes, wallMs, speed };
}

/** WIB (UTC+7) offset in minutes. */
const WIB_OFFSET_MINUTES = 7 * 60;

/** Get current WIB minutes from wall clock. */
export function getLiveWibMinutes(): number {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const wibDate = new Date(utcMs + WIB_OFFSET_MINUTES * 60000);
  return wibDate.getHours() * 60 + wibDate.getMinutes();
}

/** Format WIB minutes to HH:MM (WIB). */
export function formatSimClock(minutes: number): string {
  const total = ((Math.floor(minutes) % 1440) + 1440) % 1440;
  const hh = String(Math.floor(total / 60)).padStart(2, '0');
  const mm = String(total % 60).padStart(2, '0');
  return `${hh}:${mm} WIB`;
}

// ---------------------------------------------------------------------------
// Train position computation
// ---------------------------------------------------------------------------

export interface TrainPosition {
  ka: string;
  lineId: string;
  category: string;
  destination: string;
  routeTitle: string;
  stationSequence: string[];
  pos: LatLng; // [lat, lon]
  stopTime: number; // minutes of the current stop
}

export interface EngineCallbacks {
  /** Called when the user selects a train. */
  onSelectTrain?: (ka: string) => void;
  /** Called when the map layer needs updating. */
  onMapUpdate?: () => void;
}


function getStationIndex() {
  return STATION_INDEX;
}

function getLineIndex() {
  return LINE_INDEX;
}

/**
 * Compute all active train positions at the given simulated time.
 *
 * This is the single source of truth for the simulation.
 */
export async function computeActiveTrainPositions(
  trips: TimetableTrip[],
  simMinutes: number,
): Promise<TrainPosition[]> {
  const network = buildRailwayNetwork();

  const results: TrainPosition[] = [];

  for (const trip of trips) {
    const stops = trip.stops;
    if (!stops || stops.length < 2) continue;
    const firstTime = stops[0]!.time;
    const lastTime = stops[stops.length - 1]!.time;
    if (simMinutes < firstTime || simMinutes > lastTime) continue;

    // Find which segment we're on.
    let segIdx = 0;
    for (let i = 0; i < stops.length - 1; i++) {
      if (simMinutes >= stops[i]!.time && simMinutes <= stops[i + 1]!.time) {
        segIdx = i;
        break;
      }
    }
    const a = stops[segIdx];
    const b = stops[segIdx + 1];
    if (!a || !b) continue;
    const span = Math.max(0.1, b.time - a.time);
    const frac = Math.max(0, Math.min(1, (simMinutes - a.time) / span));

    // Get the rail segment coordinates.
    const aNode = network.stationNodes.get(a.stationId);
    const bNode = network.stationNodes.get(b.stationId);
    if (!aNode || !bNode) continue;

    const aCoords = network.coords.get(aNode);
    const bCoords = network.coords.get(bNode);
    if (!aCoords || !bCoords) continue;

    const pos = interpolateAlongPath([aCoords, bCoords], frac);

    // Build station sequence for display.
    const seq = trip.stops.map((s) => s.stationId);

    results.push({
      ka: trip.ka,
      lineId: trip.lineId,
      category: trip.category,
      destination: trip.destination,
      routeTitle: trip.routeTitle,
      stationSequence: seq,
      pos,
      stopTime: a.time,
    });
  }

  return results;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getSimSpeed(): number {
  return clock.speed;
}

export function setSimSpeed(speed: number) {
  clock.speed = Math.max(0, speed);
}

/** Pause simulation. */
export function pauseSim() {
  clock.speed = 0;
}

/** Resume simulation. */
export function resumeSim() {
  clock.speed = 1;
}

export function stepSim(seconds: number) {
  if (clock.speed === 0) return;
  clock.minutes = (clock.minutes + seconds * clock.speed) % 1440;
  clock.wallMs = Date.now();
}

export function resetSim() {
  clock.minutes = getLiveWibMinutes();
  clock.wallMs = Date.now();
  clock.speed = 1;
}

/** Update the clock from the live wall clock (real-time sync). */
export function syncToLiveClock() {
  const liveWib = getLiveWibMinutes();
  // Don't snap instantly; smooth toward live time.
  const dt = (Date.now() - clock.wallMs) / 1000;
  const step = dt * clock.speed;
  if (step > 0) {
    clock.minutes = (clock.minutes + step) % 1440;
    clock.wallMs = Date.now();
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function interpolateAlongPath(points: LatLng[], fraction: number): LatLng {
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
      return [
        points[i]![0] + (points[i + 1]![0] - points[i]![0]) * t,
        points[i]![1] + (points[i + 1]![1] - points[i]![1]) * t,
      ];
    }
    target -= segLens[i]!;
  }
  return points[points.length - 1]!;
}

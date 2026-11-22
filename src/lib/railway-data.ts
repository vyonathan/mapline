import stationsData from '@/data/railway/stations.json';
import linesData from '@/data/railway/lines.json';
import gapeka2025Data from '@/data/railway/gapeka-2025.json';
import gapeka2026Data from '@/data/railway/gapeka-2026.json';
import type { RailwayStation, RailwayLine, TimetableTrip, TimetableMetadata } from '../types/railway';

/** Railway station dataset (version-controlled source of truth). */
const RAW_STATIONS: unknown[] = stationsData;
export const STATIONS: RailwayStation[] = RAW_STATIONS as RailwayStation[];
/** Railway lines dataset. */
const RAW_LINES: unknown[] = linesData;
export const LINES: RailwayLine[] = RAW_LINES as RailwayLine[];
/** GAPEKA 2025 timetable (synthetic estimate). */
export const GAPEKA_2025: TimetableMetadata = addEstimatedFlag(gapeka2025Data as unknown) as TimetableMetadata;
/** GAPEKA 2026 timetable (synthetic estimate). */
export const GAPEKA_2026: TimetableMetadata = addEstimatedFlag(gapeka2026Data as unknown) as TimetableMetadata;

/** Add isEstimatedSchedule flag to timetable trips (required by type but not in source JSON). */
function addEstimatedFlag(data: unknown): TimetableMetadata {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Invalid timetable data');
  }
  const d = data as Record<string, unknown>;
  const trips = d.trips as unknown[];
  return {
    version: String(d.version),
    authority: String(d.authority),
    scheduleSource: String(d.scheduleSource),
    isSyntheticEstimate: Boolean(d.isSyntheticEstimate),
    disclaimer: String(d.disclaimer),
    trips: trips.map((t) => ({
      ka: String((t as Record<string, unknown>).ka),
      lineId: String((t as Record<string, unknown>).lineId),
      category: String((t as Record<string, unknown>).category),
      relation: String((t as Record<string, unknown>).relation),
      routeTitle: String((t as Record<string, unknown>).routeTitle),
      destination: String((t as Record<string, unknown>).destination),
      stops: (t as Record<string, unknown>).stops != null ? ((t as Record<string, unknown>).stops as unknown[]).map((s: unknown) => ({
        stationId: String((s as Record<string, unknown>).stationId),
        time: Number((s as Record<string, unknown>).time),
      })) : [],
      isEstimatedSchedule: false,
      trainName: undefined,
    })),
  };
}


/** Index lookup for stations. */
export const STATION_INDEX = (() => {
  const byId = new Map<string, RailwayStation>();
  const ids: string[] = [];
  for (const s of STATIONS) {
    byId.set(s.id, s);
    ids.push(s.id);
  }
  return { byId, all: STATIONS, ids };
})();

/** Index lookup for lines. */
export const LINE_INDEX = (() => {
  const byId = new Map<string, RailwayLine>();
  const ids: string[] = [];
  for (const l of LINES) {
    byId.set(l.id, l);
    ids.push(l.id);
  }
  return { byId, all: LINES, ids };
})();

/** Find a station by id. */
export function getStationById(id: string): RailwayStation | undefined {
  return STATION_INDEX.byId.get(id);
}

/** Get all stations. */
export function getAllStations(): RailwayStation[] {
  return STATIONS;
}

/** Find a line by id. */
export function getLineById(id: string): RailwayLine | undefined {
  return LINE_INDEX.byId.get(id);
}

/** Get all lines. */
export function getAllLines(): RailwayLine[] {
  return LINES;
}

// ---------------------------------------------------------------------------
// Timetable helpers (static data)
// ---------------------------------------------------------------------------

export function tripsByLine(trips: TimetableTrip[], lineId: string): TimetableTrip[] {
  return trips.filter((t) => t.lineId === lineId);
}

export function tripsToStation(trips: TimetableTrip[], stationId: string): TimetableTrip[] {
  return trips.filter((t) => t.stops.some((s) => s.stationId === stationId));
}

export function tripsFromStation(trips: TimetableTrip[], stationId: string): TimetableTrip[] {
  return trips.filter((t) => t.stops[0]?.stationId === stationId);
}

export function findTrip(trips: TimetableTrip[], ka: string): TimetableTrip | undefined {
  return trips.find((t) => t.ka === ka);
}

export function findStopIndex(trip: TimetableTrip, stationId: string): number {
  return trip.stops.findIndex((s) => s.stationId === stationId);
}

export function formatTime(minutes: number): string {
  const total = ((Math.floor(minutes) % 1440) + 1440) % 1440;
  const hh = String(Math.floor(total / 60)).padStart(2, '0');
  const mm = String(total % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function formatTimeWIB(minutes: number): string {
  return formatTime(minutes);
}

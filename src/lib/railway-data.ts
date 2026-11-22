import stationsData from '@/data/railway/stations.json';
import linesData from '@/data/railway/lines.json';
import gapeka2025Data from '@/data/railway/gapeka-2025.json';
import gapeka2026Data from '@/data/railway/gapeka-2026.json';
import type { RailwayStation, RailwayLine, TimetableTrip, TimetableMetadata } from '../types/railway';

/** Railway station dataset (version-controlled source of truth). */
export const STATIONS: RailwayStation[] = stationsData;
/** Railway lines dataset. */
export const LINES: RailwayLine[] = linesData;
/** GAPEKA 2025 timetable (synthetic estimate). */
export const GAPEKA_2025: TimetableMetadata = gapeka2025Data;
/** GAPEKA 2026 timetable (synthetic estimate). */
export const GAPEKA_2026: TimetableMetadata = gapeka2026Data;

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

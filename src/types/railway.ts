/**
 * Core domain types for Mapline.
 * Shared across the application: app, API routes, server-only code.
 */

/** A railway station from the version-controlled dataset. */
export interface RailwayStation {
  id: string;
  name: string;
  coords: [number, number]; // [lat, lon]
  region: string;
  interchange: boolean;
  lines: string[]; // line ids
}

/** A railway line from the version-controlled dataset. */
export interface RailwayLine {
  id: string;
  name: string;
  shortName: string;
  category: string;
  color: string;
  region: string;
  operator: string;
  headway: string;
  sequences: string[][]; // array of sequences, each is an array of station ids
}

/** A stop / station entry inside a timetable trip. */
export interface TripStop {
  stationId: string;
  time: number; // minutes from midnight in WIB
}

/** A single timetable trip. */
export interface TimetableTrip {
  ka: string;
  lineId: string;
  category: string;
  relation: string;
  routeTitle: string;
  destination: string;
  trainName?: string;
  isEstimatedSchedule: boolean;
  stops: TripStop[];
}

/** Timetable dataset metadata (preserved exactly from the source JSON). */
export interface TimetableMetadata {
  version: string;
  authority: string;
  scheduleSource: string;
  isSyntheticEstimate: boolean;
  disclaimer: string;
  trips: TimetableTrip[];
}

/** A point on the map (leaflet-compatible). */
export type LatLng = [number, number]; // [lat, lon]

/** Railway graph node key. */
export type GraphNodeKey = string;

/** Railway graph adjacency entry. */
export interface GraphEdge {
  to: GraphNodeKey;
  cost: number;
}

/** Railway graph with adjacency map and coordinate map. */
export interface RailwayGraph {
  adj: Map<GraphNodeKey, GraphEdge[]>;
  coordsMap: Map<GraphNodeKey, LatLng>;
}

/** A single step in a computed route. */
export interface RouteStep {
  from: string;
  to: string;
  lineId: string;
}

/** A computed route. */
export interface Route {
  originId: string;
  destId: string;
  steps: RouteStep[];
  totalDistanceKm: number;
  /** LatLng path for map rendering. */
  path: LatLng[];
  /** Station ids along the route (for display). */
  stationSequence: string[];
  /** Line ids used (for annotation). */
  lineIds: string[];
  /** Number of transfers. */
  transfers: number;
}

/** Saved station record (user-owned). */
export interface SavedStationRecord {
  userId: string;
  stationId: string;
  createdAt: Date;
}

/** Saved line record (user-owned). */
export interface SavedLineRecord {
  userId: string;
  lineId: string;
  createdAt: Date;
}

/** Saved journey record (user-owned). */
export interface SavedJourneyRecord {
  userId: string;
  name: string;
  originId: string;
  destinationId: string;
  route: Route;
  createdAt: Date;
}

/** User preference record (user-owned). */
export interface UserPreferenceRecord {
  userId: string;
  key: string;
  value: string;
  updatedAt: Date;
}

/** Application settings (single-row table). */
export interface SettingsRecord {
  key: string;
  value: string;
  updatedAt: Date;
}

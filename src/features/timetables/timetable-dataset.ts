import type { TimetableTrip, TimetableMetadata } from '@/types/railway';

/**
 * Timetable architecture.
 *
 * The timetable layer is designed so that additional schedule datasets can be
 * added in the future (including genuinely verified official schedules).
 *
 * Design:
 *   - A "schedule version" selector picks which timetable dataset is active.
 *   - All timetable logic works against a version-agnostic `TimetableDataset`.
 *   - Datasets are marked with their source and reliability classification.
 */

export type ScheduleVersion = '2025' | '2026';

export interface ScheduleSource {
  label: string;
  version: ScheduleVersion;
  /** e.g. 'synthetic-estimated-headway' or 'official-kai-djka'. */
  sourceType: string;
  /** Human-readable source attribution. */
  attribution: string;
  /** True when the data is NOT a verified official timetable. */
  isSynthetic: boolean;
}

export interface ScheduleMetadata {
  version: ScheduleVersion;
  authority: string;
  sourceType: string;
  isSynthetic: boolean;
  disclaimer: string;
  trips: TimetableTrip[];
}

export interface TimetableDataset {
  id: ScheduleVersion;
  metadata: ScheduleMetadata;
  trips: TimetableTrip[];
}

// ---------------------------------------------------------------------------
// Re-exported synthetic datasets (loaded from version-controlled files)
// ---------------------------------------------------------------------------

import { GAPEKA_2025, GAPEKA_2026 } from '@/lib/railway-data';

/** All available schedule versions. */
export const AVAILABLE_SCHEDULES: ScheduleSource[] = [
  {
    label: 'GAPEKA 2025 (synthetic estimate)',
    version: '2025',
    sourceType: 'synthetic-estimated-headway',
    attribution: 'PT KAI (Persero) GAPEKA 2025 (DAOP 1–9)',
    isSynthetic: true,
  },
  {
    label: 'GAPEKA 2026 (experimental preview)',
    version: '2026',
    sourceType: 'synthetic-estimated-headway',
    attribution: 'KP-DJKA 116 Tahun 2026 (Experimental Preview)',
    isSynthetic: true,
  },
];

let datasets: Map<ScheduleVersion, TimetableDataset> | null = null;

async function loadDatasets(): Promise<Map<ScheduleVersion, TimetableDataset>> {
  if (datasets) return datasets;
  datasets = new Map<ScheduleVersion, TimetableDataset>();

  const metadata = (d: typeof GAPEKA_2025) => ({
    version: d.version as ScheduleVersion,
    authority: d.authority,
    sourceType: d.scheduleSource,
    isSynthetic: d.isSyntheticEstimate,
    disclaimer: d.disclaimer,
    trips: d.trips,
  });

  datasets.set('2025', {
    id: '2025',
    metadata: metadata(GAPEKA_2025),
    trips: GAPEKA_2025.trips,
  });
  datasets.set('2026', {
    id: '2026',
    metadata: metadata(GAPEKA_2026),
    trips: GAPEKA_2026.trips,
  });

  return datasets;
}

/** Get the active dataset for a version. */
export async function getDataset(version: ScheduleVersion): Promise<TimetableDataset> {
  const map = await loadDatasets();
  const ds = map.get(version);
  if (!ds) throw new Error(`Unknown schedule version: ${version}`);
  return ds;
}

/** Get all available schedule sources (for the version selector). */
export async function getAvailableSchedules(): Promise<ScheduleSource[]> {
  return AVAILABLE_SCHEDULES;
}

/** Get the active version from a dataset id. */
export function getActiveVersion(dataset: TimetableDataset): ScheduleVersion {
  return dataset.id;
}

/** Get the metadata for a dataset (source attribution + reliability). */
export function getDatasetMetadata(dataset: TimetableDataset): ScheduleMetadata {
  return dataset.metadata;
}

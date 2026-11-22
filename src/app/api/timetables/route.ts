import { NextRequest, NextResponse } from 'next/server';
import { STATION_INDEX, LINE_INDEX, STATIONS, LINES } from '@/lib/railway-data';
import {
  AVAILABLE_SCHEDULES,
  getDataset,
  getDatasetMetadata,
} from '@/features/timetables/timetable-dataset';

// GET /api/timetables/versions
export async function GET_VERSIONS(request: NextRequest) {
  try {
    return NextResponse.json({
      data: AVAILABLE_SCHEDULES.map((s) => ({
        version: s.version,
        label: s.label,
        sourceType: s.sourceType,
        attribution: s.attribution,
        isSynthetic: s.isSynthetic,
      })),
    });
  } catch (error) {
    console.error('Failed to get timetable versions:', error);
    return NextResponse.json({ error: 'Failed to retrieve timetable versions' }, { status: 500 });
  }
}

// GET /api/timetables/[version]
export async function GET_DATASET(request: NextRequest) {
  try {
    const version = request.nextUrl.pathname.split('/').pop();
    if (!version) {
      return NextResponse.json({ error: 'Version is required' }, { status: 400 });
    }

    const validVersions = ['2025', '2026'];
    if (!validVersions.includes(version)) {
      return NextResponse.json({ error: 'Invalid version' }, { status: 400 });
    }

    const dataset = await getDataset(version as '2025' | '2026');
    const metadata = getDatasetMetadata(dataset);

    // Only send metadata + count, not the full trips array (client will paginate)
    return NextResponse.json({
      data: {
        version: metadata.version,
        authority: metadata.authority,
        sourceType: metadata.sourceType,
        isSynthetic: metadata.isSynthetic,
        disclaimer: metadata.disclaimer,
        tripCount: metadata.trips.length,
        firstTripKa: metadata.trips[0]?.ka ?? null,
        lastTripKa: metadata.trips[metadata.trips.length - 1]?.ka ?? null,
        sampleTrips: metadata.trips.slice(0, 5),
      },
    });
  } catch (error) {
    console.error('Failed to get timetable:', error);
    return NextResponse.json({ error: 'Failed to retrieve timetable' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getDataset, getDatasetMetadata } from '@/features/timetables/timetable-dataset';

// GET /api/timetables/[version]
export async function GET(request: NextRequest) {
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

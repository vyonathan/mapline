import { NextRequest, NextResponse } from 'next/server';
import { STATIONS } from '@/lib/railway-data';

// GET /api/stations/ids
export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get('q');
    const region = request.nextUrl.searchParams.get('region');

    let stations = STATIONS;

    if (q) {
      const lowerQ = q.toLowerCase();
      stations = stations.filter((s) =>
        s.name.toLowerCase().includes(lowerQ) ||
        s.id.toLowerCase().includes(lowerQ) ||
        s.region.toLowerCase().includes(lowerQ)
      );
    }

    if (region) {
      stations = stations.filter((s) => s.region === region);
    }

    const ids = stations.map((s) => s.id);

    return NextResponse.json({ data: ids });
  } catch (error) {
    console.error('Failed to get station ids:', error);
    return NextResponse.json({ error: 'Failed to get station ids' }, { status: 500 });
  }
}

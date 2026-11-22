import { NextRequest, NextResponse } from 'next/server';
import { STATIONS, STATION_INDEX, getAllStations, getStationById } from '@/lib/railway-data';
import type { RailwayStation } from '@/types/railway';

// Helper: validate query params
function parseSearchParams(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get('q')?.trim() || '';
  const region = searchParams.get('region') || undefined;
  const limit = searchParams.get('limit');
  const offset = searchParams.get('offset');

  return { q, region, limit: limit ? Number(limit) : undefined, offset: offset ? Number(offset) : undefined };
}

// Helper: validate a station id
function validateStationId(id: string): string | null {
  if (!id || typeof id !== 'string') return 'Station id is required';
  if (!STATION_INDEX.byId.has(id)) return 'Station not found';
  return null;
}

// GET /api/stations
export async function GET(request: NextRequest) {
  try {
    const { q, region, limit, offset } = parseSearchParams(request);

    let stations = STATIONS;

    // Filter
    if (region) {
      stations = stations.filter((s) => s.region === region);
    }
    if (q) {
      const lowerQ = q.toLowerCase();
      stations = stations.filter(
        (s) =>
          s.name.toLowerCase().includes(lowerQ) ||
          s.id.toLowerCase().includes(lowerQ) ||
          s.region.toLowerCase().includes(lowerQ)
      );
    }

    // Sort by relevance (name, then id)
    stations = [...stations].sort((a, b) => {
      if (!q) return 0;
      const aMatch = a.name.toLowerCase().includes(q.toLowerCase()) ? 0 : 1;
      const bMatch = b.name.toLowerCase().includes(q.toLowerCase()) ? 0 : 1;
      return aMatch - bMatch;
    });

    // Paginate
    const total = stations.length;
    const start = offset ?? 0;
    const end = limit ? start + limit : undefined;
    const paginated = stations.slice(start, end);

    return NextResponse.json({
      data: paginated,
      meta: {
        total,
        limit,
        offset,
        hasMore: (end ?? 0) < total,
      },
    });
  } catch (error) {
    console.error('Failed to get stations:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve stations' },
      { status: 500 }
    );
  }
}

// GET /api/stations/search
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, region, limit, offset } = body ?? {};

    if (typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    let stations = STATIONS;

    if (region) {
      stations = stations.filter((s) => s.region === region);
    }

    const lowerQ = query.toLowerCase();
    stations = stations.filter(
      (s) =>
        s.name.toLowerCase().includes(lowerQ) ||
        s.id.toLowerCase().includes(lowerQ) ||
        s.region.toLowerCase().includes(lowerQ)
    );

    // Sort by relevance
    stations = [...stations].sort((a, b) => {
      const aMatch = a.name.toLowerCase().includes(query.toLowerCase()) ? 0 : 1;
      const bMatch = b.name.toLowerCase().includes(query.toLowerCase()) ? 0 : 1;
      return aMatch - bMatch;
    });

    const total = stations.length;
    const start = offset ?? 0;
    const end = limit ? start + limit : undefined;
    const paginated = stations.slice(start, end);

    return NextResponse.json({
      data: paginated,
      meta: {
        total,
        limit,
        offset,
        hasMore: (end ?? 0) < total,
      },
    });
  } catch (error) {
    console.error('Failed to search stations:', error);
    return NextResponse.json({ error: 'Failed to search stations' }, { status: 500 });
  }
}



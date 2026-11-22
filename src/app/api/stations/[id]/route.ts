import { NextRequest, NextResponse } from 'next/server';
import { STATION_INDEX, getStationById } from '@/lib/railway-data';
import type { RailwayStation } from '@/types/railway';

// GET /api/stations/[id]
export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.pathname.split('/').pop();
    if (!id) {
      return NextResponse.json({ error: 'Station id is required' }, { status: 400 });
    }

    const station = getStationById(id);
    if (!station) {
      return NextResponse.json({ error: 'Station not found' }, { status: 404 });
    }

    return NextResponse.json({ data: station });
  } catch (error) {
    console.error('Failed to get station:', error);
    return NextResponse.json({ error: 'Failed to retrieve station' }, { status: 500 });
  }
}

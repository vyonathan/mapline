import { NextRequest, NextResponse } from 'next/server';
import { STATIONS, LINES } from '@/lib/railway-data';
import { findBestRoute, findAlternativeRoutes } from '@/features/routing/route-planner';
import type { Route } from '@/types/railway';

// GET /api/journeys/plan
export async function GET(request: NextRequest) {
  try {
    const originId = request.nextUrl.searchParams.get('origin');
    const destId = request.nextUrl.searchParams.get('dest');
    const isJakartaOnly = request.nextUrl.searchParams.get('jakarta') === '1';

    if (!originId || !destId) {
      return NextResponse.json({ error: 'origin and dest are required' }, { status: 400 });
    }

    // Validate stations exist
    const origin = STATIONS.find((s) => s.id === originId);
    const dest = STATIONS.find((s) => s.id === destId);
    if (!origin) return NextResponse.json({ error: 'Origin station not found' }, { status: 404 });
    if (!dest) return NextResponse.json({ error: 'Destination station not found' }, { status: 404 });

    const route = await findBestRoute(originId, destId, { isJakartaOnly });

    if (!route) {
      return NextResponse.json({ error: 'No route found' }, { status: 404 });
    }

    // Convert LatLng tuples to [lat, lon]
    const path: [number, number][] = route.path.map((p) => [p[0], p[1]]) as [number, number][];

    return NextResponse.json({
      data: {
        originId,
        destId,
        steps: route.steps,
        stationSequence: route.stationSequence,
        totalDistanceKm: Math.round(route.totalDistanceKm * 100) / 100,
        path,
        lineIds: route.lineIds,
        transfers: route.transfers,
        // Note: distance-based, not time-based. This is honest.
        note: 'Distance-based route. No reliable journey-time table loaded; this is not guaranteed to be the fastest route.',
      },
    });
  } catch (error) {
    console.error('Failed to plan route:', error);
    return NextResponse.json({ error: 'Failed to plan route' }, { status: 500 });
  }
}

// POST /api/journeys/plan
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { originId, destId, isJakartaOnly } = body ?? {};

    if (!originId || !destId) {
      return NextResponse.json({ error: 'originId and destId are required' }, { status: 400 });
    }

    const route = await findBestRoute(originId, destId, { isJakartaOnly });

    if (!route) {
      return NextResponse.json({ error: 'No route found' }, { status: 404 });
    }

    const path: [number, number][] = route.path.map((p) => [p[0], p[1]]) as [number, number][];

    return NextResponse.json({
      data: {
        originId,
        destId,
        steps: route.steps,
        stationSequence: route.stationSequence,
        totalDistanceKm: Math.round(route.totalDistanceKm * 100) / 100,
        path,
        lineIds: route.lineIds,
        transfers: route.transfers,
        note: 'Distance-based route. No reliable journey-time table loaded; this is not guaranteed to be the fastest route.',
      },
    });
  } catch (error) {
    console.error('Failed to plan route:', error);
    return NextResponse.json({ error: 'Failed to plan route' }, { status: 500 });
  }
}

// GET /api/journeys/alternatives
export async function GET_ALTERNATIVES(request: NextRequest) {
  try {
    const originId = request.nextUrl.searchParams.get('origin');
    const destId = request.nextUrl.searchParams.get('dest');
    const isJakartaOnly = request.nextUrl.searchParams.get('jakarta') === '1';

    if (!originId || !destId) {
      return NextResponse.json({ error: 'origin and dest are required' }, { status: 400 });
    }

    const alternatives = await findAlternativeRoutes(originId, destId, { isJakartaOnly });

    return NextResponse.json({ data: alternatives });
  } catch (error) {
    console.error('Failed to get alternatives:', error);
    return NextResponse.json({ error: 'Failed to get alternatives' }, { status: 500 });
  }
}

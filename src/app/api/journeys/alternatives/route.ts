import { NextRequest, NextResponse } from 'next/server';
import { findAlternativeRoutes } from '@/features/routing/route-planner';

// GET /api/journeys/alternatives
export async function GET(request: NextRequest) {
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

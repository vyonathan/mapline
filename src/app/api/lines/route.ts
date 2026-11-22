import { NextRequest, NextResponse } from 'next/server';
import { LINES, LINE_INDEX, getLineById } from '@/lib/railway-data';
import type { RailwayLine } from '@/types/railway';

// GET /api/lines
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const region = searchParams.get('region');
    const q = searchParams.get('q')?.trim() || undefined;

    let lines = LINES;

    if (category) {
      lines = lines.filter((l) => l.category === category);
    }
    if (region) {
      lines = lines.filter((l) => l.region === region);
    }
    if (q) {
      const lowerQ = q.toLowerCase();
      lines = lines.filter(
        (l) =>
          l.name.toLowerCase().includes(lowerQ) ||
          l.shortName.toLowerCase().includes(lowerQ)
      );
    }

    return NextResponse.json({
      data: lines,
      meta: {
        total: lines.length,
        limit: undefined,
        offset: undefined,
        hasMore: false,
      },
    });
  } catch (error) {
    console.error('Failed to get lines:', error);
    return NextResponse.json({ error: 'Failed to retrieve lines' }, { status: 500 });
  }
}
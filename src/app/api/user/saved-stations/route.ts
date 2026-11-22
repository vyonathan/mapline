import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import type { SavedStationRecord } from '@/types/railway';

// GET /api/user/saved-stations
export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const savedStations = await prisma.savedStation.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    const data: SavedStationRecord[] = savedStations.map((r) => ({
      userId: r.userId,
      stationId: r.stationId,
      createdAt: r.createdAt,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Failed to get saved stations:', error);
    return NextResponse.json({ error: 'Failed to retrieve saved stations' }, { status: 500 });
  }
}

// POST /api/user/saved-stations
export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { stationId } = body ?? {};

    if (!stationId || typeof stationId !== 'string') {
      return NextResponse.json({ error: 'stationId is required' }, { status: 400 });
    }

    const saved = await prisma.savedStation.upsert({
      where: { userId_stationId: { userId: user.id, stationId } },
      update: {},
      create: {
        userId: user.id,
        stationId,
      },
    });

    return NextResponse.json({
      data: {
        userId: saved.userId,
        stationId: saved.stationId,
        createdAt: saved.createdAt,
      },
    });
  } catch (error) {
    console.error('Failed to save station:', error);
    return NextResponse.json({ error: 'Failed to save station' }, { status: 500 });
  }
}

// DELETE /api/user/saved-stations
export async function DELETE(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const stationId = searchParams.get('stationId');

    if (!stationId) {
      return NextResponse.json({ error: 'stationId is required' }, { status: 400 });
    }

    await prisma.savedStation.deleteMany({
      where: { userId: user.id, stationId },
    });

    return NextResponse.json({ message: 'Saved station removed' });
  } catch (error) {
    console.error('Failed to delete saved station:', error);
    return NextResponse.json({ error: 'Failed to delete saved station' }, { status: 500 });
  }
}

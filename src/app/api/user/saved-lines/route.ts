import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import type { SavedLineRecord } from '@/types/railway';

// GET /api/user/saved-lines
export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const savedLines = await prisma.savedLine.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });

    const data: SavedLineRecord[] = savedLines.map((r) => ({
      userId: r.userId,
      lineId: r.lineId,
      createdAt: r.createdAt,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Failed to get saved lines:', error);
    return NextResponse.json({ error: 'Failed to retrieve saved lines' }, { status: 500 });
  }
}

// POST /api/user/saved-lines
export async function POST(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { lineId } = body ?? {};

    if (!lineId || typeof lineId !== 'string') {
      return NextResponse.json({ error: 'lineId is required' }, { status: 400 });
    }

    const saved = await prisma.savedLine.upsert({
      where: { userId_lineId: { userId: user.id, lineId } },
      update: {},
      create: {
        userId: user.id,
        lineId,
      },
    });

    return NextResponse.json({
      data: {
        userId: saved.userId,
        lineId: saved.lineId,
        createdAt: saved.createdAt,
      },
    });
  } catch (error) {
    console.error('Failed to save line:', error);
    return NextResponse.json({ error: 'Failed to save line' }, { status: 500 });
  }
}

// DELETE /api/user/saved-lines
export async function DELETE(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const lineId = searchParams.get('lineId');

    if (!lineId) {
      return NextResponse.json({ error: 'lineId is required' }, { status: 400 });
    }

    await prisma.savedLine.deleteMany({
      where: { userId: user.id, lineId },
    });

    return NextResponse.json({ message: 'Saved line removed' });
  } catch (error) {
    console.error('Failed to delete saved line:', error);
    return NextResponse.json({ error: 'Failed to delete saved line' }, { status: 500 });
  }
}

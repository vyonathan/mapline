import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

// GET /api/user/preferences
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const preferences = await prisma.userPreference.findMany({
      where: { userId: user.id },
      orderBy: { key: 'asc' },
    });

    const data: Record<string, string> = {};
    for (const p of preferences) {
      data[p.key] = p.value;
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Failed to get preferences:', error);
    return NextResponse.json({ error: 'Failed to retrieve preferences' }, { status: 500 });
  }
}

// PUT /api/user/preferences
export async function PUT(request: NextRequest) {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { key, value } = body ?? {};

    if (!key || typeof key !== 'string' || !value || typeof value !== 'string') {
      return NextResponse.json({ error: 'key and value are required' }, { status: 400 });
    }

    const preference = await prisma.userPreference.upsert({
      where: { userId_key: { userId: user.id, key } },
      update: { value },
      create: { userId: user.id, key, value },
    });

    return NextResponse.json({
      data: {
        id: preference.id,
        userId: preference.userId,
        key: preference.key,
        value: preference.value,
        updatedAt: preference.updatedAt,
      },
    });
  } catch (error) {
    console.error('Failed to update preference:', error);
    return NextResponse.json({ error: 'Failed to update preference' }, { status: 500 });
  }
}

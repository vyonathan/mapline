import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';

// GET /api/user/me
export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the user record, creating it if it doesn't exist.
    const dbUser = await prisma.user.upsert({
      where: { clerkUserId: user.id },
      update: {
        email: user.emailAddresses[0]?.emailAddress ?? null,
        name: (user as any).fullName ?? null,
        imageUrl: user.imageUrl ?? null,
      },
      create: {
        clerkUserId: user.id,
        email: user.emailAddresses[0]?.emailAddress ?? null,
        name: (user as any).fullName ?? null,
        imageUrl: user.imageUrl ?? null,
      },
    });

    return NextResponse.json({
      data: {
        id: dbUser.id,
        clerkUserId: dbUser.clerkUserId,
        email: dbUser.email,
        name: dbUser.name,
        imageUrl: dbUser.imageUrl,
        createdAt: dbUser.createdAt,
        updatedAt: dbUser.updatedAt,
      },
    });
  } catch (error) {
    console.error('Failed to get current user:', error);
    return NextResponse.json({ error: 'Failed to retrieve user' }, { status: 500 });
  }
}

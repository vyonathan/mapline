import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Allow the client to check connection status
export async function healthCheck() {
  try {
    await prisma.$connect();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  } finally {
    await prisma.$disconnect();
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET redemption history (admin: all, employee: own)
export async function GET(req) {
  const { error, session } = await requireAuth(req);
  if (error) return error;

  try {
    const where = session.role === 'ADMIN' ? {} : { userId: session.id };
    const data = await prisma.rewardRedemption.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, department: { select: { name: true } } } },
        reward: { select: { id: true, name: true, pointsRequired: true } }
      },
      orderBy: { redeemedAt: 'desc' }
    });
    return NextResponse.json(data);
  } catch (err) {
    console.error('Error fetching redemptions:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

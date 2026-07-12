import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(req) {
  const { error, session } = await requireAuth(req);
  if (error) return error;

  let data;
  if (session.role === 'ADMIN') {
    data = await prisma.challengeParticipation.findMany({
      include: { user: true, challenge: true }
    });
  } else {
    data = await prisma.challengeParticipation.findMany({
      where: { userId: session.id },
      include: { user: true, challenge: true }
    });
  }
  return NextResponse.json(data);
}
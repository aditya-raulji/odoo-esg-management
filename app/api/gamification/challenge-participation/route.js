import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';
import { checkAndAwardBadges } from '@/lib/badges';
import { notify } from '@/lib/notify';

// GET — admin: all participations; employee: own only
export async function GET(req) {
  const { error, session } = await requireAuth(req);
  if (error) return error;

  try {
    const where = session.role === 'ADMIN' ? {} : { userId: session.id };
    const data = await prisma.challengeParticipation.findMany({
      where,
      include: {
        user: { include: { department: true } },
        challenge: true
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(data);
  } catch (err) {
    console.error('Error fetching participations:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST — employee joins a challenge
export async function POST(req) {
  const { error, session } = await requireAuth(req);
  if (error) return error;

  try {
    const body = await req.json();
    const { challengeId } = body;

    if (!challengeId) return NextResponse.json({ error: 'Challenge ID is required' }, { status: 400 });

    const challenge = await prisma.challenge.findUnique({ where: { id: parseInt(challengeId) } });
    if (!challenge) return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });

    // Only ACTIVE challenges can be joined
    if (challenge.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'You can only join ACTIVE challenges' }, { status: 422 });
    }

    // Prevent duplicate join
    const existing = await prisma.challengeParticipation.findFirst({
      where: { challengeId: parseInt(challengeId), userId: session.id }
    });
    if (existing) return NextResponse.json({ error: 'You have already joined this challenge' }, { status: 409 });

    const participation = await prisma.challengeParticipation.create({
      data: {
        challengeId: parseInt(challengeId),
        userId: session.id,
        progress: 0,
        approvalStatus: 'PENDING'
      },
      include: { challenge: true, user: true }
    });

    return NextResponse.json(participation, { status: 201 });
  } catch (err) {
    console.error('Error joining challenge:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
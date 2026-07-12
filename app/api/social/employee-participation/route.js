import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

// GET all participations
export async function GET(req) {
  const { error, session } = await requireAuth(req);
  if (error) return error;

  try {
    let data;
    if (session.role === 'ADMIN') {
      data = await prisma.employeeParticipation.findMany({
        include: { user: true, activity: { include: { category: true } } },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      data = await prisma.employeeParticipation.findMany({
        where: { userId: session.id },
        include: { user: true, activity: { include: { category: true } } },
        orderBy: { createdAt: 'desc' }
      });
    }
    return NextResponse.json(data);
  } catch (err) {
    console.error('Error fetching participations:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST join CSR activity (Authenticated employee)
export async function POST(req) {
  const { error, session } = await requireAuth(req);
  if (error) return error;

  try {
    const body = await req.json();
    const { activityId } = body;

    if (!activityId) {
      return NextResponse.json({ error: 'Activity ID is required' }, { status: 400 });
    }

    const actId = parseInt(activityId);
    const activity = await prisma.cSRActivity.findUnique({ where: { id: actId } });
    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
    }

    if (activity.status !== 'OPEN') {
      return NextResponse.json({ error: 'This activity is closed for new participants' }, { status: 400 });
    }

    // Check if already joined
    const existing = await prisma.employeeParticipation.findFirst({
      where: { userId: session.id, activityId: actId }
    });

    if (existing) {
      return NextResponse.json({ error: 'You have already joined this activity' }, { status: 400 });
    }

    // Create participation and increment joinedCount atomically
    const participation = await prisma.$transaction(async (tx) => {
      const part = await tx.employeeParticipation.create({
        data: {
          userId: session.id,
          activityId: actId,
          approvalStatus: 'PENDING',
          pointsEarned: 0
        },
        include: { activity: true }
      });

      await tx.cSRActivity.update({
        where: { id: actId },
        data: { joinedCount: { increment: 1 } }
      });

      return part;
    });

    await logActivity('SOCIAL', `${session.name} joined CSR Activity: ${activity.title}`);

    return NextResponse.json(participation, { status: 201 });
  } catch (err) {
    console.error('Error joining activity:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
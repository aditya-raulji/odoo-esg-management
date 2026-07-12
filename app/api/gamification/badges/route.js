import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, requireAuth } from '@/lib/auth';

// GET all badges + current user's earned badges
export async function GET(req) {
  const { error, session } = await requireAuth(req);
  if (error) return error;

  try {
    const [badges, myBadges] = await Promise.all([
      prisma.badge.findMany({ orderBy: { createdAt: 'asc' } }),
      prisma.userBadge.findMany({
        where: { userId: session.id },
        select: { badgeId: true, awardedAt: true }
      })
    ]);

    const ownedMap = {};
    myBadges.forEach((b) => { ownedMap[b.badgeId] = b.awardedAt; });

    return NextResponse.json(badges.map((b) => ({
      ...b,
      earned: !!ownedMap[b.id],
      awardedAt: ownedMap[b.id] || null
    })));
  } catch (err) {
    console.error('Error fetching badges:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST create badge (admin)
export async function POST(req) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  try {
    const body = await req.json();
    const { name, description, icon, unlockRuleType, unlockValue } = body;

    if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    if (!description?.trim()) return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    if (!['XP_THRESHOLD', 'CHALLENGES_COMPLETED', 'CSR_COMPLETED'].includes(unlockRuleType)) {
      return NextResponse.json({ error: 'Invalid unlockRuleType' }, { status: 400 });
    }
    if (!unlockValue || isNaN(Number(unlockValue)) || Number(unlockValue) <= 0) {
      return NextResponse.json({ error: 'unlockValue must be a positive number' }, { status: 400 });
    }

    const badge = await prisma.badge.create({
      data: {
        name: name.trim(),
        description: description.trim(),
        icon: icon?.trim() || '🏅',
        unlockRuleType,
        unlockValue: parseInt(unlockValue)
      }
    });

    return NextResponse.json(badge, { status: 201 });
  } catch (err) {
    console.error('Error creating badge:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
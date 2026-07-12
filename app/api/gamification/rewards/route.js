import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, requireAuth } from '@/lib/auth';
import { notify } from '@/lib/notify';

// GET rewards (with optional redemption history for admin)
export async function GET(req) {
  const { error, session } = await requireAuth(req);
  if (error) return error;

  try {
    const rewards = await prisma.reward.findMany({
      orderBy: { createdAt: 'desc' }
    });

    // Also return current user's points and xp
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { points: true, xp: true }
    });

    return NextResponse.json({ rewards, userPoints: user?.points || 0, userXp: user?.xp || 0 });
  } catch (err) {
    console.error('Error fetching rewards:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST create reward (admin)
export async function POST(req) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  try {
    const body = await req.json();
    const { name, description, pointsRequired, stock } = body;

    if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    if (!pointsRequired || isNaN(Number(pointsRequired)) || Number(pointsRequired) <= 0) {
      return NextResponse.json({ error: 'Points required must be a positive number' }, { status: 400 });
    }
    if (stock === undefined || isNaN(Number(stock)) || Number(stock) < 0) {
      return NextResponse.json({ error: 'Stock must be a non-negative number' }, { status: 400 });
    }

    const reward = await prisma.reward.create({
      data: {
        name: name.trim(),
        description: description?.trim() || '',
        pointsRequired: parseInt(pointsRequired),
        stock: parseInt(stock),
        status: 'Active'
      }
    });

    return NextResponse.json(reward, { status: 201 });
  } catch (err) {
    console.error('Error creating reward:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
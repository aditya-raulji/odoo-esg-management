import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

// Valid lifecycle transitions
const VALID_TRANSITIONS = {
  DRAFT: ['ACTIVE', 'ARCHIVED'],
  ACTIVE: ['UNDER_REVIEW', 'ARCHIVED'],
  UNDER_REVIEW: ['COMPLETED', 'ARCHIVED'],
  COMPLETED: ['ARCHIVED'],
  ARCHIVED: []
};

// GET all challenges (auth users see all; auto-move ACTIVE→UNDER_REVIEW for past deadlines)
export async function GET(req) {
  const { error } = await requireAuth(req);
  if (error) return error;

  try {
    const now = new Date();

    // Auto-move: ACTIVE past deadline → UNDER_REVIEW
    await prisma.challenge.updateMany({
      where: { status: 'ACTIVE', deadline: { lt: now } },
      data: { status: 'UNDER_REVIEW' }
    });

    const data = await prisma.challenge.findMany({
      include: { category: true, participations: { select: { id: true } } },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(data);
  } catch (err) {
    console.error('Error fetching challenges:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST create challenge (admin only → DRAFT)
export async function POST(req) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  try {
    const body = await req.json();
    const { title, categoryId, description, xp, difficulty, evidenceRequired, deadline } = body;

    if (!title?.trim()) return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    if (!categoryId) return NextResponse.json({ error: 'Category is required' }, { status: 400 });
    if (!description?.trim()) return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    if (!xp || isNaN(Number(xp)) || Number(xp) <= 0) return NextResponse.json({ error: 'XP must be a positive number' }, { status: 400 });
    if (!['EASY', 'MEDIUM', 'HARD'].includes(difficulty)) return NextResponse.json({ error: 'Difficulty must be EASY, MEDIUM, or HARD' }, { status: 400 });
    if (!deadline || isNaN(Date.parse(deadline))) return NextResponse.json({ error: 'Valid deadline is required' }, { status: 400 });

    const category = await prisma.category.findFirst({ where: { id: parseInt(categoryId), type: 'CHALLENGE' } });
    if (!category) return NextResponse.json({ error: 'Challenge category not found' }, { status: 404 });

    const challenge = await prisma.challenge.create({
      data: {
        title: title.trim(),
        categoryId: parseInt(categoryId),
        description: description.trim(),
        xp: parseInt(xp),
        difficulty,
        evidenceRequired: !!evidenceRequired,
        deadline: new Date(deadline),
        status: 'DRAFT'
      },
      include: { category: true }
    });

    await logActivity('GAMIFICATION', `Challenge created: "${challenge.title}" (${difficulty}, ${xp} XP)`);

    return NextResponse.json(challenge, { status: 201 });
  } catch (err) {
    console.error('Error creating challenge:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
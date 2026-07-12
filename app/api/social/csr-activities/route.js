import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

// GET all CSR activities (Authenticated users)
export async function GET(req) {
  const { error } = await requireAuth(req);
  if (error) return error;

  try {
    const data = await prisma.cSRActivity.findMany({
      include: { category: true },
      orderBy: { date: 'desc' }
    });
    return NextResponse.json(data);
  } catch (err) {
    console.error('Error fetching CSR activities:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST create CSR activity (Admin only)
export async function POST(req) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  try {
    const body = await req.json();
    const { title, categoryId, date, description, pointsReward, evidenceRequired } = body;

    // Validation
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    if (!categoryId) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 });
    }
    const catId = parseInt(categoryId);
    const category = await prisma.category.findUnique({ where: { id: catId } });
    if (!category || category.type !== 'CSR_ACTIVITY') {
      return NextResponse.json({ error: 'Valid CSR category is required' }, { status: 400 });
    }
    if (!date || isNaN(Date.parse(date))) {
      return NextResponse.json({ error: 'A valid date is required' }, { status: 400 });
    }
    const points = parseInt(pointsReward);
    if (isNaN(points) || points <= 0) {
      return NextResponse.json({ error: 'Points reward must be a positive number' }, { status: 400 });
    }

    // Read OrgSettings
    const orgSettings = await prisma.orgSettings.findUnique({ where: { id: 1 } });
    const globalEvidenceRequired = orgSettings?.evidenceRequired ?? true;

    // Force evidenceRequired to true if global toggle is ON
    const finalEvidenceRequired = globalEvidenceRequired ? true : !!evidenceRequired;

    const activity = await prisma.cSRActivity.create({
      data: {
        title: title.trim(),
        categoryId: catId,
        date: new Date(date),
        description: description.trim(),
        pointsReward: points,
        evidenceRequired: finalEvidenceRequired,
        status: 'OPEN'
      },
      include: { category: true }
    });

    await logActivity('SOCIAL', `New CSR Activity created: ${activity.title}`);

    return NextResponse.json(activity, { status: 201 });
  } catch (err) {
    console.error('Error creating CSR activity:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

// PUT update CSR activity (Admin only)
export async function PUT(req, { params }) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const id = parseInt(params.id);
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { title, categoryId, date, description, pointsReward, evidenceRequired, status } = body;

    // Check if exists
    const existing = await prisma.cSRActivity.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'CSR Activity not found' }, { status: 404 });
    }

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
    if (status && status !== 'OPEN' && status !== 'CLOSED') {
      return NextResponse.json({ error: 'Status must be OPEN or CLOSED' }, { status: 400 });
    }

    // Read OrgSettings
    const orgSettings = await prisma.orgSettings.findUnique({ where: { id: 1 } });
    const globalEvidenceRequired = orgSettings?.evidenceRequired ?? true;

    // Force evidenceRequired to true if global toggle is ON
    const finalEvidenceRequired = globalEvidenceRequired ? true : !!evidenceRequired;

    const activity = await prisma.cSRActivity.update({
      where: { id },
      data: {
        title: title.trim(),
        categoryId: catId,
        date: new Date(date),
        description: description.trim(),
        pointsReward: points,
        evidenceRequired: finalEvidenceRequired,
        status: status || existing.status
      },
      include: { category: true }
    });

    await logActivity('SOCIAL', `CSR Activity updated: ${activity.title}`);

    return NextResponse.json(activity);
  } catch (err) {
    console.error('Error updating CSR activity:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE CSR activity (Admin only)
export async function DELETE(req, { params }) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const id = parseInt(params.id);
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  try {
    const activity = await prisma.cSRActivity.findUnique({
      where: { id },
      include: { participations: true }
    });

    if (!activity) {
      return NextResponse.json({ error: 'CSR Activity not found' }, { status: 404 });
    }

    if (activity.participations.length > 0) {
      return NextResponse.json({ error: 'Cannot delete activity with existing participations. Mark it as CLOSED instead.' }, { status: 400 });
    }

    await prisma.cSRActivity.delete({ where: { id } });

    await logActivity('SOCIAL', `CSR Activity deleted: ${activity.title}`);

    return NextResponse.json({ message: 'CSR Activity deleted successfully' });
  } catch (err) {
    console.error('Error deleting CSR activity:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

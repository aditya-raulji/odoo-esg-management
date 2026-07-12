import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

const VALID_TRANSITIONS = {
  DRAFT: ['ACTIVE', 'ARCHIVED'],
  ACTIVE: ['UNDER_REVIEW', 'ARCHIVED'],
  UNDER_REVIEW: ['COMPLETED', 'ARCHIVED'],
  COMPLETED: ['ARCHIVED'],
  ARCHIVED: []
};

// PATCH — update fields and/or transition status (admin only)
export async function PATCH(req, { params }) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const id = parseInt(params.id);
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  try {
    const body = await req.json();
    const { status: newStatus, title, categoryId, description, xp, difficulty, evidenceRequired, deadline } = body;

    const challenge = await prisma.challenge.findUnique({ where: { id } });
    if (!challenge) return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });

    // Validate state machine transition
    if (newStatus && newStatus !== challenge.status) {
      const allowed = VALID_TRANSITIONS[challenge.status] || [];
      if (!allowed.includes(newStatus)) {
        return NextResponse.json({
          error: `Invalid status transition: ${challenge.status} → ${newStatus}. Allowed: ${allowed.join(', ') || 'none'}`
        }, { status: 422 });
      }
    }

    const updateData = {};
    if (newStatus) updateData.status = newStatus;
    if (title?.trim()) updateData.title = title.trim();
    if (categoryId) updateData.categoryId = parseInt(categoryId);
    if (description?.trim()) updateData.description = description.trim();
    if (xp !== undefined) updateData.xp = parseInt(xp);
    if (difficulty) updateData.difficulty = difficulty;
    if (evidenceRequired !== undefined) updateData.evidenceRequired = !!evidenceRequired;
    if (deadline) updateData.deadline = new Date(deadline);

    const updated = await prisma.challenge.update({
      where: { id },
      data: updateData,
      include: { category: true }
    });

    if (newStatus && newStatus !== challenge.status) {
      await logActivity('GAMIFICATION', `Challenge "${updated.title}" status changed: ${challenge.status} → ${newStatus}`);
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error('Error updating challenge:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE challenge (admin only; only DRAFT/ARCHIVED allowed)
export async function DELETE(req, { params }) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const id = parseInt(params.id);
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  try {
    const challenge = await prisma.challenge.findUnique({
      where: { id },
      include: { participations: true }
    });
    if (!challenge) return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });

    if (!['DRAFT', 'ARCHIVED'].includes(challenge.status)) {
      return NextResponse.json({ error: 'Only DRAFT or ARCHIVED challenges can be deleted' }, { status: 400 });
    }

    if (challenge.participations.length > 0) {
      return NextResponse.json({ error: 'Cannot delete a challenge with existing participations' }, { status: 400 });
    }

    await prisma.challenge.delete({ where: { id } });
    await logActivity('GAMIFICATION', `Challenge deleted: "${challenge.title}"`);
    return NextResponse.json({ message: 'Challenge deleted successfully' });
  } catch (err) {
    console.error('Error deleting challenge:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

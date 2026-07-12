import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

// PUT update category (Admin only)
export async function PUT(req, { params }) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const id = parseInt(params.id);
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid category ID' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { name, type, status } = body;

    // Server-side validation
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    if (!type || (type !== 'CSR_ACTIVITY' && type !== 'CHALLENGE')) {
      return NextResponse.json({ error: 'Type must be CSR_ACTIVITY or CHALLENGE' }, { status: 400 });
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        name: name.trim(),
        type,
        status: status || 'Active'
      }
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error('Error updating category:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE category (Admin only)
export async function DELETE(req, { params }) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const id = parseInt(params.id);
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid category ID' }, { status: 400 });
  }

  try {
    // 1. Check if category is used by any CSR activities
    const csrCount = await prisma.cSRActivity.count({
      where: { categoryId: id }
    });
    if (csrCount > 0) {
      return NextResponse.json({
        error: 'Cannot delete category: It is currently linked to CSR activities.'
      }, { status: 400 });
    }

    // 2. Check if category is used by any Challenges
    const challengeCount = await prisma.challenge.count({
      where: { categoryId: id }
    });
    if (challengeCount > 0) {
      return NextResponse.json({
        error: 'Cannot delete category: It is currently linked to active/draft challenges.'
      }, { status: 400 });
    }

    await prisma.category.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error deleting category:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

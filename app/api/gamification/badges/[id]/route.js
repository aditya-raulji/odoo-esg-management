import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

// PUT update badge (admin)
export async function PUT(req, { params }) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const id = parseInt(params.id);
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  try {
    const body = await req.json();
    const { name, description, icon, unlockRuleType, unlockValue } = body;

    const badge = await prisma.badge.findUnique({ where: { id } });
    if (!badge) return NextResponse.json({ error: 'Badge not found' }, { status: 404 });

    const updated = await prisma.badge.update({
      where: { id },
      data: {
        name: name?.trim() || badge.name,
        description: description?.trim() || badge.description,
        icon: icon?.trim() || badge.icon,
        unlockRuleType: unlockRuleType || badge.unlockRuleType,
        unlockValue: unlockValue ? parseInt(unlockValue) : badge.unlockValue
      }
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error('Error updating badge:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE badge (admin)
export async function DELETE(req, { params }) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const id = parseInt(params.id);
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  try {
    await prisma.userBadge.deleteMany({ where: { badgeId: id } });
    await prisma.badge.delete({ where: { id } });
    return NextResponse.json({ message: 'Badge deleted' });
  } catch (err) {
    console.error('Error deleting badge:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

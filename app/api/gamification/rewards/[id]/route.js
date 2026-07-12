import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, requireAuth } from '@/lib/auth';
import { notify } from '@/lib/notify';
import { logActivity } from '@/lib/activity';


// PATCH update reward (admin)
export async function PATCH(req, { params }) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const id = parseInt(params.id);
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  try {
    const body = await req.json();
    const { name, description, pointsRequired, stock, status } = body;

    const reward = await prisma.reward.findUnique({ where: { id } });
    if (!reward) return NextResponse.json({ error: 'Reward not found' }, { status: 404 });

    const updated = await prisma.reward.update({
      where: { id },
      data: {
        name: name?.trim() || reward.name,
        description: description?.trim() ?? reward.description,
        pointsRequired: pointsRequired ? parseInt(pointsRequired) : reward.pointsRequired,
        stock: stock !== undefined ? parseInt(stock) : reward.stock,
        status: status || reward.status
      }
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error('Error updating reward:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE reward (admin)
export async function DELETE(req, { params }) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const id = parseInt(params.id);
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  try {
    const reward = await prisma.reward.findUnique({ where: { id }, include: { redemptions: true } });
    if (!reward) return NextResponse.json({ error: 'Reward not found' }, { status: 404 });
    if (reward.redemptions.length > 0) {
      return NextResponse.json({ error: 'Cannot delete reward with existing redemptions' }, { status: 400 });
    }
    await prisma.reward.delete({ where: { id } });
    return NextResponse.json({ message: 'Reward deleted' });
  } catch (err) {
    console.error('Error deleting reward:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, requireAuth } from '@/lib/auth';
import { notify } from '@/lib/notify';
import { logActivity } from '@/lib/activity';

// POST /api/gamification/rewards/[id]/redeem — employee redeems a reward
export async function POST(req, { params }) {
  const { error, session } = await requireAuth(req);
  if (error) return error;

  const rewardId = parseInt(params.id);
  if (isNaN(rewardId)) return NextResponse.json({ error: 'Invalid reward ID' }, { status: 400 });

  try {
    const [reward, user] = await Promise.all([
      prisma.reward.findUnique({ where: { id: rewardId } }),
      prisma.user.findUnique({ where: { id: session.id }, select: { id: true, name: true, points: true } })
    ]);

    if (!reward) return NextResponse.json({ error: 'Reward not found' }, { status: 404 });
    if (reward.status !== 'Active') return NextResponse.json({ error: 'This reward is no longer available' }, { status: 400 });
    if (reward.stock <= 0) {
      return NextResponse.json({ error: 'This reward is out of stock' }, { status: 422 });
    }
    if (user.points < reward.pointsRequired) {
      return NextResponse.json({
        error: `Insufficient points. You have ${user.points} pts but need ${reward.pointsRequired} pts.`
      }, { status: 422 });
    }

    // Atomic transaction: deduct points, reduce stock, create redemption record
    const [redemption] = await prisma.$transaction([
      prisma.rewardRedemption.create({
        data: {
          userId: session.id,
          rewardId,
          pointsSpent: reward.pointsRequired,
          status: 'FULFILLED'
        }
      }),
      prisma.user.update({
        where: { id: session.id },
        data: { points: { decrement: reward.pointsRequired } }
      }),
      prisma.reward.update({
        where: { id: rewardId },
        data: { stock: { decrement: 1 } }
      })
    ]);

    const remainingPoints = user.points - reward.pointsRequired;

    await notify({
      userIds: session.id,
      type: 'REWARD',
      title: '🎁 Reward Redeemed!',
      message: `You redeemed "${reward.name}" for ${reward.pointsRequired} pts. Remaining balance: ${remainingPoints} pts.`,
      link: '/gamification/rewards'
    });

    await logActivity('GAMIFICATION', `${user.name} redeemed reward: "${reward.name}" (${reward.pointsRequired} pts)`);

    return NextResponse.json({
      redemption,
      remainingPoints,
      message: `Successfully redeemed "${reward.name}". You have ${remainingPoints} points remaining.`
    }, { status: 201 });
  } catch (err) {
    console.error('Error redeeming reward:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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

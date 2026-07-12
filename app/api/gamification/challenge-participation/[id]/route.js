import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireAdmin } from '@/lib/auth';
import { logActivity } from '@/lib/activity';
import { checkAndAwardBadges } from '@/lib/badges';
import { notify } from '@/lib/notify';

// PATCH — update progress/proof (employee) OR approve/reject (admin)
export async function PATCH(req, { params }) {
  const { error, session } = await requireAuth(req);
  if (error) return error;

  const id = parseInt(params.id);
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  try {
    const body = await req.json();
    const { progress, proofUrl, action } = body;

    const participation = await prisma.challengeParticipation.findUnique({
      where: { id },
      include: { challenge: true, user: true }
    });
    if (!participation) return NextResponse.json({ error: 'Participation not found' }, { status: 404 });

    const isAdmin = session.role === 'ADMIN';
    const isOwner = participation.userId === session.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // ADMIN: approve/reject
    if (isAdmin && action) {
      if (!['APPROVE', 'REJECT'].includes(action)) {
        return NextResponse.json({ error: 'Action must be APPROVE or REJECT' }, { status: 400 });
      }

      if (action === 'APPROVE') {
        // Evidence required check
        if (participation.challenge.evidenceRequired && !participation.proofUrl) {
          return NextResponse.json({
            error: 'Proof is required by challenge rules before approval'
          }, { status: 422 });
        }

        const xpAwarded = participation.challenge.xp;

        const [updatedParticipation] = await prisma.$transaction([
          prisma.challengeParticipation.update({
            where: { id },
            data: { approvalStatus: 'APPROVED', xpAwarded }
          }),
          // Credit BOTH xp (lifetime) and points (spendable)
          prisma.user.update({
            where: { id: participation.userId },
            data: {
              xp: { increment: xpAwarded },
              points: { increment: xpAwarded }
            }
          })
        ]);

        await logActivity('GAMIFICATION', `${participation.user.name} completed '${participation.challenge.title}' — ${xpAwarded} XP awarded`);

        await notify({
          userIds: participation.userId,
          type: 'CHALLENGE',
          title: 'Challenge Approved! 🎉',
          message: `Your participation in "${participation.challenge.title}" was approved! You earned ${xpAwarded} XP and ${xpAwarded} points.`,
          link: '/gamification/challenge-participation'
        });

        // Fire badge engine (non-fatal)
        await checkAndAwardBadges(participation.userId);

        return NextResponse.json({ ...updatedParticipation, xpAwarded });
      }

      if (action === 'REJECT') {
        const updated = await prisma.challengeParticipation.update({
          where: { id },
          data: { approvalStatus: 'REJECTED' }
        });

        await notify({
          userIds: participation.userId,
          type: 'CHALLENGE',
          title: 'Challenge Submission Rejected',
          message: `Your participation in "${participation.challenge.title}" was not approved. Please review and resubmit.`,
          link: '/gamification/challenge-participation'
        });

        return NextResponse.json(updated);
      }
    }

    // EMPLOYEE: update progress and/or proofUrl
    if (isOwner) {
      if (participation.approvalStatus === 'APPROVED') {
        return NextResponse.json({ error: 'Cannot update an already-approved participation' }, { status: 400 });
      }

      const updateData = {};
      if (progress !== undefined) {
        const pct = parseInt(progress);
        if (isNaN(pct) || pct < 0 || pct > 100) {
          return NextResponse.json({ error: 'Progress must be 0–100' }, { status: 400 });
        }
        updateData.progress = pct;
      }
      if (proofUrl !== undefined) updateData.proofUrl = proofUrl;

      const updated = await prisma.challengeParticipation.update({
        where: { id },
        data: updateData,
        include: { challenge: true }
      });

      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: 'No valid action' }, { status: 400 });
  } catch (err) {
    console.error('Error updating participation:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

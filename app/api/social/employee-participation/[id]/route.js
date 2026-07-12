import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';
import { notify } from '@/lib/notify';

// PATCH/PUT update employee participation (Proof upload or Admin approval)
export async function PATCH(req, { params }) {
  const { error, session } = await requireAuth(req);
  if (error) return error;

  const id = parseInt(params.id);
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  try {
    const part = await prisma.employeeParticipation.findUnique({
      where: { id },
      include: { activity: true, user: true }
    });

    if (!part) {
      return NextResponse.json({ error: 'Participation record not found' }, { status: 404 });
    }

    const body = await req.json();
    const { proofUrl, approvalStatus, rejectionReason } = body;

    // --- CASE 1: Employee Uploading Proof ---
    if (proofUrl !== undefined) {
      // Security check: employee can only update their own participation
      if (session.role !== 'ADMIN' && part.userId !== session.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      // Check if already approved/rejected
      if (part.approvalStatus !== 'PENDING') {
        return NextResponse.json({ error: 'Cannot upload proof to a resolved participation' }, { status: 400 });
      }

      const updated = await prisma.employeeParticipation.update({
        where: { id },
        data: { proofUrl },
        include: { activity: true }
      });

      return NextResponse.json(updated);
    }

    // --- CASE 2: Admin Approving/Rejecting ---
    if (approvalStatus !== undefined) {
      if (session.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Admin role required' }, { status: 403 });
      }

      const newStatus = approvalStatus.toUpperCase();
      if (newStatus !== 'APPROVED' && newStatus !== 'REJECTED') {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }

      // Business rule: if approved, check evidence requirement
      if (newStatus === 'APPROVED') {
        const orgSettings = await prisma.orgSettings.findUnique({ where: { id: 1 } });
        const globalEvidenceRequired = orgSettings?.evidenceRequired ?? true;
        const requiresEvidence = part.activity.evidenceRequired || globalEvidenceRequired;

        if (requiresEvidence && !part.proofUrl) {
          return NextResponse.json({ error: 'Evidence required before approval' }, { status: 422 });
        }

        // Atomically update participation, reward points, and notify
        const pointsAwarded = part.activity.pointsReward;
        
        await prisma.$transaction(async (tx) => {
          // 1. Update participation status
          await tx.employeeParticipation.update({
            where: { id },
            data: {
              approvalStatus: 'APPROVED',
              pointsEarned: pointsAwarded,
              completionDate: new Date()
            }
          });

          // 2. Award points and XP
          await tx.user.update({
            where: { id: part.userId },
            data: {
              points: { increment: pointsAwarded },
              xp: { increment: pointsAwarded }
            }
          });
        });

        // 3. Dispatch Notification
        await notify({
          userIds: part.userId,
          type: 'CSR',
          title: 'Participation Approved',
          message: `Your ${part.activity.title} participation was approved · +${pointsAwarded} points`,
          link: '/social/employee-participation'
        });

        // 4. Log Activity
        await logActivity('SOCIAL', `${part.user.name} completed '${part.activity.title}'`);

        // 5. Try optional gamification check
        try {
          const reqFunc = typeof __webpack_require__ === 'function' ? __non_webpack_require__ : require;
          const gamification = reqFunc('@/lib/gamification');
          if (gamification && typeof gamification.checkAndAwardBadges === 'function') {
            await gamification.checkAndAwardBadges(part.userId);
          }
        } catch {
          // Gamification check library doesn't exist yet or failed (handled gracefully)
        }

        return NextResponse.json({ message: 'Participation approved and points credited' });
      }

      if (newStatus === 'REJECTED') {
        await prisma.employeeParticipation.update({
          where: { id },
          data: {
            approvalStatus: 'REJECTED',
            pointsEarned: 0
          }
        });

        await notify({
          userIds: part.userId,
          type: 'CSR',
          title: 'Participation Rejected',
          message: `Your ${part.activity.title} participation was rejected. Reason: ${rejectionReason || 'No reason provided'}`,
          link: '/social/employee-participation'
        });

        await logActivity('SOCIAL', `Participation rejected for ${part.user.name} on '${part.activity.title}'`);

        return NextResponse.json({ message: 'Participation rejected' });
      }
    }

    return NextResponse.json({ error: 'No valid action specified' }, { status: 400 });
  } catch (err) {
    console.error('Error updating participation:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export async function PUT(req, ctx) { return PATCH(req, ctx); }

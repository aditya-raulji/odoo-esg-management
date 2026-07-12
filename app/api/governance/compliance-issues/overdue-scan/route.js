import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { notify } from '@/lib/notify';

// GET /api/governance/compliance-issues/overdue-scan
// Flags open overdue issues and sends one-time notifications to owners
export async function GET(req) {
  const { error } = await requireAuth(req);
  if (error) return error;

  try {
    const now = new Date();

    // Find all OPEN issues that are overdue and not yet notified
    const overdueIssues = await prisma.complianceIssue.findMany({
      where: {
        status: 'OPEN',
        dueDate: { lt: now },
        notifiedOverdue: false
      },
      include: { department: true, owner: true }
    });

    if (overdueIssues.length === 0) {
      return NextResponse.json({ message: 'No new overdue issues to notify.', notified: 0 });
    }

    // Send one-time notification per issue owner and mark notifiedOverdue
    let notifiedCount = 0;

    await Promise.all(
      overdueIssues.map(async (issue) => {
        // Notify owner
        await notify({
          userIds: issue.ownerId,
          type: 'COMPLIANCE',
          title: 'Compliance Issue Overdue',
          message: `Issue "${issue.title}" in ${issue.department?.name} is overdue and still OPEN.`,
          link: '/governance/compliance-issues'
        });

        // Mark as notified to avoid spam
        await prisma.complianceIssue.update({
          where: { id: issue.id },
          data: { notifiedOverdue: true }
        });

        notifiedCount++;
      })
    );

    return NextResponse.json({
      message: `Overdue scan complete. ${notifiedCount} owner(s) notified.`,
      notified: notifiedCount,
      issues: overdueIssues.map((i) => ({ id: i.id, title: i.title, dueDate: i.dueDate }))
    });
  } catch (err) {
    console.error('Overdue scan error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

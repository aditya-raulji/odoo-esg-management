import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { notify } from '@/lib/notify';

// POST send reminders to all pending users for a policy
export async function POST(req) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  try {
    const body = await req.json();
    const { policyId } = body;

    if (!policyId) {
      return NextResponse.json({ error: 'Policy ID is required' }, { status: 400 });
    }

    const pId = parseInt(policyId);
    const policy = await prisma.eSGPolicy.findUnique({ where: { id: pId } });
    if (!policy) {
      return NextResponse.json({ error: 'Policy not found' }, { status: 404 });
    }

    // Get all active employees
    const allUsers = await prisma.user.findMany({
      where: { status: 'Active', role: 'EMPLOYEE' },
      select: { id: true }
    });

    // Get users who have already acknowledged
    const acked = await prisma.policyAcknowledgement.findMany({
      where: { policyId: pId },
      select: { userId: true }
    });
    const ackedIds = new Set(acked.map((a) => a.userId));

    const pendingUserIds = allUsers
      .map((u) => u.id)
      .filter((id) => !ackedIds.has(id));

    if (pendingUserIds.length === 0) {
      return NextResponse.json({ message: 'All employees have already acknowledged.', sent: 0 });
    }

    // Send notifications respecting OrgSettings.notifyPolicyReminders
    await notify({
      userIds: pendingUserIds,
      type: 'POLICY',
      title: 'Policy Acknowledgement Reminder',
      message: `Please acknowledge the policy: "${policy.title}" (v${policy.version})`,
      link: '/governance/policies'
    });

    return NextResponse.json({ message: `Reminders sent to ${pendingUserIds.length} employees.`, sent: pendingUserIds.length });
  } catch (err) {
    console.error('Error sending reminders:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

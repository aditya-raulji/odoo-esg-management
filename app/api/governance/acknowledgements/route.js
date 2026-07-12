import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

// GET policy acknowledgements (Auth users)
export async function GET(req) {
  const { error, session } = await requireAuth(req);
  if (error) return error;

  try {
    let data;
    if (session.role === 'ADMIN') {
      data = await prisma.policyAcknowledgement.findMany({
        include: { user: { include: { department: true } }, policy: true },
        orderBy: { acknowledgedAt: 'desc' }
      });
    } else {
      data = await prisma.policyAcknowledgement.findMany({
        where: { userId: session.id },
        include: { user: { include: { department: true } }, policy: true },
        orderBy: { acknowledgedAt: 'desc' }
      });
    }
    return NextResponse.json(data);
  } catch (err) {
    console.error('Error fetching acknowledgements:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST create acknowledgement (Auth employee/admin)
export async function POST(req) {
  const { error, session } = await requireAuth(req);
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

    // Check if already acknowledged
    const existing = await prisma.policyAcknowledgement.findFirst({
      where: { policyId: pId, userId: session.id }
    });

    if (existing) {
      return NextResponse.json({ error: 'Policy already acknowledged' }, { status: 400 });
    }

    const ack = await prisma.policyAcknowledgement.create({
      data: {
        policyId: pId,
        userId: session.id
      },
      include: { policy: true, user: { include: { department: true } } }
    });

    // 100% Department completion check
    const userDeptId = ack.user.departmentId;
    if (userDeptId) {
      const activeDeptUsers = await prisma.user.findMany({
        where: { departmentId: userDeptId, status: 'Active' },
        select: { id: true }
      });

      const ackDeptUsers = await prisma.policyAcknowledgement.findMany({
        where: {
          policyId: pId,
          user: { departmentId: userDeptId, status: 'Active' }
        },
        select: { userId: true }
      });

      if (ackDeptUsers.length >= activeDeptUsers.length) {
        const deptName = ack.user.department?.name || 'Department';
        await logActivity('GOVERNANCE', `${deptName} acknowledged ${policy.title}`);
      }
    }

    return NextResponse.json(ack, { status: 201 });
  } catch (err) {
    console.error('Error creating acknowledgement:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
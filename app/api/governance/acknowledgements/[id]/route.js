import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET per-policy stats: total employees, acknowledged count, pending list
export async function GET(req, { params }) {
  const { error } = await requireAuth(req);
  if (error) return error;

  const id = parseInt(params.id);
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  try {
    const policy = await prisma.eSGPolicy.findUnique({ where: { id } });
    if (!policy) {
      return NextResponse.json({ error: 'Policy not found' }, { status: 404 });
    }

    const totalEmployees = await prisma.user.count({
      where: { status: 'Active', role: 'EMPLOYEE' }
    });

    const acknowledged = await prisma.policyAcknowledgement.findMany({
      where: { policyId: id },
      include: { user: { include: { department: true } } }
    });

    const ackedIds = new Set(acknowledged.map((a) => a.userId));

    const pendingUsers = await prisma.user.findMany({
      where: {
        status: 'Active',
        role: 'EMPLOYEE',
        id: { notIn: [...ackedIds] }
      },
      include: { department: true },
      select: {
        id: true,
        name: true,
        email: true,
        department: { select: { name: true } }
      }
    });

    return NextResponse.json({
      policy,
      totalEmployees,
      acknowledgedCount: acknowledged.length,
      percentage: totalEmployees > 0 ? Math.round((acknowledged.length / totalEmployees) * 100) : 0,
      acknowledgedList: acknowledged.map((a) => ({
        userId: a.userId,
        name: a.user.name,
        email: a.user.email,
        department: a.user.department?.name,
        acknowledgedAt: a.acknowledgedAt
      })),
      pendingList: pendingUsers.map((u) => ({
        userId: u.id,
        name: u.name,
        email: u.email,
        department: u.department?.name
      }))
    });
  } catch (err) {
    console.error('Error fetching policy stats:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

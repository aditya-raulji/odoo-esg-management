import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

// GET all users (Admin only) — for owner dropdowns
export async function GET(req) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  try {
    const users = await prisma.user.findMany({
      where: { status: 'Active' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: { select: { name: true } }
      },
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

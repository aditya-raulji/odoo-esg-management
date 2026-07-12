import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(req) {
  const { error, session } = await requireAuth(req);
  if (error) return error;

  let data;
  if (session.role === 'ADMIN') {
    data = await prisma.employeeParticipation.findMany({
      include: { user: true, activity: true }
    });
  } else {
    data = await prisma.employeeParticipation.findMany({
      where: { userId: session.id },
      include: { user: true, activity: true }
    });
  }
  return NextResponse.json(data);
}
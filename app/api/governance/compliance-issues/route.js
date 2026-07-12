import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(req) {
  const { error, session } = await requireAuth(req);
  if (error) return error;

  let data;
  if (session.role === 'ADMIN') {
    data = await prisma.complianceIssue.findMany({
      include: { department: true, owner: true }
    });
  } else {
    data = await prisma.complianceIssue.findMany({
      where: { ownerId: session.id },
      include: { department: true, owner: true }
    });
  }
  return NextResponse.json(data);
}
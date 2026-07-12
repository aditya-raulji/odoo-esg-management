import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(req) {
  const { error, session } = await requireAuth(req);
  if (error) return error;
  const data = await prisma.notification.findMany({
    where: { userId: session.id },
    orderBy: { createdAt: 'desc' }
  });
  return NextResponse.json(data);
}
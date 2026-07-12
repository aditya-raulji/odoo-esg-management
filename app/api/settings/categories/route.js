import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(req) {
  const { error } = await requireAuth(req);
  if (error) return error;
  const data = await prisma.category.findMany();
  return NextResponse.json(data);
}
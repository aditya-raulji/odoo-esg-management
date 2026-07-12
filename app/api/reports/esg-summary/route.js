import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(req) {
  const { error } = await requireAuth(req);
  if (error) return error;

  const scores = await prisma.departmentScore.findMany({
    where: { period: '2026-07' },
    include: { department: true }
  });

  const data = scores.map(s => ({
    departmentName: s.department.name,
    env: s.envScore,
    social: s.socialScore,
    gov: s.govScore,
    total: s.totalScore
  }));

  return NextResponse.json(data);
}
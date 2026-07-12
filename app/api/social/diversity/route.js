import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(req) {
  const { error } = await requireAuth(req);
  if (error) return error;

  const users = await prisma.user.findMany();
  
  const gendersMap = {};
  const rolesMap = {};

  users.forEach(u => {
    gendersMap[u.gender] = (gendersMap[u.gender] || 0) + 1;
    rolesMap[u.role] = (rolesMap[u.role] || 0) + 1;
  });

  return NextResponse.json({
    genders: Object.entries(gendersMap).map(([name, value]) => ({ name, value })),
    roles: Object.entries(rolesMap).map(([name, value]) => ({ name, value }))
  });
}
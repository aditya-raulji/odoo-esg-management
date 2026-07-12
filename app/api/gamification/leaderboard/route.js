import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(req) {
  const { error } = await requireAuth(req);
  if (error) return error;

  try {
    // All active users with department
    const users = await prisma.user.findMany({
      where: { status: 'Active' },
      orderBy: { xp: 'desc' },
      include: { department: { select: { id: true, name: true } } },
      select: { id: true, name: true, xp: true, points: true, department: true }
    });

    // Employee leaderboard
    const employeeBoard = users.map((u, i) => ({
      rank: i + 1,
      id: u.id,
      name: u.name,
      department: u.department?.name || '—',
      xp: u.xp,
      points: u.points,
      type: 'employee'
    }));

    // Department leaderboard — sum XP per dept
    const deptMap = {};
    users.forEach((u) => {
      const dName = u.department?.name || 'Unknown';
      if (!deptMap[dName]) deptMap[dName] = { xp: 0, points: 0 };
      deptMap[dName].xp += u.xp;
      deptMap[dName].points += u.points;
    });

    const deptBoard = Object.entries(deptMap)
      .map(([name, totals]) => ({ name, ...totals, type: 'department' }))
      .sort((a, b) => b.xp - a.xp)
      .map((d, i) => ({ rank: i + 1, ...d }));

    // Combined board — interleave sorted by XP descending
    const combined = [
      ...employeeBoard.map((e) => ({ ...e, displayName: e.name, label: e.department })),
      ...deptBoard.map((d) => ({ ...d, id: `dept-${d.name}`, name: d.name, displayName: `${d.name} Dept`, label: 'Department' }))
    ]
      .sort((a, b) => b.xp - a.xp)
      .map((item, i) => ({ ...item, rank: i + 1 }));

    return NextResponse.json({ employeeBoard, deptBoard, combined });
  } catch (err) {
    console.error('Error fetching leaderboard:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
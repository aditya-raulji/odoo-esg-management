import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

// POST /api/environmental/goals/recompute-all
// Bulk recompute all goals from carbon transactions
export async function POST(req) {
  const { error } = await requireAuth(req);
  if (error) return error;

  try {
    const goals = await prisma.environmentalGoal.findMany({
      include: { department: true },
    });

    const results = await Promise.all(
      goals.map(async (goal) => {
        const year = new Date(goal.deadline).getFullYear();
        const yearStart = new Date(year, 0, 1);
        const yearEnd = new Date(year + 1, 0, 1);

        const txs = await prisma.carbonTransaction.findMany({
          where: {
            departmentId: goal.departmentId,
            date: { gte: yearStart, lt: yearEnd },
          },
          select: { co2Amount: true },
        });

        const totalKg = txs.reduce((s, t) => s + t.co2Amount, 0);
        const currentCO2Tonnes = parseFloat((totalKg / 1000).toFixed(4));

        let status = goal.status;
        if (currentCO2Tonnes >= goal.targetCO2) {
          status = 'COMPLETED';
        } else if (currentCO2Tonnes > 0) {
          status = 'ON_TRACK';
        }

        return prisma.environmentalGoal.update({
          where: { id: goal.id },
          data: { currentCO2: currentCO2Tonnes, status },
        });
      })
    );

    await logActivity('CARBON', `Bulk goal recompute — ${results.length} goals updated from carbon transactions`);

    return NextResponse.json({ updated: results.length });
  } catch (err) {
    console.error('Error bulk recomputing goals:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

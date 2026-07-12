import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

// POST /api/environmental/goals/[id]/recompute
// Recompute currentCO2 from sum of CarbonTransactions for that dept within the goal year
export async function POST(req, { params }) {
  const { error } = await requireAuth(req);
  if (error) return error;

  const id = parseInt(params.id);
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  try {
    const goal = await prisma.environmentalGoal.findUnique({
      where: { id },
      include: { department: true },
    });
    if (!goal) return NextResponse.json({ error: 'Goal not found' }, { status: 404 });

    // Sum CO2 from transactions for this dept in the goal's deadline year
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
    // targetCO2 is stored in tonnes — convert kg → tonnes
    const currentCO2Tonnes = parseFloat((totalKg / 1000).toFixed(4));

    // Suggest status: ON_TRACK if currentCO2 < targetCO2, COMPLETED if ≥, keep ACTIVE if goal year is future
    let status = goal.status;
    if (currentCO2Tonnes >= goal.targetCO2) {
      status = 'COMPLETED';
    } else if (currentCO2Tonnes > 0) {
      status = 'ON_TRACK';
    }

    const updated = await prisma.environmentalGoal.update({
      where: { id },
      data: { currentCO2: currentCO2Tonnes, status },
      include: { department: true },
    });

    await logActivity('CARBON', `Goal "${goal.name}" recomputed — ${currentCO2Tonnes} t CO₂ (${goal.department.name})`);

    return NextResponse.json({ goal: updated, currentCO2Tonnes, txCount: txs.length });
  } catch (err) {
    console.error('Error recomputing goal:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

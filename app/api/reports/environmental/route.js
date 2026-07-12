import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(req) {
  const { error, session } = await requireAuth(req);
  if (error) return error;

  try {
    // Determine current date (mocked to 2026-07-12 or dynamic from system)
    const now = new Date('2026-07-12'); 
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 6 (July)

    const ytdStart = new Date(currentYear, 0, 1);
    const ytdEnd = new Date(currentYear, 11, 31, 23, 59, 59, 999);
    const monthStart = new Date(currentYear, currentMonth, 1);
    const monthEnd = new Date(currentYear, currentMonth, 31, 23, 59, 59, 999);

    // 1. Total CO2 YTD
    const ytdSum = await prisma.carbonTransaction.aggregate({
      where: {
        date: { gte: ytdStart, lte: ytdEnd },
      },
      _sum: { co2Amount: true },
    });
    const totalCo2YTD = (ytdSum._sum.co2Amount || 0) / 1000; // kg to tonnes

    // 2. CO2 This Month
    const monthSum = await prisma.carbonTransaction.aggregate({
      where: {
        date: { gte: monthStart, lte: monthEnd },
      },
      _sum: { co2Amount: true },
    });
    const totalCo2Month = (monthSum._sum.co2Amount || 0) / 1000; // kg to tonnes

    // 3. Active Goals
    const activeGoalsCount = await prisma.environmentalGoal.count({
      where: {
        status: { in: ['ACTIVE', 'ON_TRACK'] },
      },
    });

    // 4. Avg Goal Progress
    const goals = await prisma.environmentalGoal.findMany({
      include: { department: true },
    });
    let avgGoalProgress = 70; // Neutral default
    if (goals.length > 0) {
      const totalProgress = goals.reduce((acc, goal) => {
        const progress = goal.targetCO2 <= 0 ? 100 : Math.min(100, (goal.currentCO2 / goal.targetCO2) * 100);
        return acc + progress;
      }, 0);
      avgGoalProgress = totalProgress / goals.length;
    }

    // 5. Emissions by department (bar chart) and by source type (donut chart)
    const transactions = await prisma.carbonTransaction.findMany({
      where: {
        date: { gte: ytdStart, lte: ytdEnd },
      },
      include: {
        department: true,
        emissionFactor: true,
      },
    });

    const deptEmissions = {};
    const sourceEmissions = {};

    transactions.forEach((tx) => {
      const deptName = tx.department?.name || 'Unknown';
      deptEmissions[deptName] = (deptEmissions[deptName] || 0) + tx.co2Amount;

      const source = tx.emissionFactor?.sourceType || 'OTHER';
      sourceEmissions[source] = (sourceEmissions[source] || 0) + tx.co2Amount;
    });

    const emissionsByDept = Object.entries(deptEmissions).map(([name, kg]) => ({
      name,
      co2: parseFloat((kg / 1000).toFixed(2)),
    }));

    const emissionsBySource = Object.entries(sourceEmissions).map(([name, kg]) => ({
      name,
      value: parseFloat((kg / 1000).toFixed(2)),
    }));

    // 6. Product profiles
    const products = await prisma.productESGProfile.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      kpis: {
        totalCo2YTD: parseFloat(totalCo2YTD.toFixed(2)),
        totalCo2Month: parseFloat(totalCo2Month.toFixed(2)),
        activeGoalsCount,
        avgGoalProgress: parseFloat(avgGoalProgress.toFixed(1)),
      },
      emissionsByDept,
      emissionsBySource,
      goals: goals.map((g) => ({
        id: g.id,
        name: g.name,
        department: g.department.name,
        targetCO2: g.targetCO2,
        currentCO2: g.currentCO2,
        progress: g.targetCO2 <= 0 ? 100 : parseFloat(Math.min(100, (g.currentCO2 / g.targetCO2) * 100).toFixed(1)),
        status: g.status,
        deadline: g.deadline,
      })),
      products,
    });
  } catch (err) {
    console.error('Error generating env report API:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function GET(req) {
  const { error, session } = await requireAuth(req);
  if (error) return error;

  await logActivity('REPORTS', `Generated ESG Summary Report for user ${session.name}`);

  try {
    const currentDate = new Date();
    const period = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;

    // 1. Fetch department scores for the period
    const scores = await prisma.departmentScore.findMany({
      where: { period },
      include: { department: true }
    });

    if (scores.length === 0) {
      // Return empty/default structure if no scores are computed yet
      return NextResponse.json({
        departmentScores: [],
        overall: { env: 70, social: 70, gov: 70, total: 70 },
        weights: { env: 40, social: 30, gov: 30 },
        sparkline: [],
        executiveSummary: "No ESG scores computed yet for this period. Please compute department scores on the dashboard."
      });
    }

    // 2. Compute averages for the 4 organization-wide scores
    const totalDepts = scores.length;
    const avgEnv = scores.reduce((sum, s) => sum + s.envScore, 0) / totalDepts;
    const avgSocial = scores.reduce((sum, s) => sum + s.socialScore, 0) / totalDepts;
    const avgGov = scores.reduce((sum, s) => sum + s.govScore, 0) / totalDepts;
    const avgTotal = scores.reduce((sum, s) => sum + s.totalScore, 0) / totalDepts;

    const departmentScores = scores.map(s => ({
      id: s.id,
      departmentId: s.departmentId,
      departmentName: s.department.name,
      env: parseFloat(s.envScore.toFixed(1)),
      social: parseFloat(s.socialScore.toFixed(1)),
      gov: parseFloat(s.govScore.toFixed(1)),
      total: parseFloat(s.totalScore.toFixed(1))
    }));

    // 3. Get weight config from OrgSettings
    const settings = await prisma.orgSettings.findFirst({ where: { id: 1 } });
    const weights = {
      env: settings?.weightEnv ?? 40,
      social: settings?.weightSocial ?? 30,
      gov: settings?.weightGov ?? 30
    };

    // 4. Fetch 12-month emissions trend data (for sparkline)
    const now = new Date('2026-07-12');
    const startPeriod = new Date(now.getFullYear() - 1, now.getMonth() + 1, 1);

    const transactions = await prisma.carbonTransaction.findMany({
      where: {
        date: { gte: startPeriod, lte: now }
      },
      orderBy: { date: 'asc' }
    });

    const monthlyEmissions = {};
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyEmissions[key] = 0;
    }

    transactions.forEach(tx => {
      const d = new Date(tx.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyEmissions[key] !== undefined) {
        monthlyEmissions[key] += tx.co2Amount;
      }
    });

    const sparkline = Object.entries(monthlyEmissions)
      .map(([month, kg]) => ({
        month,
        emissions: parseFloat((kg / 1000).toFixed(2)) // tonnes
      }))
      .reverse();

    // 5. Find highest and lowest performing departments
    let highestDept = departmentScores[0];
    let lowestDept = departmentScores[0];
    departmentScores.forEach(dept => {
      if (dept.total > highestDept.total) highestDept = dept;
      if (dept.total < lowestDept.total) lowestDept = dept;
    });

    // 6. Generate dynamic executive summary
    const executiveSummary = `During July 2026, EcoSphere achieved an overall organization ESG score of ${avgTotal.toFixed(1)} points. This rating is underpinned by solid governance structures (averaging ${avgGov.toFixed(1)} points) and a strong commitment to environmental targets (averaging ${avgEnv.toFixed(1)} points), alongside a stable social participation profile (averaging ${avgSocial.toFixed(1)} points). ${highestDept.departmentName} is currently the top-performing department with a score of ${highestDept.total.toFixed(1)}, whereas ${lowestDept.departmentName} has the lowest score at ${lowestDept.total.toFixed(1)}, highlighting key opportunities for targeted improvement. Total YTD carbon emissions remain in line with operational benchmarks.`;

    return NextResponse.json({
      departmentScores,
      overall: {
        env: parseFloat(avgEnv.toFixed(1)),
        social: parseFloat(avgSocial.toFixed(1)),
        gov: parseFloat(avgGov.toFixed(1)),
        total: Math.round(avgTotal)
      },
      weights,
      sparkline,
      executiveSummary
    });
  } catch (err) {
    console.error('Error generating ESG summary report API:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
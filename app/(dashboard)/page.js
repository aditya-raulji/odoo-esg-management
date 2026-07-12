// app/(dashboard)/page.js
// Dashboard overview — shows ESG KPIs, charts, activity feed

import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import DashboardClient from './DashboardClient';

export default async function DashboardPage() {
  const session = await getSession();

  let data = {
    orgScores: { env: 0, social: 0, gov: 0, overall: 0 },
    activeGoals: 0,
    openIssues: 0,
    activeChallenges: 0,
    recentActivity: [],
    carbonTrend: [],
    topUsers: [],
    departmentScores: [],
  };

  try {
    // Org ESG scores for current period
    const scores = await prisma.departmentScore.findMany({
      where: { period: '2026-07' },
    });

    if (scores.length > 0) {
      const avg = (field) =>
        parseFloat((scores.reduce((s, r) => s + r[field], 0) / scores.length).toFixed(1));
      const env = avg('envScore');
      const social = avg('socialScore');
      const gov = avg('govScore');
      const overall = parseFloat((env * 0.4 + social * 0.3 + gov * 0.3).toFixed(1));
      data.orgScores = { env, social, gov, overall };
    }

    // Active goals count
    data.activeGoals = await prisma.environmentalGoal.count({
      where: { status: { in: ['ACTIVE', 'ON_TRACK'] } },
    });

    // Open compliance issues
    data.openIssues = await prisma.complianceIssue.count({
      where: { status: 'OPEN' },
    });

    // Active challenges
    data.activeChallenges = await prisma.challenge.count({
      where: { status: 'ACTIVE' },
    });

    // Recent activity logs
    const logs = await prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    data.recentActivity = logs.map((l) => ({
      ...l,
      createdAt: l.createdAt.toISOString(),
    }));

    // Carbon trend (last 6 months monthly totals)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const txs = await prisma.carbonTransaction.findMany({
      where: { date: { gte: sixMonthsAgo } },
      select: { co2Amount: true, date: true },
    });

    const monthMap = {};
    txs.forEach((t) => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthMap[key] = (monthMap[key] || 0) + t.co2Amount;
    });
    data.carbonTrend = Object.entries(monthMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, total]) => ({
        month,
        total: parseFloat(total.toFixed(1)),
      }));

    // Top 3 users by XP
    const topUsers = await prisma.user.findMany({
      orderBy: { xp: 'desc' },
      take: 5,
      include: { department: { select: { name: true } } },
    });
    data.topUsers = topUsers.map((u) => ({
      id: u.id,
      name: u.name,
      department: u.department.name,
      xp: u.xp,
      points: u.points,
    }));

    // Department scores
    data.departmentScores = scores.map((s) => ({
      id: s.id,
      departmentId: s.departmentId,
      period: s.period,
      envScore: s.envScore,
      socialScore: s.socialScore,
      govScore: s.govScore,
      totalScore: s.totalScore,
    }));
  } catch (e) {
    console.error('Dashboard data error:', e);
  }

  return <DashboardClient session={session} data={data} />;
}

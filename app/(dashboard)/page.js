// app/(dashboard)/page.js
// Dashboard overview — shows ESG KPIs, charts, activity feed

import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import DashboardClient from './DashboardClient';
import { recomputeScores } from '@/lib/scoring';

export default async function DashboardPage() {
  const session = await getSession();

  let data = {
    orgScores: { env: 0, social: 0, gov: 0, overall: 0, envTrend: 'neutral', socialTrend: 'neutral', govTrend: 'neutral', overallTrend: 'neutral' },
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
    let scores = await prisma.departmentScore.findMany({
      where: { period: '2026-07' },
      include: { department: true }
    });

    if (scores.length === 0) {
      // Auto-recompute on load if current period has no rows
      await recomputeScores('2026-07');
      scores = await prisma.departmentScore.findMany({
        where: { period: '2026-07' },
        include: { department: true }
      });
    }

    // Previous period for trend arrows
    const prevScores = await prisma.departmentScore.findMany({
      where: { period: '2026-06' },
    });

    // Fetch settings for weights
    let settings = await prisma.orgSettings.findFirst({ where: { id: 1 } });
    if (!settings) {
      settings = { weightEnv: 40, weightSocial: 30, weightGov: 30 };
    }
    const wEnv = settings.weightEnv;
    const wSoc = settings.weightSocial;
    const wGov = settings.weightGov;

    const avg = (arr, field) =>
      arr.length > 0
        ? parseFloat((arr.reduce((s, r) => s + r[field], 0) / arr.length).toFixed(1))
        : 70; // default neutral if no data

    const env = avg(scores, 'envScore');
    const social = avg(scores, 'socialScore');
    const gov = avg(scores, 'govScore');
    const overall = parseFloat(((env * wEnv + social * wSoc + gov * wGov) / 100).toFixed(1));

    const prevEnv = prevScores.length > 0 ? avg(prevScores, 'envScore') : env;
    const prevSocial = prevScores.length > 0 ? avg(prevScores, 'socialScore') : social;
    const prevGov = prevScores.length > 0 ? avg(prevScores, 'govScore') : gov;
    const prevOverall = prevScores.length > 0 ? parseFloat(((prevEnv * wEnv + prevSocial * wSoc + prevGov * wGov) / 100).toFixed(1)) : overall;

    const getTrend = (curr, prev) => {
      if (curr > prev) return 'up';
      if (curr < prev) return 'down';
      return 'neutral';
    };

    data.orgScores = {
      env,
      social,
      gov,
      overall,
      envTrend: getTrend(env, prevEnv),
      socialTrend: getTrend(social, prevSocial),
      govTrend: getTrend(gov, prevGov),
      overallTrend: getTrend(overall, prevOverall),
    };


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

    // Carbon trend (last 12 months monthly totals)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    const txs = await prisma.carbonTransaction.findMany({
      where: { date: { gte: twelveMonthsAgo } },
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
      deptName: s.department?.name || 'Unknown',
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

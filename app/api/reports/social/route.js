import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function GET(req) {
  const { error, session } = await requireAuth(req);
  if (error) return error;

  await logActivity('REPORTS', `Generated Social Report for user ${session.name}`);

  try {
    const now = new Date('2026-07-12');
    const socialStart = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    // Active employees count
    const totalEmployees = await prisma.user.count({
      where: { status: 'Active' },
    });

    // Approved participations in last 90 days
    const approvedPartsLast90 = await prisma.employeeParticipation.count({
      where: {
        approvalStatus: 'APPROVED',
        OR: [
          { completionDate: { gte: socialStart, lte: now } },
          { completionDate: null, createdAt: { gte: socialStart, lte: now } }
        ]
      }
    });

    const participationRate = totalEmployees > 0 ? (approvedPartsLast90 / totalEmployees) * 100 : 70;

    // Total approved activities
    const totalApprovedCount = await prisma.employeeParticipation.count({
      where: { approvalStatus: 'APPROVED' }
    });

    // Training Completion Rate
    const trainingParts = await prisma.employeeParticipation.findMany({
      where: { approvalStatus: 'APPROVED' },
      include: {
        activity: {
          include: { category: true }
        }
      }
    });
    const approvedTrainingCount = trainingParts.filter(
      (p) => p.activity?.category?.name?.toLowerCase() === 'training'
    ).length;
    
    const trainingCompletion = totalEmployees > 0 ? (approvedTrainingCount / totalEmployees) * 100 : 70;

    // CSR activities table data
    const activities = await prisma.cSRActivity.findMany({
      include: {
        category: true,
        participations: true
      },
      orderBy: { date: 'desc' }
    });

    const activityStats = activities.map(act => {
      const joined = act.participations.length;
      const approved = act.participations.filter(p => p.approvalStatus === 'APPROVED').length;
      return {
        id: act.id,
        title: act.title,
        category: act.category.name,
        date: act.date,
        pointsReward: act.pointsReward,
        joined,
        approved,
        status: act.status
      };
    });

    // Diversity: Gender breakdown
    const users = await prisma.user.findMany({
      where: { status: 'Active' }
    });

    const genderCounts = {};
    users.forEach(u => {
      const g = u.gender || 'OTHER';
      genderCounts[g] = (genderCounts[g] || 0) + 1;
    });

    const diversityData = Object.entries(genderCounts).map(([name, value]) => ({
      name,
      value
    }));

    return NextResponse.json({
      kpis: {
        participationRate: parseFloat(participationRate.toFixed(1)),
        totalApprovedCount,
        trainingCompletion: parseFloat(trainingCompletion.toFixed(1)),
        totalEmployees
      },
      activities: activityStats,
      diversity: diversityData
    });
  } catch (err) {
    console.error('Error generating social report API:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

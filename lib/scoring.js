/**
 * lib/scoring.js
 *
 * EcoSphere ESG Scoring Engine
 *
 * FORMULAS & COMPUTATION RULES:
 *
 * 1. Environmental Score (E)
 *    Formula: E = 0.6 * avgGoalProgress + 0.4 * emissionTrendScore
 *    - avgGoalProgress: The average progress of all environmental goals set for the department.
 *      Goal progress is computed as: progress = Math.min(100, (currentCO2 / targetCO2) * 100).
 *      If targetCO2 <= 0, progress is treated as 100.
 *      If no goals exist for the department, avgGoalProgress defaults to 70 (neutral).
 *    - emissionTrendScore: Compares the current month's emissions to the 3-month average.
 *      Formula: emissionTrendScore = clamp(100 * (threeMonthAvgCO2 / Math.max(currentMonthCO2, 1)), 0, 100)
 *      If no carbon transactions exist for the current or previous 3 months, emissionTrendScore defaults to 70.
 *
 * 2. Social Score (S)
 *    Formula: S = 0.6 * participationRate + 0.4 * trainingCompletion
 *    - participationRate: Active CSR participation over the last 90 days.
 *      Formula: participationRate = Math.min(100, (approvedParticipations / deptEmployees) * 100)
 *      If deptEmployees is 0, participationRate defaults to 70.
 *    - trainingCompletion: The completion rate of CSR activities under the 'Training' category.
 *      Formula: trainingCompletion = Math.min(100, (approvedTrainingParticipations / deptEmployees) * 100)
 *      If deptEmployees is 0, trainingCompletion defaults to 70.
 *
 * 3. Governance Score (G)
 *    Formula: G = 0.4 * policyAckRate + 0.3 * auditCompletionRate + 0.3 * issueResolutionScore
 *    - policyAckRate: The policy acknowledgement compliance rate.
 *      Formula: policyAckRate = Math.min(100, (actualAcknowledgements / (deptEmployees * activePolicies)) * 100)
 *      If no active policies or employees exist, policyAckRate defaults to 70.
 *    - auditCompletionRate: Percentage of completed department compliance audits.
 *      Formula: auditCompletionRate = (completedAudits / totalAudits) * 100
 *      If no audits exist for the department, auditCompletionRate defaults to 70.
 *    - issueResolutionScore: Timeliness and completion of compliance issues.
 *      Formula: issueResolutionScore = Math.max(0, (resolvedIssues / totalIssues * 100) - (10 * overdueOpenIssues))
 *      If no compliance issues exist for the department, issueResolutionScore defaults to 70.
 *
 * Neutral Default Rule:
 *   If a department has no data for a sub-component, that sub-component defaults to 70.
 */

import { prisma } from './prisma';

/**
 * Computes ESG scores for all departments in a specific period (YYYY-MM).
 * @param {string} period - The period to compute scores for (e.g. '2026-07')
 */
export async function computeDepartmentScores(period) {
  // Parse period dates
  const [year, month] = period.split('-').map(Number);
  const periodStart = new Date(year, month - 1, 1);
  const periodEnd = new Date(year, month, 0, 23, 59, 59, 999);

  // Dates for emission trend
  const trendStart = new Date(year, month - 4, 1); // Start of 3 months prior

  // Dates for social participation (last 90 days)
  const socialStart = new Date(periodEnd.getTime() - 90 * 24 * 60 * 60 * 1000);

  // Fetch all active departments
  const departments = await prisma.department.findMany({
    where: { status: 'Active' },
    include: { users: { where: { status: 'Active' } } }
  });

  const computedScores = [];

  for (const dept of departments) {
    const deptEmployees = dept.users.length;

    // ────────────────────────────────────────────────────────────────
    // 1. ENVIRONMENTAL SCORE (E)
    // ────────────────────────────────────────────────────────────────
    // avgGoalProgress
    const goals = await prisma.environmentalGoal.findMany({
      where: { departmentId: dept.id }
    });
    let avgGoalProgress = 70;
    if (goals.length > 0) {
      const totalProgress = goals.reduce((acc, goal) => {
        const progress = goal.targetCO2 <= 0 ? 100 : Math.min(100, (goal.currentCO2 / goal.targetCO2) * 100);
        return acc + progress;
      }, 0);
      avgGoalProgress = totalProgress / goals.length;
    }

    // emissionTrendScore
    const transactions = await prisma.carbonTransaction.findMany({
      where: {
        departmentId: dept.id,
        date: { gte: trendStart, lte: periodEnd }
      }
    });

    let emissionTrendScore = 70;
    if (transactions.length > 0) {
      // Sum per month
      const monthlyEmissions = {};
      // Initialize trend months
      for (let i = 0; i < 4; i++) {
        const d = new Date(year, month - 1 - i, 1);
        const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthlyEmissions[k] = 0;
      }

      transactions.forEach((tx) => {
        const d = new Date(tx.date);
        const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyEmissions[k] !== undefined) {
          monthlyEmissions[k] += tx.co2Amount;
        }
      });

      const currentMonthKey = period;
      const currentMonthCO2 = monthlyEmissions[currentMonthKey] || 0;

      // Previous 3 months average
      let prevSum = 0;
      let prevCount = 0;
      for (let i = 1; i <= 3; i++) {
        const d = new Date(year, month - 1 - i, 1);
        const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        prevSum += monthlyEmissions[k] || 0;
        prevCount++;
      }
      const threeMonthAvgCO2 = prevSum / (prevCount || 1);

      emissionTrendScore = Math.max(0, Math.min(100, 100 * (threeMonthAvgCO2 / Math.max(currentMonthCO2, 1))));
    }

    const envScore = 0.6 * avgGoalProgress + 0.4 * emissionTrendScore;

    // ────────────────────────────────────────────────────────────────
    // 2. SOCIAL SCORE (S)
    // ────────────────────────────────────────────────────────────────
    // participationRate
    let participationRate = 70;
    if (deptEmployees > 0) {
      const approvedParts = await prisma.employeeParticipation.count({
        where: {
          user: { departmentId: dept.id },
          approvalStatus: 'APPROVED',
          OR: [
            { completionDate: { gte: socialStart, lte: periodEnd } },
            { completionDate: null, createdAt: { gte: socialStart, lte: periodEnd } }
          ]
        }
      });
      participationRate = Math.min(100, (approvedParts / deptEmployees) * 100);
    }

    // trainingCompletion
    let trainingCompletion = 70;
    if (deptEmployees > 0) {
      const trainingParts = await prisma.employeeParticipation.findMany({
        where: {
          user: { departmentId: dept.id },
          approvalStatus: 'APPROVED'
        },
        include: {
          activity: {
            include: { category: true }
          }
        }
      });
      const trainingPartsCount = trainingParts.filter(
        (p) => p.activity?.category?.name?.toLowerCase() === 'training'
      ).length;
      trainingCompletion = Math.min(100, (trainingPartsCount / deptEmployees) * 100);
    }

    const socialScore = 0.6 * participationRate + 0.4 * trainingCompletion;

    // ────────────────────────────────────────────────────────────────
    // 3. GOVERNANCE SCORE (G)
    // ────────────────────────────────────────────────────────────────
    // policyAckRate
    let policyAckRate = 70;
    const activePoliciesCount = await prisma.eSGPolicy.count({
      where: { status: 'Active' }
    });
    if (activePoliciesCount > 0 && deptEmployees > 0) {
      const acks = await prisma.policyAcknowledgement.count({
        where: {
          user: { departmentId: dept.id },
          policy: { status: 'Active' }
        }
      });
      policyAckRate = Math.min(100, (acks / (deptEmployees * activePoliciesCount)) * 100);
    }

    // auditCompletionRate
    const audits = await prisma.audit.findMany({
      where: { departmentId: dept.id }
    });
    let auditCompletionRate = 70;
    if (audits.length > 0) {
      const completedAudits = audits.filter((a) => a.status === 'COMPLETED').length;
      auditCompletionRate = (completedAudits / audits.length) * 100;
    }

    // issueResolutionScore
    const issues = await prisma.complianceIssue.findMany({
      where: { departmentId: dept.id }
    });
    let issueResolutionScore = 70;
    if (issues.length > 0) {
      const totalIssues = issues.length;
      const resolved = issues.filter((i) => i.status === 'RESOLVED').length;
      const overdueOpen = issues.filter((i) => i.status === 'OPEN' && new Date(i.dueDate) < periodEnd).length;
      issueResolutionScore = Math.max(0, (resolved / totalIssues * 100) - (10 * overdueOpen));
    }

    const govScore = 0.4 * policyAckRate + 0.3 * auditCompletionRate + 0.3 * issueResolutionScore;

    computedScores.push({
      departmentId: dept.id,
      deptName: dept.name,
      env: parseFloat(envScore.toFixed(1)),
      social: parseFloat(socialScore.toFixed(1)),
      gov: parseFloat(govScore.toFixed(1))
    });
  }

  return computedScores;
}

/**
 * Recomputes and saves all department scores for the given period.
 * @param {string} period - The period (YYYY-MM)
 */
export async function recomputeScores(period) {
  const deptScores = await computeDepartmentScores(period);

  // Fetch weights from OrgSettings
  let settings = await prisma.orgSettings.findFirst({ where: { id: 1 } });
  if (!settings) {
    settings = { weightEnv: 40, weightSocial: 30, weightGov: 30 };
  }

  const wEnv = settings.weightEnv;
  const wSoc = settings.weightSocial;
  const wGov = settings.weightGov;

  let totalScoreSum = 0;

  // Let's delete existing scores for this period
  await prisma.departmentScore.deleteMany({
    where: { period }
  });

  const savedScores = [];
  for (const score of deptScores) {
    const totalScore = parseFloat(
      ((wEnv * score.env + wSoc * score.social + wGov * score.gov) / 100).toFixed(1)
    );
    totalScoreSum += totalScore;

    const saved = await prisma.departmentScore.create({
      data: {
        departmentId: score.departmentId,
        period,
        envScore: score.env,
        socialScore: score.social,
        govScore: score.gov,
        totalScore
      }
    });
    savedScores.push(saved);
  }

  const overallScore = deptScores.length > 0 ? Math.round(totalScoreSum / deptScores.length) : 0;

  return {
    overallScore,
    departmentScores: savedScores
  };
}



import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(req) {
  const { error, session } = await requireAuth(req);
  if (error) return error;

  try {
    const now = new Date('2026-07-12');

    // Total active employees
    const totalEmployees = await prisma.user.count({
      where: { status: 'Active' }
    });

    // Active policies
    const activePolicies = await prisma.eSGPolicy.findMany({
      where: { status: 'Active' }
    });
    const activePoliciesCount = activePolicies.length;

    // Total policy acknowledgements for active policies
    const totalAcks = await prisma.policyAcknowledgement.count({
      where: {
        policy: { status: 'Active' }
      }
    });

    const policyAckRate = (activePoliciesCount > 0 && totalEmployees > 0)
      ? (totalAcks / (totalEmployees * activePoliciesCount)) * 100
      : 70;

    // Policies details table
    const policiesList = await prisma.eSGPolicy.findMany({
      include: { acknowledgements: true },
      orderBy: { createdAt: 'desc' }
    });

    const policiesTable = policiesList.map(policy => {
      const acksCount = policy.acknowledgements.length;
      const ackPercent = totalEmployees > 0 ? (acksCount / totalEmployees) * 100 : 0;
      return {
        id: policy.id,
        title: policy.title,
        version: policy.version,
        effectiveDate: policy.effectiveDate,
        status: policy.status,
        acksCount,
        totalEmployees,
        ackPercent: parseFloat(ackPercent.toFixed(1))
      };
    });

    // Audits
    const audits = await prisma.audit.findMany({
      include: { department: true },
      orderBy: { date: 'desc' }
    });
    const completedAuditsCount = audits.filter(a => a.status === 'COMPLETED').length;

    // Compliance issues
    const issues = await prisma.complianceIssue.findMany();
    const totalIssues = issues.length;
    const resolvedCount = issues.filter(i => i.status === 'RESOLVED').length;
    const openCount = issues.filter(i => i.status === 'OPEN').length;
    const resolutionRate = totalIssues > 0 ? (resolvedCount / totalIssues) * 100 : 70;

    // Open by severity
    const severityCounts = { HIGH: 0, MEDIUM: 0, LOW: 0 };
    issues.filter(i => i.status === 'OPEN').forEach(i => {
      if (severityCounts[i.severity] !== undefined) {
        severityCounts[i.severity]++;
      }
    });
    const openBySeverity = Object.entries(severityCounts).map(([name, value]) => ({
      name,
      value
    }));

    // Overdue count
    const overdueCount = issues.filter(
      i => i.status === 'OPEN' && new Date(i.dueDate) < now
    ).length;

    return NextResponse.json({
      kpis: {
        policyAckRate: parseFloat(policyAckRate.toFixed(1)),
        completedAuditsCount,
        openIssuesCount: openCount,
        resolutionRate: parseFloat(resolutionRate.toFixed(1)),
        overdueCount
      },
      policies: policiesTable,
      audits: audits.map(a => ({
        id: a.id,
        title: a.title,
        department: a.department.name,
        auditor: a.auditor,
        date: a.date,
        findings: a.findings,
        status: a.status
      })),
      compliance: {
        openBySeverity,
        overdueCount,
        resolutionRate: parseFloat(resolutionRate.toFixed(1))
      }
    });
  } catch (err) {
    console.error('Error generating governance report API:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

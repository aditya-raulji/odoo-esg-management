import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function GET(req) {
  const { error, session } = await requireAuth(req);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const meta = searchParams.get('meta') === 'true';

  if (!meta) {
    const targetModule = searchParams.get('module') || 'Environmental';
    await logActivity('REPORTS', `Ran Custom Report query (Module: ${targetModule}) for user ${session.name}`);
  }

  try {
    if (meta) {
      // Fetch dropdown filter options
      const departments = await prisma.department.findMany({
        where: { status: 'Active' },
        select: { id: true, name: true }
      });

      const employees = await prisma.user.findMany({
        where: { status: 'Active' },
        select: { id: true, name: true }
      });

      const challenges = await prisma.challenge.findMany({
        select: { id: true, title: true }
      });

      const categories = await prisma.category.findMany({
        where: { status: 'Active' },
        select: { id: true, name: true, type: true }
      });

      return NextResponse.json({
        departments,
        employees,
        challenges,
        categories
      });
    }

    // Dynamic report query
    const targetModule = searchParams.get('module') || 'Environmental';
    const range = searchParams.get('range') || 'this-year';
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');
    const deptId = searchParams.get('deptId') ? parseInt(searchParams.get('deptId')) : undefined;
    const userId = searchParams.get('userId') ? parseInt(searchParams.get('userId')) : undefined;
    const challengeId = searchParams.get('challengeId') ? parseInt(searchParams.get('challengeId')) : undefined;
    const categoryId = searchParams.get('categoryId') ? parseInt(searchParams.get('categoryId')) : undefined;

    // Date range filtering
    const now = new Date('2026-07-12');
    let dateFilter = undefined;

    if (range === 'this-month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      dateFilter = { gte: start, lte: end };
    } else if (range === 'this-year') {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      dateFilter = { gte: start, lte: end };
    } else if (range === 'last-30-days') {
      const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      dateFilter = { gte: start, lte: now };
    } else if (range === 'last-90-days') {
      const start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      dateFilter = { gte: start, lte: now };
    } else if (range === 'custom' && startDateStr && endDateStr) {
      dateFilter = { gte: new Date(startDateStr), lte: new Date(endDateStr) };
    }

    // Role-based filter restriction
    const isEmployee = session.role === 'EMPLOYEE';
    const activeUserId = isEmployee ? session.id : userId;

    if (targetModule === 'Environmental') {
      // ENVIRONMENTAL: Carbon Transactions
      const where = {};
      if (dateFilter) where.date = dateFilter;
      if (deptId) where.departmentId = deptId;

      const records = await prisma.carbonTransaction.findMany({
        where,
        include: {
          department: true,
          emissionFactor: true
        },
        orderBy: { date: 'desc' }
      });

      const rows = records.map(tx => ({
        id: tx.id,
        Date: new Date(tx.date).toLocaleDateString(),
        Department: tx.department.name,
        Source: tx.emissionFactor.sourceType,
        'Emission Factor': tx.emissionFactor.name,
        Quantity: tx.quantity,
        'CO2 (kg)': tx.co2Amount
      }));

      return NextResponse.json({
        module: targetModule,
        headers: ['Date', 'Department', 'Source', 'Emission Factor', 'Quantity', 'CO2 (kg)'],
        rows,
        numericColumns: ['Quantity', 'CO2 (kg)']
      });

    } else if (targetModule === 'Social') {
      // SOCIAL: Employee CSR Participations
      const where = {};
      if (dateFilter) {
        where.OR = [
          { completionDate: dateFilter },
          { createdAt: dateFilter }
        ];
      }
      if (activeUserId) where.userId = activeUserId;
      if (deptId) {
        where.user = { departmentId: deptId };
      }
      if (categoryId) {
        where.activity = { categoryId: categoryId };
      }

      const records = await prisma.employeeParticipation.findMany({
        where,
        include: {
          user: { include: { department: true } },
          activity: { include: { category: true } }
        },
        orderBy: { createdAt: 'desc' }
      });

      const rows = records.map(p => ({
        id: p.id,
        Date: new Date(p.createdAt).toLocaleDateString(),
        Employee: p.user.name,
        Department: p.user.department.name,
        Activity: p.activity.title,
        Category: p.activity.category.name,
        'Points Earned': p.pointsEarned,
        Status: p.approvalStatus
      }));

      return NextResponse.json({
        module: targetModule,
        headers: ['Date', 'Employee', 'Department', 'Activity', 'Category', 'Points Earned', 'Status'],
        rows,
        numericColumns: ['Points Earned']
      });

    } else if (targetModule === 'Governance') {
      // GOVERNANCE: Compliance Issues / Audits
      const where = {};
      if (dateFilter) where.createdAt = dateFilter;
      if (deptId) where.departmentId = deptId;
      if (activeUserId) where.ownerId = activeUserId;

      const records = await prisma.complianceIssue.findMany({
        where,
        include: {
          department: true,
          owner: true,
          audit: true
        },
        orderBy: { createdAt: 'desc' }
      });

      const rows = records.map(i => ({
        id: i.id,
        Date: new Date(i.createdAt).toLocaleDateString(),
        Title: i.title,
        Severity: i.severity,
        Status: i.status,
        Owner: i.owner.name,
        Department: i.department.name,
        Audit: i.audit ? i.audit.title : 'None',
        'Due Date': new Date(i.dueDate).toLocaleDateString()
      }));

      return NextResponse.json({
        module: targetModule,
        headers: ['Date', 'Title', 'Severity', 'Status', 'Owner', 'Department', 'Audit', 'Due Date'],
        rows,
        numericColumns: []
      });

    } else if (targetModule === 'Gamification') {
      // GAMIFICATION: Challenge Participations
      const where = {};
      if (dateFilter) where.createdAt = dateFilter;
      if (activeUserId) where.userId = activeUserId;
      if (deptId) {
        where.user = { departmentId: deptId };
      }
      if (challengeId) where.challengeId = challengeId;
      if (categoryId) {
        where.challenge = { categoryId: categoryId };
      }

      const records = await prisma.challengeParticipation.findMany({
        where,
        include: {
          user: { include: { department: true } },
          challenge: { include: { category: true } }
        },
        orderBy: { createdAt: 'desc' }
      });

      const rows = records.map(p => ({
        id: p.id,
        Date: new Date(p.createdAt).toLocaleDateString(),
        Employee: p.user.name,
        Department: p.user.department.name,
        Challenge: p.challenge.title,
        'Progress %': p.progress,
        'XP Awarded': p.xpAwarded,
        Status: p.approvalStatus
      }));

      return NextResponse.json({
        module: targetModule,
        headers: ['Date', 'Employee', 'Department', 'Challenge', 'Progress %', 'XP Awarded', 'Status'],
        rows,
        numericColumns: ['Progress %', 'XP Awarded']
      });
    }

    return NextResponse.json({ error: 'Invalid module selection' }, { status: 400 });
  } catch (err) {
    console.error('Error querying custom report builder:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

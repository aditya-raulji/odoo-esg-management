import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';
import { notify } from '@/lib/notify';

// GET all compliance issues (Auth: Admin sees all, Employee sees own)
export async function GET(req) {
  const { error, session } = await requireAuth(req);
  if (error) return error;

  try {
    const where = session.role === 'ADMIN' ? {} : { ownerId: session.id };

    const data = await prisma.complianceIssue.findMany({
      where,
      include: {
        department: true,
        owner: true,
        audit: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(data);
  } catch (err) {
    console.error('Error fetching compliance issues:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST create compliance issue (Admin only)
export async function POST(req) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  try {
    const body = await req.json();
    const { title, description, severity, departmentId, ownerId, dueDate, auditId } = body;

    // Server-side validation — owner and dueDate are mandatory
    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Issue title is required' }, { status: 400 });
    }
    if (!severity || !['HIGH', 'MEDIUM', 'LOW'].includes(severity)) {
      return NextResponse.json({ error: 'Severity must be HIGH, MEDIUM, or LOW' }, { status: 400 });
    }
    if (!departmentId) {
      return NextResponse.json({ error: 'Department is required' }, { status: 400 });
    }
    // BUSINESS RULE: Owner is mandatory
    if (!ownerId) {
      return NextResponse.json({ error: 'Owner is required — compliance issues must have a responsible owner' }, { status: 422 });
    }
    // BUSINESS RULE: Due Date is mandatory
    if (!dueDate || isNaN(Date.parse(dueDate))) {
      return NextResponse.json({ error: 'Due Date is required — compliance issues must have a resolution deadline' }, { status: 422 });
    }

    // Validate references
    const dept = await prisma.department.findUnique({ where: { id: parseInt(departmentId) } });
    if (!dept) return NextResponse.json({ error: 'Department not found' }, { status: 404 });

    const owner = await prisma.user.findUnique({ where: { id: parseInt(ownerId) } });
    if (!owner) return NextResponse.json({ error: 'Owner not found' }, { status: 404 });

    if (auditId) {
      const audit = await prisma.audit.findUnique({ where: { id: parseInt(auditId) } });
      if (!audit) return NextResponse.json({ error: 'Linked audit not found' }, { status: 404 });
    }

    const issue = await prisma.complianceIssue.create({
      data: {
        title: title.trim(),
        description: description?.trim() || '',
        severity,
        departmentId: parseInt(departmentId),
        ownerId: parseInt(ownerId),
        dueDate: new Date(dueDate),
        auditId: auditId ? parseInt(auditId) : null
      },
      include: { department: true, owner: true }
    });

    // Log activity
    await logActivity('GOVERNANCE', `New compliance issue in ${dept.name}: "${issue.title}" (${severity})`);

    // Notify owner + admins if emailAlertsCompliance is enabled
    const settings = await prisma.orgSettings.findFirst({ where: { id: 1 } });
    if (settings?.emailAlertsCompliance) {
      const admins = await prisma.user.findMany({ where: { role: 'ADMIN', status: 'Active' }, select: { id: true } });
      const adminIds = admins.map((a) => a.id);
      const allRecipients = [...new Set([parseInt(ownerId), ...adminIds])];

      await notify({
        userIds: allRecipients,
        type: 'COMPLIANCE',
        title: `New ${severity} Compliance Issue`,
        message: `New ${severity} issue in ${dept.name}: ${issue.title}`,
        link: '/governance/compliance-issues'
      });
    }

    return NextResponse.json(issue, { status: 201 });
  } catch (err) {
    console.error('Error creating compliance issue:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
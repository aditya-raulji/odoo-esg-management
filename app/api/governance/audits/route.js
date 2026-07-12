import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

// GET all audits (Auth users)
export async function GET(req) {
  const { error } = await requireAuth(req);
  if (error) return error;

  try {
    const data = await prisma.audit.findMany({
      include: {
        department: true,
        complianceIssues: {
          include: { owner: true, department: true }
        }
      },
      orderBy: { date: 'desc' }
    });
    return NextResponse.json(data);
  } catch (err) {
    console.error('Error fetching audits:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST create audit (Admin only)
export async function POST(req) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  try {
    const body = await req.json();
    const { title, departmentId, auditor, date, findings, status } = body;

    if (!title || !title.trim()) return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    if (!departmentId) return NextResponse.json({ error: 'Department is required' }, { status: 400 });
    if (!auditor || !auditor.trim()) return NextResponse.json({ error: 'Auditor is required' }, { status: 400 });
    if (!date || isNaN(Date.parse(date))) return NextResponse.json({ error: 'Valid date is required' }, { status: 400 });
    if (!findings || !findings.trim()) return NextResponse.json({ error: 'Findings is required' }, { status: 400 });

    const dept = await prisma.department.findUnique({ where: { id: parseInt(departmentId) } });
    if (!dept) return NextResponse.json({ error: 'Department not found' }, { status: 404 });

    const audit = await prisma.audit.create({
      data: {
        title: title.trim(),
        departmentId: parseInt(departmentId),
        auditor: auditor.trim(),
        date: new Date(date),
        findings: findings.trim(),
        status: status || 'PLANNED'
      },
      include: { department: true }
    });

    await logActivity('GOVERNANCE', `Audit "${audit.title}" created for ${dept.name}`);

    return NextResponse.json(audit, { status: 201 });
  } catch (err) {
    console.error('Error creating audit:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
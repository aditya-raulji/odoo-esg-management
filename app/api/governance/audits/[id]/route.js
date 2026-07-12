import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

// PUT update audit
export async function PUT(req, { params }) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const id = parseInt(params.id);
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  try {
    const body = await req.json();
    const { title, departmentId, auditor, date, findings, status } = body;

    if (!title || !title.trim()) return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    if (!departmentId) return NextResponse.json({ error: 'Department is required' }, { status: 400 });
    if (!auditor || !auditor.trim()) return NextResponse.json({ error: 'Auditor is required' }, { status: 400 });
    if (!date || isNaN(Date.parse(date))) return NextResponse.json({ error: 'Valid date is required' }, { status: 400 });

    const existing = await prisma.audit.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Audit not found' }, { status: 404 });

    const audit = await prisma.audit.update({
      where: { id },
      data: {
        title: title.trim(),
        departmentId: parseInt(departmentId),
        auditor: auditor.trim(),
        date: new Date(date),
        findings: findings?.trim() || existing.findings,
        status: status || existing.status
      },
      include: { department: true }
    });

    await logActivity('GOVERNANCE', `Audit "${audit.title}" updated (${audit.status})`);
    return NextResponse.json(audit);
  } catch (err) {
    console.error('Error updating audit:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE audit
export async function DELETE(req, { params }) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const id = parseInt(params.id);
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  try {
    const audit = await prisma.audit.findUnique({
      where: { id },
      include: { complianceIssues: true }
    });
    if (!audit) return NextResponse.json({ error: 'Audit not found' }, { status: 404 });
    if (audit.complianceIssues.length > 0) {
      return NextResponse.json({ error: 'Cannot delete audit with linked compliance issues.' }, { status: 400 });
    }

    await prisma.audit.delete({ where: { id } });
    await logActivity('GOVERNANCE', `Audit "${audit.title}" deleted`);
    return NextResponse.json({ message: 'Audit deleted successfully' });
  } catch (err) {
    console.error('Error deleting audit:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

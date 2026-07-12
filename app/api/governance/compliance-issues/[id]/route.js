import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

// PATCH update compliance issue (Admin or owner can resolve)
export async function PATCH(req, { params }) {
  const { error, session } = await requireAuth(req);
  if (error) return error;

  const id = parseInt(params.id);
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  try {
    const body = await req.json();
    const { status, resolutionNote, severity, dueDate, ownerId, departmentId, title, description } = body;

    const issue = await prisma.complianceIssue.findUnique({
      where: { id },
      include: { department: true, owner: true }
    });
    if (!issue) return NextResponse.json({ error: 'Issue not found' }, { status: 404 });

    // Authorization: Admin can do anything; owner can only resolve
    const isAdmin = session.role === 'ADMIN';
    const isOwner = issue.ownerId === session.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // If resolving, must have a resolution note
    if (status === 'RESOLVED' && !resolutionNote?.trim()) {
      return NextResponse.json({ error: 'Resolution note is required to close this issue' }, { status: 400 });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (resolutionNote !== undefined) updateData.resolutionNote = resolutionNote;

    // Admins can also update other fields
    if (isAdmin) {
      if (severity) updateData.severity = severity;
      if (dueDate) updateData.dueDate = new Date(dueDate);
      if (ownerId) updateData.ownerId = parseInt(ownerId);
      if (departmentId) updateData.departmentId = parseInt(departmentId);
      if (title) updateData.title = title.trim();
      if (description !== undefined) updateData.description = description;
    }

    const updated = await prisma.complianceIssue.update({
      where: { id },
      data: updateData,
      include: { department: true, owner: true }
    });

    if (status === 'RESOLVED') {
      await logActivity('GOVERNANCE', `Compliance issue resolved: "${updated.title}" in ${updated.department?.name}`);
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error('Error updating compliance issue:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE compliance issue (Admin only)
export async function DELETE(req, { params }) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const id = parseInt(params.id);
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  try {
    const issue = await prisma.complianceIssue.findUnique({ where: { id } });
    if (!issue) return NextResponse.json({ error: 'Issue not found' }, { status: 404 });

    await prisma.complianceIssue.delete({ where: { id } });
    await logActivity('GOVERNANCE', `Compliance issue deleted: "${issue.title}"`);
    return NextResponse.json({ message: 'Issue deleted' });
  } catch (err) {
    console.error('Error deleting compliance issue:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

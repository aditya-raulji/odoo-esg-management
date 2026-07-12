import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

// PUT update department (Admin only)
export async function PUT(req, { params }) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const id = parseInt(params.id);
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid department ID' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { name, code, head, parentId, employeeCount, status } = body;

    // Server-side validation
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    if (!code || typeof code !== 'string' || code.trim() === '') {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }
    if (!head || typeof head !== 'string' || head.trim() === '') {
      return NextResponse.json({ error: 'Head of department is required' }, { status: 400 });
    }

    // Check code uniqueness excluding self
    const existing = await prisma.department.findFirst({
      where: {
        code: code.toUpperCase().trim(),
        NOT: { id }
      }
    });
    if (existing) {
      return NextResponse.json({ error: 'Department code must be unique' }, { status: 400 });
    }

    // Check circular parentId reference
    const targetParentId = parentId ? parseInt(parentId) : null;
    if (targetParentId === id) {
      return NextResponse.json({ error: 'A department cannot be its own parent' }, { status: 400 });
    }

    const updated = await prisma.department.update({
      where: { id },
      data: {
        name: name.trim(),
        code: code.toUpperCase().trim(),
        head: head.trim(),
        parentId: targetParentId,
        employeeCount: employeeCount ? parseInt(employeeCount) : 0,
        status: status || 'Active'
      }
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error('Error updating department:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE department (Admin only)
export async function DELETE(req, { params }) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const id = parseInt(params.id);
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid department ID' }, { status: 400 });
  }

  try {
    // 1. Check for child sub-departments
    const childCount = await prisma.department.count({
      where: { parentId: id }
    });
    if (childCount > 0) {
      return NextResponse.json({
        error: 'Cannot delete department: It has child sub-departments.'
      }, { status: 400 });
    }

    // 2. Check for users
    const userCount = await prisma.user.count({
      where: { departmentId: id }
    });
    if (userCount > 0) {
      return NextResponse.json({
        error: 'Cannot delete department: It has active employees/users assigned.'
      }, { status: 400 });
    }

    // 3. Check for goals
    const goalCount = await prisma.environmentalGoal.count({
      where: { departmentId: id }
    });
    if (goalCount > 0) {
      return NextResponse.json({
        error: 'Cannot delete department: It has environmental goals associated.'
      }, { status: 400 });
    }

    // 4. Check for transactions
    const txCount = await prisma.carbonTransaction.count({
      where: { departmentId: id }
    });
    if (txCount > 0) {
      return NextResponse.json({
        error: 'Cannot delete department: It has carbon transactions recorded.'
      }, { status: 400 });
    }

    // 5. Check for operation records
    const opCount = await prisma.operationRecord.count({
      where: { departmentId: id }
    });
    if (opCount > 0) {
      return NextResponse.json({
        error: 'Cannot delete department: It has operation records recorded.'
      }, { status: 400 });
    }

    // 6. Check for audits
    const auditCount = await prisma.audit.count({
      where: { departmentId: id }
    });
    if (auditCount > 0) {
      return NextResponse.json({
        error: 'Cannot delete department: It has environmental audits recorded.'
      }, { status: 400 });
    }

    // 7. Check for scores
    const scoreCount = await prisma.departmentScore.count({
      where: { departmentId: id }
    });
    if (scoreCount > 0) {
      return NextResponse.json({
        error: 'Cannot delete department: It has historical department score records.'
      }, { status: 400 });
    }

    // 8. Check for compliance issues
    const issueCount = await prisma.complianceIssue.count({
      where: { departmentId: id }
    });
    if (issueCount > 0) {
      return NextResponse.json({
        error: 'Cannot delete department: It has associated compliance issues.'
      }, { status: 400 });
    }

    // If all checks pass, delete
    await prisma.department.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error deleting department:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

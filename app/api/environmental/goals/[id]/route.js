import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function PUT(req, { params }) {
  const { error } = await requireAuth(req);
  if (error) return error;

  const { id } = params;
  const goalId = parseInt(id);

  try {
    const body = await req.json();
    const { name, departmentId, targetCO2, currentCO2, deadline, status } = body;

    // Validation
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: 'Goal Name is required' }, { status: 400 });
    }
    if (!departmentId) {
      return NextResponse.json({ error: 'Department is required' }, { status: 400 });
    }
    const deptId = parseInt(departmentId);
    const departmentExists = await prisma.department.findUnique({
      where: { id: deptId }
    });
    if (!departmentExists) {
      return NextResponse.json({ error: 'Selected department does not exist' }, { status: 400 });
    }

    if (targetCO2 === undefined || targetCO2 === null || typeof targetCO2 !== 'number' || targetCO2 <= 0) {
      return NextResponse.json({ error: 'Target CO2 must be a positive number greater than 0' }, { status: 400 });
    }
    if (currentCO2 === undefined || currentCO2 === null || typeof currentCO2 !== 'number' || currentCO2 < 0) {
      return NextResponse.json({ error: 'Current CO2 cannot be negative' }, { status: 400 });
    }
    if (!deadline || isNaN(Date.parse(deadline))) {
      return NextResponse.json({ error: 'A valid deadline date is required' }, { status: 400 });
    }

    const cleanStatus = status ? status.toUpperCase() : 'ACTIVE';
    if (!['ACTIVE', 'ON_TRACK', 'COMPLETED'].includes(cleanStatus)) {
      return NextResponse.json({ error: 'Status must be ACTIVE, ON_TRACK, or COMPLETED' }, { status: 400 });
    }

    const updatedGoal = await prisma.environmentalGoal.update({
      where: { id: goalId },
      data: {
        name: name.trim(),
        departmentId: deptId,
        targetCO2: parseFloat(targetCO2),
        currentCO2: parseFloat(currentCO2),
        deadline: new Date(deadline),
        status: cleanStatus
      },
      include: { department: true }
    });

    await logActivity('CARBON', `Environmental goal updated: ${updatedGoal.name}`);

    return NextResponse.json(updatedGoal);
  } catch (err) {
    console.error('Error updating goal:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const { error } = await requireAuth(req);
  if (error) return error;

  const { id } = params;
  const goalId = parseInt(id);

  try {
    const deletedGoal = await prisma.environmentalGoal.delete({
      where: { id: goalId }
    });

    await logActivity('CARBON', `Environmental goal deleted: ${deletedGoal.name}`);

    return NextResponse.json({ message: 'Environmental goal deleted successfully', deletedGoal });
  } catch (err) {
    console.error('Error deleting goal:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

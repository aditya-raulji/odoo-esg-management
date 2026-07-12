import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

// POST /api/environmental/carbon-transactions/manual
// Manual carbon entry (when autoCalc is OFF or admin wants direct entry)
export async function POST(req) {
  const { error } = await requireAuth(req);
  if (error) return error;

  try {
    const body = await req.json();
    const { departmentId, emissionFactorId, quantity, date } = body;

    if (!departmentId) return NextResponse.json({ error: 'Department is required' }, { status: 400 });
    const deptId = parseInt(departmentId);
    const dept = await prisma.department.findUnique({ where: { id: deptId } });
    if (!dept) return NextResponse.json({ error: 'Department not found' }, { status: 400 });

    if (!emissionFactorId) return NextResponse.json({ error: 'Emission Factor is required' }, { status: 400 });
    const factorId = parseInt(emissionFactorId);
    const factor = await prisma.emissionFactor.findUnique({ where: { id: factorId } });
    if (!factor) return NextResponse.json({ error: 'Emission Factor not found' }, { status: 400 });

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) return NextResponse.json({ error: 'Quantity must be a positive number' }, { status: 400 });

    const txDate = date ? new Date(date) : new Date();
    if (isNaN(txDate.getTime())) return NextResponse.json({ error: 'Invalid date' }, { status: 400 });

    const co2Amount = parseFloat((qty * factor.co2PerUnit).toFixed(4));

    const carbonTx = await prisma.carbonTransaction.create({
      data: {
        operationId: null,
        departmentId: deptId,
        emissionFactorId: factorId,
        quantity: qty,
        co2Amount,
        date: txDate,
        source: 'MANUAL',
      },
      include: { department: true, emissionFactor: true },
    });

    await logActivity('CARBON', `Manual Carbon Transaction created (${dept.name}) — ${co2Amount.toFixed(2)} kg CO₂`);

    return NextResponse.json({ carbonTransaction: carbonTx, co2Amount }, { status: 201 });
  } catch (err) {
    console.error('Error creating manual carbon entry:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

// POST /api/environmental/operations/[id]/convert
// Convert a pending operation into a CarbonTransaction (when autoCalc is OFF)
export async function POST(req, { params }) {
  const { error } = await requireAuth(req);
  if (error) return error;

  const id = parseInt(params.id);
  if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

  try {
    const op = await prisma.operationRecord.findUnique({
      where: { id },
      include: { department: true, emissionFactor: true, carbonTransactions: true },
    });
    if (!op) return NextResponse.json({ error: 'Operation not found' }, { status: 404 });
    if (op.carbonTransactions.length > 0) {
      return NextResponse.json({ error: 'This operation already has a carbon transaction' }, { status: 409 });
    }

    const co2Amount = parseFloat((op.quantity * op.emissionFactor.co2PerUnit).toFixed(4));

    const carbonTx = await prisma.carbonTransaction.create({
      data: {
        operationId: op.id,
        departmentId: op.departmentId,
        emissionFactorId: op.emissionFactorId,
        quantity: op.quantity,
        co2Amount,
        date: op.date,
        source: 'MANUAL',
      },
    });

    await logActivity('CARBON', `Operation converted to Carbon Transaction (${op.department.name}) — ${co2Amount.toFixed(2)} kg CO₂ MANUAL`);

    return NextResponse.json({ carbonTransaction: carbonTx, co2Amount }, { status: 201 });
  } catch (err) {
    console.error('Error converting operation:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

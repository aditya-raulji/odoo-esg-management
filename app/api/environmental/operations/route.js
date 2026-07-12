import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function GET(req) {
  const { error } = await requireAuth(req);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const departmentId = searchParams.get('departmentId');

  const where = {};
  if (type) where.type = type.toUpperCase();
  if (departmentId) where.departmentId = parseInt(departmentId);

  const data = await prisma.operationRecord.findMany({
    where,
    include: { department: true, emissionFactor: true, carbonTransactions: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return NextResponse.json(data);
}

export async function POST(req) {
  const { error } = await requireAuth(req);
  if (error) return error;

  try {
    const body = await req.json();
    const { type, departmentId, description, quantity, emissionFactorId, date } = body;

    // --- Validation ---
    const validTypes = ['PURCHASE', 'MANUFACTURING', 'FLEET', 'EXPENSE'];
    if (!type || !validTypes.includes(type.toUpperCase())) {
      return NextResponse.json({ error: 'Valid Type is required (Purchase, Manufacturing, Fleet, Expense)' }, { status: 400 });
    }
    if (!departmentId) {
      return NextResponse.json({ error: 'Department is required' }, { status: 400 });
    }
    const deptId = parseInt(departmentId);
    const dept = await prisma.department.findUnique({ where: { id: deptId } });
    if (!dept) return NextResponse.json({ error: 'Department not found' }, { status: 400 });

    if (!description || description.trim() === '') {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      return NextResponse.json({ error: 'Quantity must be a positive number' }, { status: 400 });
    }
    if (!emissionFactorId) {
      return NextResponse.json({ error: 'Emission Factor is required' }, { status: 400 });
    }
    const factorId = parseInt(emissionFactorId);
    const factor = await prisma.emissionFactor.findUnique({ where: { id: factorId } });
    if (!factor) return NextResponse.json({ error: 'Emission Factor not found' }, { status: 400 });

    const opDate = date ? new Date(date) : new Date();
    if (isNaN(opDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date' }, { status: 400 });
    }

    // --- Read OrgSettings ---
    const orgSettings = await prisma.orgSettings.findUnique({ where: { id: 1 } });
    const autoCalc = orgSettings?.autoEmissionCalc ?? true;

    let operation;
    let carbonTx = null;

    if (autoCalc) {
      // Atomic: create operation + carbon transaction together
      const co2Amount = parseFloat((qty * factor.co2PerUnit).toFixed(4));

      [operation, carbonTx] = await prisma.$transaction(async (tx) => {
        const op = await tx.operationRecord.create({
          data: {
            type: type.toUpperCase(),
            departmentId: deptId,
            description: description.trim(),
            quantity: qty,
            unit: factor.unit,
            emissionFactorId: factorId,
            date: opDate,
          },
          include: { department: true, emissionFactor: true },
        });

        const ct = await tx.carbonTransaction.create({
          data: {
            operationId: op.id,
            departmentId: deptId,
            emissionFactorId: factorId,
            quantity: qty,
            co2Amount,
            date: opDate,
            source: 'AUTO',
          },
        });

        return [op, ct];
      });

      await logActivity('CARBON', `New Carbon Transaction logged (${dept.name}) — ${co2Amount.toFixed(2)} kg CO₂ AUTO`);

      return NextResponse.json({ operation, carbonTransaction: carbonTx, autoCalc: true, co2Amount }, { status: 201 });
    } else {
      // Auto-calc OFF — save operation only, mark pending
      operation = await prisma.operationRecord.create({
        data: {
          type: type.toUpperCase(),
          departmentId: deptId,
          description: description.trim(),
          quantity: qty,
          unit: factor.unit,
          emissionFactorId: factorId,
          date: opDate,
        },
        include: { department: true, emissionFactor: true },
      });

      await logActivity('CARBON', `Operation logged (${dept.name}) — pending CO₂ conversion`);

      return NextResponse.json({ operation, carbonTransaction: null, autoCalc: false }, { status: 201 });
    }
  } catch (err) {
    console.error('Error creating operation:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

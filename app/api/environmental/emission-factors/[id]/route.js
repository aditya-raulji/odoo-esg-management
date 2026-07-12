import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function PUT(req, { params }) {
  const { error } = await requireAuth(req);
  if (error) return error;

  const { id } = params;

  try {
    const body = await req.json();
    const { name, sourceType, unit, co2PerUnit, status } = body;

    // Validation
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    if (!sourceType || !['PURCHASE', 'MANUFACTURING', 'FLEET', 'EXPENSE'].includes(sourceType.toUpperCase())) {
      return NextResponse.json({ error: 'Valid Source Type is required (Purchase, Manufacturing, Fleet, Expense)' }, { status: 400 });
    }
    if (!unit || typeof unit !== 'string' || unit.trim() === '') {
      return NextResponse.json({ error: 'Unit is required' }, { status: 400 });
    }
    if (co2PerUnit === undefined || co2PerUnit === null || typeof co2PerUnit !== 'number' || co2PerUnit <= 0) {
      return NextResponse.json({ error: 'CO2 Per Unit must be a positive number greater than 0' }, { status: 400 });
    }

    const updatedFactor = await prisma.emissionFactor.update({
      where: { id: parseInt(id) },
      data: {
        name: name.trim(),
        sourceType: sourceType.toUpperCase(),
        unit: unit.trim(),
        co2PerUnit: parseFloat(co2PerUnit),
        status: status || 'Active'
      }
    });

    await logActivity('CARBON', `Emission factor updated: ${updatedFactor.name}`);

    return NextResponse.json(updatedFactor);
  } catch (err) {
    console.error('Error updating emission factor:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const { error } = await requireAuth(req);
  if (error) return error;

  const { id } = params;
  const factorId = parseInt(id);

  try {
    // Guard: Check if referenced by carbon transactions or operation records
    const transactionCount = await prisma.carbonTransaction.count({
      where: { emissionFactorId: factorId }
    });
    const recordCount = await prisma.operationRecord.count({
      where: { emissionFactorId: factorId }
    });

    if (transactionCount > 0 || recordCount > 0) {
      return NextResponse.json({
        error: 'Cannot delete: This emission factor is referenced by existing carbon transactions or operation records.'
      }, { status: 400 });
    }

    const deletedFactor = await prisma.emissionFactor.delete({
      where: { id: factorId }
    });

    await logActivity('CARBON', `Emission factor deleted: ${deletedFactor.name}`);

    return NextResponse.json({ message: 'Emission factor deleted successfully', deletedFactor });
  } catch (err) {
    console.error('Error deleting emission factor:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

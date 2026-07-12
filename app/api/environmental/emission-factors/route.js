import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function GET(req) {
  const { error } = await requireAuth(req);
  if (error) return error;
  const data = await prisma.emissionFactor.findMany({
    orderBy: { id: 'desc' }
  });
  return NextResponse.json(data);
}

export async function POST(req) {
  const { error, session } = await requireAuth(req);
  if (error) return error;

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

    const newFactor = await prisma.emissionFactor.create({
      data: {
        name: name.trim(),
        sourceType: sourceType.toUpperCase(),
        unit: unit.trim(),
        co2PerUnit: parseFloat(co2PerUnit),
        status: status || 'Active'
      }
    });

    await logActivity('CARBON', `New emission factor created: ${newFactor.name}`);

    return NextResponse.json(newFactor, { status: 201 });
  } catch (err) {
    console.error('Error creating emission factor:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
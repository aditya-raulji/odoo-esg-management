import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET /api/environmental/carbon-transactions
// Supports filters: departmentId, type (sourceType on emissionFactor), source, dateFrom, dateTo
export async function GET(req) {
  const { error } = await requireAuth(req);
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const departmentId = searchParams.get('departmentId');
  const type = searchParams.get('type');       // PURCHASE | MANUFACTURING | FLEET | EXPENSE
  const source = searchParams.get('source');   // AUTO | MANUAL
  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');

  const where = {};
  if (departmentId) where.departmentId = parseInt(departmentId);
  if (source) where.source = source.toUpperCase();
  if (dateFrom || dateTo) {
    where.date = {};
    if (dateFrom) where.date.gte = new Date(dateFrom);
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      where.date.lte = end;
    }
  }
  if (type) {
    where.emissionFactor = { sourceType: type.toUpperCase() };
  }

  const data = await prisma.carbonTransaction.findMany({
    where,
    include: {
      department: true,
      emissionFactor: true,
      operation: { select: { type: true } },
    },
    orderBy: { date: 'desc' },
  });

  // Monthly total (this-month)
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthTotal = data
    .filter((t) => new Date(t.date) >= startOfMonth)
    .reduce((s, t) => s + t.co2Amount, 0);

  const filterTotal = data.reduce((s, t) => s + t.co2Amount, 0);

  return NextResponse.json({ data, filterTotal, monthTotal });
}
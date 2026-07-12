import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET /api/environmental/carbon-transactions/by-department
// Returns last-6-month emissions per department, with this-month, last-month, delta, YTD
export async function GET(req) {
  const { error } = await requireAuth(req);
  if (error) return error;

  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const txs = await prisma.carbonTransaction.findMany({
    where: { date: { gte: sixMonthsAgo } },
    include: { department: true },
    orderBy: { date: 'asc' },
  });

  // Group by department
  const deptMap = {}; // deptId → { name, months: { "YYYY-MM": total } }

  txs.forEach((t) => {
    const dId = t.departmentId;
    if (!deptMap[dId]) {
      deptMap[dId] = { id: dId, name: t.department.name, months: {} };
    }
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    deptMap[dId].months[key] = (deptMap[dId].months[key] || 0) + t.co2Amount;
  });

  // Build last-6 months keys
  const monthKeys = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }

  const thisMonth = monthKeys[5];
  const lastMonth = monthKeys[4];

  // For YTD: Jan of this year
  const ytdStart = new Date(now.getFullYear(), 0, 1);
  const ytxs = await prisma.carbonTransaction.findMany({
    where: { date: { gte: ytdStart } },
    select: { departmentId: true, co2Amount: true },
  });
  const ytdMap = {};
  ytxs.forEach((t) => {
    ytdMap[t.departmentId] = (ytdMap[t.departmentId] || 0) + t.co2Amount;
  });

  const departments = Object.values(deptMap).map((dept) => {
    const thisMo = dept.months[thisMonth] || 0;
    const lastMo = dept.months[lastMonth] || 0;
    const delta = lastMo === 0 ? null : parseFloat((((thisMo - lastMo) / lastMo) * 100).toFixed(1));
    const series = monthKeys.map((k) => ({ month: k, co2: parseFloat((dept.months[k] || 0).toFixed(2)) }));

    return {
      id: dept.id,
      name: dept.name,
      thisMonth: parseFloat(thisMo.toFixed(2)),
      lastMonth: parseFloat(lastMo.toFixed(2)),
      delta,
      ytd: parseFloat((ytdMap[dept.id] || 0).toFixed(2)),
      series,
    };
  });

  // Chart data: [{month, DeptA, DeptB, ...}]
  const chartData = monthKeys.map((k) => {
    const point = { month: k };
    departments.forEach((d) => {
      point[d.name] = d.series.find((s) => s.month === k)?.co2 || 0;
    });
    return point;
  });

  return NextResponse.json({ departments, chartData, monthKeys });
}

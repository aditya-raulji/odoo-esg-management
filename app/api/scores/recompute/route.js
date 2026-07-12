import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { recomputeScores } from '@/lib/scoring';
import { logActivity } from '@/lib/activity';

// POST /api/scores/recompute
export async function POST(req) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  try {
    let body = {};
    try {
      body = await req.json();
    } catch {}

    const period = body.period || '2026-07';

    const result = await recomputeScores(period);

    await logActivity('GOVERNANCE', `ESG scores recomputed for period ${period}. Overall score: ${result.overallScore}`);

    return NextResponse.json({
      message: 'Scores recomputed successfully',
      overallScore: result.overallScore,
      departmentScores: result.departmentScores
    });
  } catch (err) {
    console.error('Error recomputing scores:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

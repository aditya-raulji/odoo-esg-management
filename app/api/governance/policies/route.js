import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

// GET all policies (Authenticated users)
export async function GET(req) {
  const { error } = await requireAuth(req);
  if (error) return error;

  try {
    const data = await prisma.eSGPolicy.findMany({
      orderBy: { effectiveDate: 'desc' }
    });
    return NextResponse.json(data);
  } catch (err) {
    console.error('Error fetching policies:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST create policy (Admin only)
export async function POST(req) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  try {
    const body = await req.json();
    const { title, body: policyBody, version, effectiveDate, status } = body;

    // Validation
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    if (!policyBody || typeof policyBody !== 'string' || policyBody.trim() === '') {
      return NextResponse.json({ error: 'Policy body is required' }, { status: 400 });
    }
    if (!version || typeof version !== 'string' || version.trim() === '') {
      return NextResponse.json({ error: 'Version is required' }, { status: 400 });
    }
    if (!effectiveDate || isNaN(Date.parse(effectiveDate))) {
      return NextResponse.json({ error: 'Valid effective date is required' }, { status: 400 });
    }

    const policy = await prisma.eSGPolicy.create({
      data: {
        title: title.trim(),
        body: policyBody.trim(),
        version: version.trim(),
        effectiveDate: new Date(effectiveDate),
        status: status || 'Active'
      }
    });

    await logActivity('GOVERNANCE', `New ESG Policy created: ${policy.title} (v${policy.version})`);

    return NextResponse.json(policy, { status: 201 });
  } catch (err) {
    console.error('Error creating policy:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
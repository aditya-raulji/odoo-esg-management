import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

// PUT update policy (Admin only)
export async function PUT(req, { params }) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const id = parseInt(params.id);
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { title, body: policyBody, version, effectiveDate, status } = body;

    const existing = await prisma.eSGPolicy.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Policy not found' }, { status: 404 });
    }

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

    const policy = await prisma.eSGPolicy.update({
      where: { id },
      data: {
        title: title.trim(),
        body: policyBody.trim(),
        version: version.trim(),
        effectiveDate: new Date(effectiveDate),
        status: status || existing.status
      }
    });

    await logActivity('GOVERNANCE', `ESG Policy updated: ${policy.title} (v${policy.version})`);

    return NextResponse.json(policy);
  } catch (err) {
    console.error('Error updating policy:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE policy (Admin only)
export async function DELETE(req, { params }) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  const id = parseInt(params.id);
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  try {
    const policy = await prisma.eSGPolicy.findUnique({
      where: { id },
      include: { acknowledgements: true }
    });

    if (!policy) {
      return NextResponse.json({ error: 'Policy not found' }, { status: 404 });
    }

    if (policy.acknowledgements.length > 0) {
      return NextResponse.json({ error: 'Cannot delete policy with existing employee acknowledgements.' }, { status: 400 });
    }

    await prisma.eSGPolicy.delete({ where: { id } });

    await logActivity('GOVERNANCE', `ESG Policy deleted: ${policy.title}`);

    return NextResponse.json({ message: 'Policy deleted successfully' });
  } catch (err) {
    console.error('Error deleting policy:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

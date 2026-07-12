import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

// PATCH/PUT update employee participation (Proof upload or Admin approval queue)
export async function PATCH(req, { params }) {
  const { error, session } = await requireAuth(req);
  if (error) return error;

  const id = parseInt(params.id);
  if (isNaN(id)) {
    return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
  }

  try {
    const part = await prisma.employeeParticipation.findUnique({
      where: { id },
      include: { activity: true, user: true }
    });

    if (!part) {
      return NextResponse.json({ error: 'Participation record not found' }, { status: 404 });
    }

    const body = await req.json();
    const { proofUrl, approvalStatus } = body;

    // Employee Uploading Proof
    if (proofUrl !== undefined) {
      if (session.role !== 'ADMIN' && part.userId !== session.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      if (part.approvalStatus !== 'PENDING') {
        return NextResponse.json({ error: 'Cannot upload proof to a resolved participation' }, { status: 400 });
      }
      const updated = await prisma.employeeParticipation.update({
        where: { id },
        data: { proofUrl },
        include: { activity: true }
      });
      return NextResponse.json(updated);
    }

    // Admin Approving/Rejecting
    if (approvalStatus !== undefined) {
      if (session.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Admin role required' }, { status: 403 });
      }

      const newStatus = approvalStatus.toUpperCase();
      if (newStatus !== 'APPROVED' && newStatus !== 'REJECTED') {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }

      if (newStatus === 'APPROVED') {
        const orgSettings = await prisma.orgSettings.findUnique({ where: { id: 1 } });
        const globalEvidenceRequired = orgSettings?.evidenceRequired ?? true;
        const requiresEvidence = part.activity.evidenceRequired || globalEvidenceRequired;

        if (requiresEvidence && !part.proofUrl) {
          return NextResponse.json({ error: 'Evidence required before approval' }, { status: 422 });
        }

        const updated = await prisma.employeeParticipation.update({
          where: { id },
          data: {
            approvalStatus: 'APPROVED',
            completionDate: new Date()
          }
        });

        await logActivity('SOCIAL', `${part.user.name} completed '${part.activity.title}'`);

        return NextResponse.json(updated);
      }

      if (newStatus === 'REJECTED') {
        const updated = await prisma.employeeParticipation.update({
          where: { id },
          data: {
            approvalStatus: 'REJECTED'
          }
        });

        return NextResponse.json(updated);
      }
    }

    return NextResponse.json({ error: 'No valid action specified' }, { status: 400 });
  } catch (err) {
    console.error('Error updating participation:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export async function PUT(req, ctx) { return PATCH(req, ctx); }

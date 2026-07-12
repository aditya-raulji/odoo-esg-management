import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, requireAuth } from '@/lib/auth';

// GET the OrgSettings (Admin/Auth users)
export async function GET(req) {
  const { error } = await requireAuth(req); // Any authenticated user can read settings (e.g. for carbon calculation status)
  if (error) return error;

  try {
    const data = await prisma.orgSettings.findFirst({ where: { id: 1 } });
    return NextResponse.json(data);
  } catch (err) {
    console.error('Error fetching ESG config:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH update OrgSettings (Admin only)
export async function PATCH(req) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  try {
    const body = await req.json();
    const {
      autoEmissionCalc,
      evidenceRequired,
      badgeAutoAward,
      emailAlertsCompliance,
      notifyApprovals,
      notifyPolicyReminders,
      notifyBadgeUnlocks,
      weightEnv,
      weightSocial,
      weightGov
    } = body;

    // Build update payload dynamically
    const dataToUpdate = {};
    
    if (autoEmissionCalc !== undefined) dataToUpdate.autoEmissionCalc = !!autoEmissionCalc;
    if (evidenceRequired !== undefined) dataToUpdate.evidenceRequired = !!evidenceRequired;
    if (badgeAutoAward !== undefined) dataToUpdate.badgeAutoAward = !!badgeAutoAward;
    if (emailAlertsCompliance !== undefined) dataToUpdate.emailAlertsCompliance = !!emailAlertsCompliance;
    if (notifyApprovals !== undefined) dataToUpdate.notifyApprovals = !!notifyApprovals;
    if (notifyPolicyReminders !== undefined) dataToUpdate.notifyPolicyReminders = !!notifyPolicyReminders;
    if (notifyBadgeUnlocks !== undefined) dataToUpdate.notifyBadgeUnlocks = !!notifyBadgeUnlocks;

    // If weights are provided, validate their sum is exactly 100
    if (weightEnv !== undefined || weightSocial !== undefined || weightGov !== undefined) {
      // Fetch current settings to fill missing weight values
      const current = await prisma.orgSettings.findFirst({ where: { id: 1 } });
      const wEnv = weightEnv !== undefined ? parseInt(weightEnv) : current?.weightEnv ?? 40;
      const wSoc = weightSocial !== undefined ? parseInt(weightSocial) : current?.weightSocial ?? 30;
      const wGov = weightGov !== undefined ? parseInt(weightGov) : current?.weightGov ?? 30;

      if (isNaN(wEnv) || isNaN(wSoc) || isNaN(wGov) || wEnv < 0 || wSoc < 0 || wGov < 0) {
        return NextResponse.json({ error: 'Weights must be non-negative integers' }, { status: 400 });
      }

      if (wEnv + wSoc + wGov !== 100) {
        return NextResponse.json({
          error: `Weights must total exactly 100. Current total: ${wEnv + wSoc + wGov}`
        }, { status: 400 });
      }

      dataToUpdate.weightEnv = wEnv;
      dataToUpdate.weightSocial = wSoc;
      dataToUpdate.weightGov = wGov;
    }

    const updated = await prisma.orgSettings.upsert({
      where: { id: 1 },
      update: dataToUpdate,
      create: {
        id: 1,
        autoEmissionCalc: autoEmissionCalc !== undefined ? !!autoEmissionCalc : true,
        evidenceRequired: evidenceRequired !== undefined ? !!evidenceRequired : true,
        badgeAutoAward: badgeAutoAward !== undefined ? !!badgeAutoAward : true,
        emailAlertsCompliance: emailAlertsCompliance !== undefined ? !!emailAlertsCompliance : true,
        notifyApprovals: notifyApprovals !== undefined ? !!notifyApprovals : true,
        notifyPolicyReminders: notifyPolicyReminders !== undefined ? !!notifyPolicyReminders : true,
        notifyBadgeUnlocks: notifyBadgeUnlocks !== undefined ? !!notifyBadgeUnlocks : true,
        weightEnv: weightEnv !== undefined ? parseInt(weightEnv) : 40,
        weightSocial: weightSocial !== undefined ? parseInt(weightSocial) : 30,
        weightGov: weightGov !== undefined ? parseInt(weightGov) : 30,
      }
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error('Error updating ESG config:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
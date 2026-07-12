/**
 * lib/badges.js — Badge Auto-Award Engine (Section-8 Business Rule)
 *
 * checkAndAwardBadges(userId): evaluates every Badge's unlock rule against the user's
 * current stats. If satisfied, not already owned, and OrgSettings.badgeAutoAward is ON
 * → creates UserBadge + sends badge_unlock notification.
 *
 * Must be called after every XP credit operation.
 */

import { prisma } from '@/lib/prisma';
import { notify } from '@/lib/notify';

/**
 * Evaluate and award any newly-earned badges for a user.
 * @param {number} userId
 */
export async function checkAndAwardBadges(userId) {
  try {
    // Check org setting
    const settings = await prisma.orgSettings.findFirst({ where: { id: 1 } });
    if (!settings?.badgeAutoAward) return;

    // Fetch user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, xp: true }
    });
    if (!user) return;

    // Count approved challenge participations
    const challengesCompleted = await prisma.challengeParticipation.count({
      where: { userId, approvalStatus: 'APPROVED' }
    });

    // Count approved CSR participations
    const csrCompleted = await prisma.employeeParticipation.count({
      where: { userId, approvalStatus: 'APPROVED' }
    });

    // Fetch all badges
    const badges = await prisma.badge.findMany();

    // Fetch already-owned badges
    const ownedBadges = await prisma.userBadge.findMany({
      where: { userId },
      select: { badgeId: true }
    });
    const ownedIds = new Set(ownedBadges.map((b) => b.badgeId));

    const newlyAwarded = [];

    for (const badge of badges) {
      if (ownedIds.has(badge.id)) continue; // Already owned

      let unlocked = false;

      switch (badge.unlockRuleType) {
        case 'XP_THRESHOLD':
          unlocked = user.xp >= badge.unlockValue;
          break;
        case 'CHALLENGES_COMPLETED':
          unlocked = challengesCompleted >= badge.unlockValue;
          break;
        case 'CSR_COMPLETED':
          unlocked = csrCompleted >= badge.unlockValue;
          break;
        default:
          break;
      }

      if (unlocked) {
        await prisma.userBadge.create({
          data: { userId, badgeId: badge.id }
        });
        newlyAwarded.push(badge);
      }
    }

    // Send notifications for newly-awarded badges (respects notifyBadgeUnlocks)
    if (newlyAwarded.length > 0 && settings.notifyBadgeUnlocks) {
      for (const badge of newlyAwarded) {
        await notify({
          userIds: userId,
          type: 'BADGE',
          title: '🏅 Badge Unlocked!',
          message: `You unlocked the "${badge.name}" badge! ${badge.description}`,
          link: '/gamification/badges'
        });
      }
    }

    return newlyAwarded;
  } catch (err) {
    // Non-fatal — badge check should never break the parent flow
    console.error('Badge engine error:', err);
    return [];
  }
}

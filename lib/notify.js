import { prisma } from './prisma';

// Type mapping to OrgSettings fields
const SETTING_MAP = {
  CSR: 'notifyApprovals',
  CHALLENGE: 'notifyApprovals',
  BADGE: 'notifyBadgeUnlocks',
  POLICY: 'notifyPolicyReminders',
  COMPLIANCE: 'emailAlertsCompliance', // Compliance issues alert
};

/**
 * Platform-wide Notification Engine
 * Bulk-creates Notification records depending on system-wide OrgSettings preferences.
 * 
 * @param {Object} options
 * @param {number|number[]} [options.userIds] - Single user ID or array of user IDs
 * @param {number} [options.departmentId] - Target department to notify all employees
 * @param {string} [options.role] - Target role (e.g. 'ADMIN') to notify
 * @param {string} options.type - Notification type ('CSR' | 'CHALLENGE' | 'BADGE' | 'POLICY' | 'COMPLIANCE')
 * @param {string} options.title - Notification title
 * @param {string} options.message - Detailed notification message
 * @param {string} [options.link] - Optional destination URL
 */
export async function notify({ userIds, departmentId, role, type, title, message, link }) {
  try {
    // 1. Fetch OrgSettings first
    const settings = await prisma.orgSettings.findFirst({ where: { id: 1 } });
    
    // Check if notification toggle is enabled for this type
    const preferenceField = SETTING_MAP[type];
    if (preferenceField && settings && !settings[preferenceField]) {
      console.log(`[Notification Engine] Bypassing ${type} notification: toggle is disabled.`);
      return { success: false, bypassed: true };
    }

    // 2. Resolve list of target user IDs
    let targetUserIds = [];

    if (userIds) {
      targetUserIds = Array.isArray(userIds) ? userIds : [userIds];
    } else if (departmentId) {
      const users = await prisma.user.findMany({
        where: { departmentId: parseInt(departmentId), status: 'Active' },
        select: { id: true }
      });
      targetUserIds = users.map((u) => u.id);
    } else if (role) {
      const users = await prisma.user.findMany({
        where: { role, status: 'Active' },
        select: { id: true }
      });
      targetUserIds = users.map((u) => u.id);
    }

    if (targetUserIds.length === 0) {
      return { success: true, count: 0 };
    }

    // 3. Bulk create Notification records
    const notificationsData = targetUserIds.map((uid) => ({
      userId: uid,
      type,
      title,
      message,
      link: link || null,
      read: false
    }));

    await prisma.notification.createMany({
      data: notificationsData
    });

    console.log(`[Notification Engine] Dispatched ${notificationsData.length} notifications of type ${type}`);
    return { success: true, count: notificationsData.length };
  } catch (err) {
    console.error('[Notification Engine] Failed to dispatch notifications:', err);
    return { success: false, error: err.message };
  }
}

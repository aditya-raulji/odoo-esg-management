import { prisma } from './prisma';

/**
 * Platform-wide Activity Log Service
 * Logs system events to the database ActivityLog table.
 * 
 * @param {string} type - Event type (e.g., 'CHALLENGE', 'COMPLIANCE', 'CARBON', 'POLICY', 'DEPT', 'CAT')
 * @param {string} message - Human-readable message describing the event
 */
export async function logActivity(type, message) {
  try {
    const log = await prisma.activityLog.create({
      data: {
        type: type.toUpperCase(),
        message
      }
    });
    console.log(`[Activity Log] logged event: [${type}] ${message}`);
    return log;
  } catch (err) {
    console.error('[Activity Log] Failed to log activity:', err);
    return null;
  }
}

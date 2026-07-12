'use client';

/**
 * StatusPill — colored pill badge based on status string
 * 
 * Mapping:
 *  Active, On Track → green
 *  Completed, Approved, Resolved → blue/green
 *  Under Review → purple
 *  Pending → amber
 *  Open, High → red
 *  Medium → orange
 *  Draft, Archived → muted
 *  Low → green
 *  Fulfilled → blue
 */

const statusMap = {
  // Green
  'active': { bg: 'bg-green-500/15', text: 'text-green-400', dot: 'bg-green-400' },
  'on track': { bg: 'bg-green-500/15', text: 'text-green-400', dot: 'bg-green-400' },
  'approved': { bg: 'bg-green-500/15', text: 'text-green-400', dot: 'bg-green-400' },
  'resolved': { bg: 'bg-green-500/15', text: 'text-green-400', dot: 'bg-green-400' },
  'low': { bg: 'bg-green-500/15', text: 'text-green-400', dot: 'bg-green-400' },

  // Blue
  'completed': { bg: 'bg-blue-500/15', text: 'text-blue-400', dot: 'bg-blue-400' },
  'fulfilled': { bg: 'bg-blue-500/15', text: 'text-blue-400', dot: 'bg-blue-400' },
  'closed': { bg: 'bg-blue-500/15', text: 'text-blue-400', dot: 'bg-blue-400' },

  // Purple
  'under review': { bg: 'bg-purple-500/15', text: 'text-purple-400', dot: 'bg-purple-400' },
  'under_review': { bg: 'bg-purple-500/15', text: 'text-purple-400', dot: 'bg-purple-400' },
  'planned': { bg: 'bg-purple-500/15', text: 'text-purple-400', dot: 'bg-purple-400' },

  // Amber
  'pending': { bg: 'bg-amber-500/15', text: 'text-amber-400', dot: 'bg-amber-400' },
  'warning': { bg: 'bg-amber-500/15', text: 'text-amber-400', dot: 'bg-amber-400' },

  // Red
  'open': { bg: 'bg-red-500/15', text: 'text-red-400', dot: 'bg-red-400' },
  'high': { bg: 'bg-red-500/15', text: 'text-red-400', dot: 'bg-red-400' },
  'rejected': { bg: 'bg-red-500/15', text: 'text-red-400', dot: 'bg-red-400' },
  'danger': { bg: 'bg-red-500/15', text: 'text-red-400', dot: 'bg-red-400' },

  // Orange
  'medium': { bg: 'bg-orange-500/15', text: 'text-orange-400', dot: 'bg-orange-400' },

  // Muted / Grey
  'draft': { bg: 'bg-white/5', text: 'text-[var(--muted)]', dot: 'bg-[var(--muted)]' },
  'archived': { bg: 'bg-white/5', text: 'text-[var(--muted)]', dot: 'bg-[var(--muted)]' },
  'inactive': { bg: 'bg-white/5', text: 'text-[var(--muted)]', dot: 'bg-[var(--muted)]' },
};

export default function StatusPill({ status, className = '' }) {
  const key = (status || '').toLowerCase().replace(/_/g, ' ');
  const style = statusMap[key] || { bg: 'bg-white/5', text: 'text-[var(--muted)]', dot: 'bg-[var(--muted)]' };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

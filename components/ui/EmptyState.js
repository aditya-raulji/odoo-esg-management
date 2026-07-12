'use client';

import { Inbox } from 'lucide-react';

/**
 * EmptyState — shown when tables/lists have no data
 */
export default function EmptyState({
  icon: Icon = Inbox,
  title = 'No data yet',
  description,
  action,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-14 h-14 rounded-full bg-[var(--panel2)] flex items-center justify-center mb-4">
        <Icon size={24} className="text-[var(--muted)]" />
      </div>
      <h3 className="text-sm font-semibold text-[var(--text)] mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-[var(--muted)] max-w-xs">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

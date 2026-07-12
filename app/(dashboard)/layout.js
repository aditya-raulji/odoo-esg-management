// app/(dashboard)/layout.js
// Protected app shell — sidebar + topbar

import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ToastProvider } from '@/components/ui/Toast';
import DashboardShell from './DashboardShell';

export default async function DashboardLayout({ children }) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  // Get unread notification count
  let unreadCount = 0;
  try {
    unreadCount = await prisma.notification.count({
      where: { userId: session.id, read: false },
    });
  } catch {
    // DB may not be seeded yet
  }

  return (
    <ToastProvider>
      <DashboardShell session={session} unreadCount={unreadCount}>
        {children}
      </DashboardShell>
    </ToastProvider>
  );
}

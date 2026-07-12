'use client';

import { useRouter } from 'next/navigation';
import Sidebar from '@/components/ui/Sidebar';
import TopBar from '@/components/ui/TopBar';

export default function DashboardShell({ session, unreadCount, children }) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <Sidebar session={session} unreadCount={unreadCount} />
      <TopBar session={session} unreadCount={unreadCount} onLogout={handleLogout} />

      {/* Main content area */}
      <main className="lg:ml-64 pt-14 min-h-screen">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}

import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import Card from '@/components/ui/Card';
import { ShieldAlert } from 'lucide-react';

export default async function SettingsLayout({ children }) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  // Admin-only guard: all /settings routes return 403 for EMPLOYEE role
  if (session.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center min-h-[70vh] p-4">
        <Card className="max-w-md w-full text-center space-y-4 py-8 px-6">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
            <ShieldAlert className="text-[var(--red)]" size={24} />
          </div>
          <h2 className="text-xl font-bold text-[var(--text)]" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
            403 — Forbidden
          </h2>
          <p className="text-sm text-[var(--muted)]">
            Access Denied. You do not have the administrative privileges required to view or configure platform settings.
          </p>
          <div className="pt-2">
            <a
              href="/"
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-lg bg-[var(--blue)] text-white hover:bg-blue-500 transition-colors"
            >
              Back to Dashboard
            </a>
          </div>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

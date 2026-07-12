'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, ChevronDown, LogOut, User } from 'lucide-react';
import { getInitials } from '@/lib/utils';

const TOP_TABS = [
  { label: 'Dashboard', prefix: '' },
  { label: 'Environmental', prefix: 'environmental' },
  { label: 'Social', prefix: 'social' },
  { label: 'Governance', prefix: 'governance' },
  { label: 'Gamification', prefix: 'gamification' },
  { label: 'Reports', prefix: 'reports' },
  { label: 'Settings', prefix: 'settings' },
];

const TAB_HREFS = {
  Dashboard: '/',
  Environmental: '/environmental/emission-factors',
  Social: '/social/csr-activities',
  Governance: '/governance/policies',
  Gamification: '/gamification/challenges',
  Reports: '/reports/esg-summary',
  Settings: '/settings/departments',
};

const MODULE_TITLES = {
  '': 'Dashboard',
  environmental: 'Environmental',
  social: 'Social',
  governance: 'Governance',
  gamification: 'Gamification',
  reports: 'Reports',
  settings: 'Settings',
};

export default function TopBar({ session, unreadCount = 0, onLogout }) {
  const pathname = usePathname();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const segments = pathname.split('/').filter(Boolean);
  const currentModule = segments[0] || '';
  const moduleTitle = MODULE_TITLES[currentModule] || 'EcoSphere';

  const getActiveTab = () => {
    if (pathname === '/') return 'Dashboard';
    const seg = segments[0];
    return Object.keys(TAB_HREFS).find((k) => k.toLowerCase() === seg) || 'Dashboard';
  };

  const activeTab = getActiveTab();

  return (
    <header className="fixed top-0 left-0 right-0 lg:left-64 h-14 bg-[var(--panel)]/95 backdrop-blur-sm border-b border-[var(--border)] z-20 flex items-center">
      {/* Left — title */}
      <div className="hidden lg:flex items-center px-5 h-full border-r border-[var(--border)] min-w-0">
        <span className="text-sm font-semibold text-[var(--text)] whitespace-nowrap">
          EcoSphere:{' '}
          <span className="text-[var(--blue)]">{moduleTitle}</span>
        </span>
      </div>

      {/* Center — Tab strip */}
      <div className="flex-1 overflow-x-auto flex items-end h-full px-4 lg:px-2">
        <div className="flex items-center gap-1 h-full">
          {TOP_TABS.map(({ label }) => {
            const isActive = label === activeTab;
            return (
              <Link
                key={label}
                href={TAB_HREFS[label]}
                id={`tab-${label.toLowerCase()}`}
                className={`px-3 py-0 h-full flex items-center text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-[var(--blue)] text-[var(--text)]'
                    : 'border-transparent text-[var(--muted)] hover:text-[var(--text)]'
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Right — Bell + User */}
      <div className="flex items-center gap-2 px-4 shrink-0">
        {/* Notification bell */}
        <Link
          href="/notifications"
          id="notif-bell"
          className="relative p-2 rounded-lg text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--panel2)] transition-colors"
          aria-label={`${unreadCount} unread notifications`}
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[var(--red)] text-white text-[9px] font-bold flex items-center justify-center leading-none">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        {/* User chip */}
        <div className="relative">
          <button
            id="user-chip"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[var(--panel2)] transition-colors text-sm"
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{ background: 'linear-gradient(135deg, var(--blue), var(--purple))' }}
            >
              {getInitials(session?.name || 'U')}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-medium text-[var(--text)] leading-tight">{session?.name}</p>
              <p className="text-[10px] text-[var(--muted)] leading-tight capitalize">{session?.role?.toLowerCase()}</p>
            </div>
            <ChevronDown size={13} className="text-[var(--muted)] hidden sm:block" />
          </button>

          {userMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setUserMenuOpen(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-48 bg-[var(--panel)] border border-[var(--border)] rounded-xl shadow-2xl z-20 overflow-hidden">
                <div className="px-4 py-3 border-b border-[var(--border)]">
                  <p className="text-sm font-medium text-[var(--text)]">{session?.name}</p>
                  <p className="text-xs text-[var(--muted)] truncate">{session?.email}</p>
                  <span className="text-[10px] bg-[var(--panel2)] text-[var(--muted)] px-2 py-0.5 rounded mt-1 inline-block capitalize">
                    {session?.role?.toLowerCase()}
                  </span>
                </div>
                <div className="py-1">
                  <button
                    id="user-menu-logout"
                    onClick={onLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-[var(--muted)] hover:text-[var(--red)] hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut size={14} />
                    Sign out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

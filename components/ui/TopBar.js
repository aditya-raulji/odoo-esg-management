'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bell,
  ChevronDown,
  LogOut,
  Check,
  CheckSquare,
  BookOpen,
  AlertTriangle,
  Medal,
  Zap,
  HeartHandshake,
  MessageSquare
} from 'lucide-react';
import { getInitials } from '@/lib/utils';
import { useToast } from './Toast';

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

function getRelativeTime(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${diffDay}d ago`;
}

function getNotifIcon(type) {
  switch (type) {
    case 'CSR':
      return <HeartHandshake size={14} className="text-[var(--blue)]" />;
    case 'CHALLENGE':
      return <Zap size={14} className="text-[var(--orange)]" />;
    case 'BADGE':
      return <Medal size={14} className="text-[var(--green)]" />;
    case 'POLICY':
      return <BookOpen size={14} className="text-[var(--purple)]" />;
    case 'COMPLIANCE':
      return <AlertTriangle size={14} className="text-[var(--red)]" />;
    default:
      return <MessageSquare size={14} className="text-[var(--muted)]" />;
  }
}

export default function TopBar({ session, unreadCount: initialUnreadCount = 0, onLogout }) {
  const pathname = usePathname();
  const toast = useToast();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const bellRef = useRef(null);

  const segments = pathname.split('/').filter(Boolean);
  const currentModule = segments[0] || '';
  const moduleTitle = MODULE_TITLES[currentModule] || 'EcoSphere';

  const getActiveTab = () => {
    if (pathname === '/') return 'Dashboard';
    const seg = segments[0];
    return Object.keys(TAB_HREFS).find((k) => k.toLowerCase() === seg) || 'Dashboard';
  };

  const activeTab = getActiveTab();

  // Load and refresh notifications
  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
        const unread = data.filter((n) => !n.read).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Handle outside clicks to close dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      if (bellRef.current && !bellRef.current.contains(event.target)) {
        setBellOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (err) {
      console.error('Error marking read', err);
    }
  };

  const markAllRead = async () => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST'
      });
      if (res.ok) {
        toast.success('Notifications', 'All notifications marked as read.');
        fetchNotifications();
      }
    } catch (err) {
      console.error('Error marking all read', err);
    }
  };

  const latestNotifs = notifications.slice(0, 8);

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
            // Hide settings tab for employees
            if (label === 'Settings' && session?.role === 'EMPLOYEE') {
              return null;
            }
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
        {/* Notification bell and dropdown */}
        <div className="relative" ref={bellRef}>
          <button
            id="notif-bell"
            onClick={() => setBellOpen(!bellOpen)}
            className={`relative p-2 rounded-lg transition-colors cursor-pointer ${
              bellOpen ? 'text-[var(--text)] bg-[var(--panel2)]' : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--panel2)]'
            }`}
            aria-label={`${unreadCount} unread notifications`}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[var(--red)] text-white text-[9px] font-bold flex items-center justify-center leading-none">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {bellOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-[var(--panel)] border border-[var(--border)] rounded-xl shadow-2xl z-30 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Dropdown Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
                <span className="text-xs font-semibold text-[var(--text)]">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[10px] text-[var(--blue)] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <CheckSquare size={10} /> Mark all read
                  </button>
                )}
              </div>

              {/* Notification List */}
              <div className="max-h-64 overflow-y-auto divide-y divide-[var(--border)]">
                {notifications.length === 0 ? (
                  <div className="px-4 py-6 text-center text-xs text-[var(--muted)]">
                    No notifications
                  </div>
                ) : (
                  latestNotifs.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => !n.read && markAsRead(n.id)}
                      className={`px-4 py-2.5 text-left transition-colors flex gap-2.5 items-start cursor-pointer hover:bg-[var(--panel2)] ${
                        n.read ? 'opacity-60' : 'bg-[var(--panel2)]/30'
                      }`}
                    >
                      <div className="mt-1 shrink-0 p-1 rounded-md bg-[var(--bg)] border border-[var(--border)]">
                        {getNotifIcon(n.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline gap-1">
                          <p className={`text-xs font-semibold truncate ${n.read ? 'text-[var(--text)]' : 'text-[var(--blue)]'}`}>
                            {n.title}
                          </p>
                          <span className="text-[9px] text-[var(--muted)] shrink-0">
                            {getRelativeTime(n.createdAt)}
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--muted)] leading-normal mt-0.5 line-clamp-2">
                          {n.message}
                        </p>
                      </div>
                      {!n.read && (
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--blue)] mt-1.5 shrink-0" />
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Dropdown Footer */}
              <div className="border-t border-[var(--border)] bg-[var(--panel2)]">
                <Link
                  href="/notifications"
                  onClick={() => setBellOpen(false)}
                  className="block text-center py-2 text-xs text-[var(--muted)] hover:text-[var(--text)] font-semibold transition-colors"
                >
                  View all
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User chip */}
        <div className="relative">
          <button
            id="user-chip"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[var(--panel2)] transition-colors text-sm cursor-pointer"
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
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-[var(--muted)] hover:text-[var(--red)] hover:bg-red-500/10 transition-colors cursor-pointer"
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

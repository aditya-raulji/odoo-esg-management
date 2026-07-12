'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Leaf,
  LayoutDashboard,
  Factory,
  Wind,
  Package,
  Wallet,
  Target,
  Users,
  HeartHandshake,
  BarChart3,
  ShieldCheck,
  BookOpen,
  ClipboardCheck,
  AlertTriangle,
  Trophy,
  Zap,
  Medal,
  Gift,
  TrendingUp,
  FileText,
  Settings,
  Building2,
  Tag,
  Sliders,
  Bell,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  User,
} from 'lucide-react';
import { getInitials } from '@/lib/utils';

const NAV_TREE = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/',
    accent: '--blue',
  },
  {
    id: 'environmental',
    label: 'Environmental',
    icon: Leaf,
    accent: '--green',
    children: [
      { id: 'emission-factors', label: 'Emission Factors', icon: Wind, href: '/environmental/emission-factors' },
      { id: 'product-esg', label: 'Product ESG Profiles', icon: Package, href: '/environmental/product-esg-profiles' },
      { id: 'carbon-tx', label: 'Carbon Transactions', icon: Wallet, href: '/environmental/carbon-transactions' },
      { id: 'goals', label: 'Environmental Goals', icon: Target, href: '/environmental/goals' },
    ],
  },
  {
    id: 'social',
    label: 'Social',
    icon: Users,
    accent: '--blue',
    children: [
      { id: 'csr', label: 'CSR Activities', icon: HeartHandshake, href: '/social/csr-activities' },
      { id: 'participation', label: 'Employee Participation', icon: Users, href: '/social/employee-participation' },
      { id: 'diversity', label: 'Diversity Dashboard', icon: BarChart3, href: '/social/diversity' },
    ],
  },
  {
    id: 'governance',
    label: 'Governance',
    icon: ShieldCheck,
    accent: '--purple',
    children: [
      { id: 'policies', label: 'Policies', icon: BookOpen, href: '/governance/policies' },
      { id: 'acks', label: 'Policy Acknowledgements', icon: ClipboardCheck, href: '/governance/acknowledgements' },
      { id: 'audits', label: 'Audits', icon: ShieldCheck, href: '/governance/audits' },
      { id: 'compliance', label: 'Compliance Issues', icon: AlertTriangle, href: '/governance/compliance-issues' },
    ],
  },
  {
    id: 'gamification',
    label: 'Gamification',
    icon: Trophy,
    accent: '--orange',
    children: [
      { id: 'challenges', label: 'Challenges', icon: Zap, href: '/gamification/challenges' },
      { id: 'challenge-participation', label: 'Challenge Participation', icon: Users, href: '/gamification/challenge-participation' },
      { id: 'badges', label: 'Badges', icon: Medal, href: '/gamification/badges' },
      { id: 'rewards', label: 'Rewards', icon: Gift, href: '/gamification/rewards' },
      { id: 'leaderboard', label: 'Leaderboard', icon: TrendingUp, href: '/gamification/leaderboard' },
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: FileText,
    accent: '--muted',
    children: [
      { id: 'env-report', label: 'Environmental Report', icon: Leaf, href: '/reports/environmental' },
      { id: 'social-report', label: 'Social Report', icon: Users, href: '/reports/social' },
      { id: 'gov-report', label: 'Governance Report', icon: ShieldCheck, href: '/reports/governance' },
      { id: 'esg-summary', label: 'ESG Summary', icon: BarChart3, href: '/reports/esg-summary' },
      { id: 'custom-report', label: 'Custom Report Builder', icon: Sliders, href: '/reports/custom' },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    accent: '--muted',
    children: [
      { id: 'departments', label: 'Departments', icon: Building2, href: '/settings/departments' },
      { id: 'categories', label: 'Categories', icon: Tag, href: '/settings/categories' },
      { id: 'esg-config', label: 'ESG Configuration', icon: Sliders, href: '/settings/esg-config' },
      { id: 'notif-settings', label: 'Notification Settings', icon: Bell, href: '/settings/notifications' },
    ],
  },
];

const TOP_TABS = [
  { label: 'Dashboard', href: '/' },
  { label: 'Environmental', href: '/environmental/emission-factors' },
  { label: 'Social', href: '/social/csr-activities' },
  { label: 'Governance', href: '/governance/policies' },
  { label: 'Gamification', href: '/gamification/challenges' },
  { label: 'Reports', href: '/reports/esg-summary' },
  { label: 'Settings', href: '/settings/departments' },
];

function getActiveModule(pathname) {
  if (pathname === '/') return 'dashboard';
  const segment = pathname.split('/')[1];
  return segment || 'dashboard';
}

export default function Sidebar({ session, unreadCount = 0 }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({});
  const [loggingOut, setLoggingOut] = useState(false);

  const activeModule = getActiveModule(pathname);

  // Auto-expand the active group
  useEffect(() => {
    const active = NAV_TREE.find(
      (item) =>
        item.children?.some((child) => pathname.startsWith(child.href)) ||
        (item.href && pathname === item.href)
    );
    if (active?.id) {
      setExpandedGroups((prev) => ({ ...prev, [active.id]: true }));
    }
  }, [pathname]);

  const toggleGroup = (id) => {
    setExpandedGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const activeTab = TOP_TABS.find(
    (t) => t.href === '/' ? pathname === '/' : pathname.startsWith('/' + t.label.toLowerCase())
  );

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-[var(--panel)] border-r border-[var(--border)] z-40 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 h-14 border-b border-[var(--border)] shrink-0">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #22C55E, #16a34a)' }}
          >
            <Leaf size={15} className="text-white" />
          </div>
          <span
            className="font-bold text-sm"
            style={{ fontFamily: 'var(--font-space-grotesk)' }}
          >
            EcoSphere
          </span>
          <button
            className="ml-auto lg:hidden text-[var(--muted)] hover:text-[var(--text)]"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav tree */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {NAV_TREE.map((item) => {
            const Icon = item.icon;
            const isActive = item.href
              ? pathname === item.href
              : item.children?.some((c) => pathname.startsWith(c.href));
            const isExpanded = expandedGroups[item.id];
            const accentColor = `var(${item.accent})`;

            if (!item.children) {
              // Single item (Dashboard)
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-0.5 ${
                    isActive
                      ? 'text-[var(--text)]'
                      : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--panel2)]'
                  }`}
                  style={
                    isActive
                      ? {
                          background: `${accentColor}18`,
                          color: accentColor,
                        }
                      : {}
                  }
                >
                  <Icon size={16} style={isActive ? { color: accentColor } : {}} />
                  {item.label}
                </Link>
              );
            }

            return (
              <div key={item.id} className="mb-1">
                {/* Group header */}
                <button
                  onClick={() => toggleGroup(item.id)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors hover:bg-[var(--panel2)]"
                  style={{ color: isActive ? accentColor : `var(--muted)` }}
                >
                  <Icon size={15} />
                  <span className="flex-1 text-left text-xs uppercase tracking-wider">{item.label}</span>
                  {isExpanded ? (
                    <ChevronDown size={13} />
                  ) : (
                    <ChevronRight size={13} />
                  )}
                </button>

                {/* Children */}
                {isExpanded && (
                  <div className="ml-3 mt-0.5 pl-3 border-l border-[var(--border)] space-y-0.5">
                    {item.children.map((child) => {
                      const ChildIcon = child.icon;
                      const childActive = pathname === child.href || pathname.startsWith(child.href + '/');
                      return (
                        <Link
                          key={child.id}
                          href={child.href}
                          onClick={() => setSidebarOpen(false)}
                          className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                            childActive
                              ? 'font-medium'
                              : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--panel2)]'
                          }`}
                          style={
                            childActive
                              ? {
                                  background: `${accentColor}14`,
                                  color: accentColor,
                                }
                              : {}
                          }
                        >
                          <ChildIcon size={14} />
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* User chip at bottom */}
        <div className="border-t border-[var(--border)] p-3">
          <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-[var(--panel2)] transition-colors">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{ background: 'linear-gradient(135deg, var(--blue), var(--purple))' }}
            >
              {getInitials(session?.name || 'U')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--text)] truncate">{session?.name}</p>
              <p className="text-xs text-[var(--muted)] truncate capitalize">{session?.role?.toLowerCase()}</p>
            </div>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--red)] hover:bg-red-500/10 transition-colors"
              title="Sign out"
              id="logout-btn"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile menu button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-[var(--panel)] border border-[var(--border)] text-[var(--text)]"
        onClick={() => setSidebarOpen(true)}
        id="sidebar-mobile-btn"
        aria-label="Open navigation"
      >
        <Menu size={18} />
      </button>
    </>
  );
}

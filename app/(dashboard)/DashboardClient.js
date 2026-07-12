'use client';

import { Leaf, ShieldCheck, Users, Zap, Target, AlertTriangle, TrendingUp, Activity, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  RadialBarChart,
  RadialBar,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';
import StatusPill from '@/components/ui/StatusPill';
import { formatNumber, formatCO2 } from '@/lib/utils';

function KPITile({ title, value, subtitle, icon: Icon, accent, trend, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`bg-[var(--panel)] border border-[var(--border)] rounded-xl p-5 flex flex-col gap-3 transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:border-[var(--muted)] hover:scale-[1.01]' : ''
      }`}
      style={{ borderTop: `3px solid var(${accent})` }}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">{title}</p>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: `var(${accent})18` }}
        >
          <Icon size={16} style={{ color: `var(${accent})` }} />
        </div>
      </div>
      <div>
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-extrabold text-[var(--text)] font-space">{value}</p>
          {trend && trend !== 'neutral' && (
            <span
              className={`text-xs font-bold ${
                trend === 'up' ? 'text-[var(--green)]' : 'text-[var(--red)]'
              }`}
            >
              {trend === 'up' ? '▲' : '▼'}
            </span>
          )}
        </div>
        {subtitle && <p className="text-xs text-[var(--muted)] mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}

const ESG_GAUGE_DATA = (env, social, gov) => [
  { name: 'Governance', value: gov, fill: 'var(--purple)' },
  { name: 'Social', value: social, fill: 'var(--blue)' },
  { name: 'Environmental', value: env, fill: 'var(--green)' },
];

export default function DashboardClient({ session, data }) {
  const { orgScores, activeGoals, openIssues, activeChallenges, recentActivity, carbonTrend, topUsers } = data;
  const router = useRouter();

  const gaugeData = ESG_GAUGE_DATA(orgScores.env, orgScores.social, orgScores.gov);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Dashboard</h1>
          <p className="text-sm text-[var(--muted)] mt-0.5">
            Welcome back, {session?.name}! Here&apos;s your ESG overview.
          </p>
        </div>
        <button
          onClick={() => router.push('/environmental/carbon-transactions')}
          className="flex items-center gap-2 px-4 py-2.5 bg-[var(--green)]/20 border border-[var(--green)]/40 text-[var(--green)] rounded-xl text-sm font-semibold hover:bg-[var(--green)]/30 transition-colors"
        >
          <Plus size={14} /> Log Carbon Data
        </button>
      </div>

      {/* ESG Score Tiles */}
      <div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPITile
            title="Overall ESG Score"
            value={`${orgScores.overall} / 100`}
            subtitle="Weighted ESG Score"
            icon={TrendingUp}
            accent="--blue"
            trend={orgScores.overallTrend}
            onClick={() => router.push('/reports/esg-summary')}
          />
          <KPITile
            title="Environmental"
            value={`${orgScores.env} / 100`}
            subtitle="Environmental goals & carbon"
            icon={Leaf}
            accent="--green"
            trend={orgScores.envTrend}
            onClick={() => router.push('/environmental/goals')}
          />
          <KPITile
            title="Social"
            value={`${orgScores.social} / 100`}
            subtitle="CSR activities & training"
            icon={Users}
            accent="--blue"
            trend={orgScores.socialTrend}
            onClick={() => router.push('/social/csr-activities')}
          />
          <KPITile
            title="Governance"
            value={`${orgScores.gov} / 100`}
            subtitle="Audits, policies & compliance"
            icon={ShieldCheck}
            accent="--purple"
            trend={orgScores.govTrend}
            onClick={() => router.push('/governance/audits')}
          />
        </div>
        <p className="text-xs text-[var(--muted)] mt-2 font-mono">
          Features: live KPI tiles · trend arrows · click-through to module
        </p>
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <KPITile
          title="Active Goals"
          value={activeGoals}
          subtitle="Environmental targets"
          icon={Target}
          accent="--green"
        />
        <KPITile
          title="Open Issues"
          value={openIssues}
          subtitle="Compliance issues"
          icon={AlertTriangle}
          accent="--red"
        />
        <KPITile
          title="Active Challenges"
          value={activeChallenges}
          subtitle="Gamification"
          icon={Zap}
          accent="--orange"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Carbon emissions trend */}
        <Card className="lg:col-span-2" padding={false}>
          <CardHeader className="p-5 pb-0">
            <CardTitle>Emissions Trend (12 mo)</CardTitle>
            <span className="text-xs text-[var(--muted)]">Last 12 months</span>
          </CardHeader>
          <div className="p-5 pt-3 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={carbonTrend} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="co2Gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--green)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--green)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: 'var(--muted)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'var(--muted)' }}
                  axisLine={false}
                  tickLine={false}
                  width={45}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--panel)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    color: 'var(--text)',
                    fontSize: 12,
                  }}
                  formatter={(v) => [formatCO2(v), 'CO₂']}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="var(--green)"
                  strokeWidth={2}
                  fill="url(#co2Gradient)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Department ESG Ranking */}
        <Card padding={false}>
          <CardHeader className="p-5 pb-0">
            <CardTitle>Department ESG Ranking</CardTitle>
            <span className="text-xs text-[var(--muted)]">Period 2026-07</span>
          </CardHeader>
          <div className="p-5 pt-3 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={[...data.departmentScores].sort((a, b) => b.totalScore - a.totalScore)}
                margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} stroke="var(--muted)" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="deptName" stroke="var(--muted)" tick={{ fontSize: 10 }} width={75} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--panel)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    color: 'var(--text)',
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="totalScore" name="ESG Score" fill="var(--blue)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <Activity size={16} className="text-[var(--muted)]" />
          </CardHeader>
          <div className="space-y-3">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">No recent activity.</p>
            ) : (
              recentActivity.map((log) => (
                <div key={log.id} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--green)] mt-1.5 shrink-0" />
                  <div>
                    <p className="text-sm text-[var(--text)]">{log.message}</p>
                    <p className="text-xs text-[var(--muted)]">
                      {new Date(log.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
            <span className="text-xs text-[var(--muted)]">By XP</span>
          </CardHeader>
          <div className="space-y-3">
            {topUsers.map((user, i) => (
              <div key={user.id} className="flex items-center gap-3">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{
                    background:
                      i === 0
                        ? 'linear-gradient(135deg, #F59E0B, #D97706)'
                        : i === 1
                        ? 'linear-gradient(135deg, #9CA3AF, #6B7280)'
                        : i === 2
                        ? 'linear-gradient(135deg, #CD7C2F, #A0522D)'
                        : 'var(--panel2)',
                  }}
                >
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text)] truncate">{user.name}</p>
                  <p className="text-xs text-[var(--muted)] truncate">{user.department}</p>
                </div>
                <span className="text-sm font-semibold text-[var(--text)]">
                  {formatNumber(user.xp)} XP
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

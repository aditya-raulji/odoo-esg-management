'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { Shield, ShieldAlert, CheckCircle, AlertTriangle, FileText, Users } from 'lucide-react';

export default function GovernanceReportPage() {
  const [issues, setIssues] = useState([]);
  const [audits, setAudits] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [iRes, aRes, pRes] = await Promise.all([
          fetch('/api/governance/compliance-issues'),
          fetch('/api/governance/audits'),
          fetch('/api/governance/policies')
        ]);
        if (iRes.ok) setIssues(await iRes.json());
        if (aRes.ok) setAudits(await aRes.json());
        if (pRes.ok) setPolicies(await pRes.json());
      } catch {
        toast.error('Failed to load governance data');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []); // eslint-disable-line

  // Derived metrics
  const openIssues = issues.filter((i) => i.status === 'OPEN').length;
  const resolvedIssues = issues.filter((i) => i.status === 'RESOLVED').length;
  const overdueIssues = issues.filter((i) => i.status === 'OPEN' && new Date(i.dueDate) < new Date()).length;
  const completedAudits = audits.filter((a) => a.status === 'COMPLETED').length;
  const activePolicies = policies.filter((p) => p.status === 'Active').length;

  // Severity distribution
  const severityData = [
    { name: 'High', value: issues.filter((i) => i.severity === 'HIGH').length, color: '#EF4444' },
    { name: 'Medium', value: issues.filter((i) => i.severity === 'MEDIUM').length, color: '#F97316' },
    { name: 'Low', value: issues.filter((i) => i.severity === 'LOW').length, color: '#8E8E93' }
  ].filter((d) => d.value > 0);

  // Status distribution
  const statusData = [
    { name: 'Open', value: openIssues, color: '#EF4444' },
    { name: 'Resolved', value: resolvedIssues, color: '#22C55E' }
  ].filter((d) => d.value > 0);

  // Audit status distribution
  const auditStatusData = [
    { name: 'Planned', value: audits.filter((a) => a.status === 'PLANNED').length },
    { name: 'Under Review', value: audits.filter((a) => a.status === 'UNDER_REVIEW').length },
    { name: 'Completed', value: audits.filter((a) => a.status === 'COMPLETED').length }
  ];

  // Issues per department
  const deptMap = {};
  issues.forEach((i) => {
    const dept = i.department?.name || 'Unknown';
    deptMap[dept] = (deptMap[dept] || 0) + 1;
  });
  const deptData = Object.entries(deptMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const CHART_STYLE = {
    contentStyle: {
      backgroundColor: 'var(--panel2)',
      borderColor: 'var(--border)',
      borderRadius: '8px',
      color: 'var(--text)',
      fontSize: '12px'
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)] tracking-tight font-space">Governance Report</h1>
        <p className="text-sm text-[var(--muted)]">Policy compliance, audit outcomes, and issue severity dashboards.</p>
      </div>

      {loading ? (
        <div className="text-center py-16 text-[var(--muted)]">Loading governance data...</div>
      ) : (
        <>
          {/* KPI Row */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { label: 'Active Policies', value: activePolicies, icon: FileText, color: 'var(--purple)' },
              { label: 'Audits Completed', value: completedAudits, icon: Shield, color: 'var(--blue)' },
              { label: 'Open Issues', value: openIssues, icon: ShieldAlert, color: 'var(--red)' },
              { label: 'Overdue Issues', value: overdueIssues, icon: AlertTriangle, color: 'var(--orange)' },
              { label: 'Resolved Issues', value: resolvedIssues, icon: CheckCircle, color: 'var(--green)' }
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="p-4 rounded-xl border border-[var(--border)] bg-[var(--panel)]">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}18`, color }}>
                    <Icon size={16} />
                  </div>
                </div>
                <p className="text-2xl font-extrabold text-[var(--text)] font-space">{value}</p>
                <p className="text-xs text-[var(--muted)] mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Issue Severity Donut */}
            <Card padding={false} className="border border-[var(--border)] bg-[var(--panel)]">
              <div className="p-5 pb-0">
                <h3 className="text-sm font-bold text-[var(--text)]">Issue Severity Distribution</h3>
              </div>
              <div className="h-56 p-4">
                {severityData.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-xs text-[var(--muted)]">No issues</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={severityData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="value">
                        {severityData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                      </Pie>
                      <Tooltip {...CHART_STYLE} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', color: 'var(--muted)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>

            {/* Issue Status Donut */}
            <Card padding={false} className="border border-[var(--border)] bg-[var(--panel)]">
              <div className="p-5 pb-0">
                <h3 className="text-sm font-bold text-[var(--text)]">Issue Status Overview</h3>
              </div>
              <div className="h-56 p-4">
                {statusData.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-xs text-[var(--muted)]">No issues</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="value">
                        {statusData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                      </Pie>
                      <Tooltip {...CHART_STYLE} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', color: 'var(--muted)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>

            {/* Audit Status Bar */}
            <Card padding={false} className="border border-[var(--border)] bg-[var(--panel)]">
              <div className="p-5 pb-0">
                <h3 className="text-sm font-bold text-[var(--text)]">Audit Status Breakdown</h3>
              </div>
              <div className="h-56 p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={auditStatusData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                    <XAxis type="number" stroke="var(--muted)" tick={{ fontSize: 11 }} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" stroke="var(--muted)" tick={{ fontSize: 11 }} width={85} />
                    <Tooltip {...CHART_STYLE} />
                    <Bar dataKey="value" name="Audits" radius={[0, 4, 4, 0]}>
                      {auditStatusData.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={entry.name === 'Completed' ? '#3B82F6' : entry.name === 'Under Review' ? '#A855F7' : '#8E8E93'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Issues per department bar */}
          {deptData.length > 0 && (
            <Card padding={false} className="border border-[var(--border)] bg-[var(--panel)]">
              <div className="p-5 pb-0">
                <h3 className="text-sm font-bold text-[var(--text)]">Compliance Issues by Department</h3>
              </div>
              <div className="h-64 p-5">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deptData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="name" stroke="var(--muted)" tick={{ fontSize: 11 }} />
                    <YAxis stroke="var(--muted)" tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip {...CHART_STYLE} />
                    <Bar dataKey="value" name="Issues" fill="#A855F7" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          {/* Recent resolved issues */}
          {resolvedIssues > 0 && (
            <Card className="border border-[var(--border)] bg-[var(--panel)]">
              <h3 className="text-sm font-bold text-[var(--text)] mb-4">Recently Resolved Issues</h3>
              <div className="space-y-2">
                {issues
                  .filter((i) => i.status === 'RESOLVED')
                  .slice(0, 5)
                  .map((issue) => (
                    <div key={issue.id} className="flex items-start justify-between gap-3 py-2 border-b border-[var(--border)]/40 last:border-0">
                      <div className="flex items-center gap-2">
                        <CheckCircle size={14} className="text-[var(--green)] shrink-0" />
                        <div>
                          <p className="text-sm text-[var(--text)]">{issue.title}</p>
                          <p className="text-xs text-[var(--muted)]">{issue.department?.name} · Owner: {issue.owner?.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--${issue.severity === 'HIGH' ? 'red' : issue.severity === 'MEDIUM' ? 'orange' : 'border'})] /15 text-[var(--${issue.severity === 'HIGH' ? 'red' : issue.severity === 'MEDIUM' ? 'orange' : 'muted'})]`}>
                          {issue.severity}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
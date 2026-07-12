'use client';

import { useState, useEffect, useCallback } from 'react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { formatDate } from '@/lib/utils';
import { Plus, Trash2, CheckCircle, AlertTriangle, ShieldAlert, Clock } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const SEVERITY_STYLES = {
  HIGH: 'bg-[var(--red)]/15 text-[var(--red)] border border-[var(--red)]/25',
  MEDIUM: 'bg-[var(--orange)]/15 text-[var(--orange)] border border-[var(--orange)]/25',
  LOW: 'bg-[var(--border)] text-[var(--muted)]'
};

const STATUS_STYLES = {
  OPEN: 'bg-[var(--red)]/15 text-[var(--red)] border border-[var(--red)]/25',
  RESOLVED: 'bg-[var(--green)]/15 text-[var(--green)] border border-[var(--green)]/25'
};

function SeverityPill({ sev }) {
  return <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${SEVERITY_STYLES[sev] || ''}`}>{sev}</span>;
}

function StatusPill({ status }) {
  return <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${STATUS_STYLES[status] || ''}`}>{status}</span>;
}

function isOverdue(issue) {
  return issue.status === 'OPEN' && new Date(issue.dueDate) < new Date();
}

export default function ComplianceIssuesPage() {
  const [issues, setIssues] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [audits, setAudits] = useState([]);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  // Create modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', severity: 'MEDIUM', departmentId: '', ownerId: '', dueDate: '', auditId: '' });
  const [submitting, setSubmitting] = useState(false);

  // Resolve modal
  const [isResolveOpen, setIsResolveOpen] = useState(false);
  const [resolveIssue, setResolveIssue] = useState(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [resolving, setResolving] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [iRes, dRes, uRes, aRes, sRes] = await Promise.all([
        fetch('/api/governance/compliance-issues'),
        fetch('/api/settings/departments'),
        fetch('/api/settings/departments'), // we'll get users separately
        fetch('/api/governance/audits'),
        fetch('/api/auth/me')
      ]);
      if (iRes.ok) setIssues(await iRes.json());
      if (dRes.ok) setDepartments(await dRes.json());
      if (aRes.ok) setAudits(await aRes.json());
      if (sRes.ok) setSession(await sRes.json());
    } catch {
      toast.error('Failed to load compliance issues');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch all users for owner dropdown
  const fetchAllUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) setEmployees(await res.json());
    } catch {}
  };

  useEffect(() => {
    fetchAll();
    fetchAllUsers();
    // Trigger overdue scan on page load (fire-and-forget)
    fetch('/api/governance/compliance-issues/overdue-scan').catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/governance/compliance-issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Compliance issue created');
        setIsCreateOpen(false);
        setForm({ title: '', description: '', severity: 'MEDIUM', departmentId: '', ownerId: '', dueDate: '', auditId: '' });
        fetchAll();
      } else {
        toast.error(data.error || 'Failed to create issue');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async () => {
    if (!resolutionNote.trim()) {
      toast.error('Please provide a resolution note');
      return;
    }
    setResolving(true);
    try {
      const res = await fetch(`/api/governance/compliance-issues/${resolveIssue.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'RESOLVED', resolutionNote: resolutionNote.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Issue resolved successfully');
        setIsResolveOpen(false);
        setResolutionNote('');
        setResolveIssue(null);
        fetchAll();
      } else {
        toast.error(data.error || 'Failed to resolve issue');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setResolving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this compliance issue?')) return;
    const res = await fetch(`/api/governance/compliance-issues/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (res.ok) { toast.success('Issue deleted'); fetchAll(); }
    else toast.error(data.error || 'Failed to delete');
  };

  const openResolve = (issue) => {
    setResolveIssue(issue);
    setResolutionNote('');
    setIsResolveOpen(true);
  };

  const isAdmin = session?.role === 'ADMIN';

  // Dashboard stats for severity chart
  const severityData = ['HIGH', 'MEDIUM', 'LOW'].map((s) => ({
    name: s,
    value: issues.filter((i) => i.severity === s).length
  })).filter((d) => d.value > 0);

  const SEVERITY_COLORS = { HIGH: '#EF4444', MEDIUM: '#F97316', LOW: '#8E8E93' };

  const openIssues = issues.filter((i) => i.status === 'OPEN').length;
  const resolvedIssues = issues.filter((i) => i.status === 'RESOLVED').length;
  const overdueCount = issues.filter(isOverdue).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)] tracking-tight font-space">Compliance Issues</h1>
          <p className="text-sm text-[var(--muted)]">Compliance issues raised from Audits — severity-tagged, resolution tracked.</p>
        </div>
        {isAdmin && (
          <Button
            variant="primary"
            onClick={() => setIsCreateOpen(true)}
            className="bg-[var(--purple)] hover:bg-[var(--purple)]/80 text-white"
          >
            <Plus size={15} className="mr-1.5" /> Raise Issue
          </Button>
        )}
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Open Issues', value: openIssues, icon: ShieldAlert, color: 'var(--red)' },
          { label: 'Overdue', value: overdueCount, icon: AlertTriangle, color: 'var(--orange)' },
          { label: 'Resolved', value: resolvedIssues, icon: CheckCircle, color: 'var(--green)' }
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="p-5 rounded-xl border border-[var(--border)] bg-[var(--panel)] flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `${color}18`, color }}>
              <Icon size={20} />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-[var(--text)] font-space">{value}</p>
              <p className="text-xs text-[var(--muted)]">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Severity Chart + Table */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Severity Donut */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-5">
          <h3 className="text-sm font-bold text-[var(--text)] mb-3">By Severity</h3>
          {severityData.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-xs text-[var(--muted)]">No issues</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={severityData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="value">
                  {severityData.map((entry) => (
                    <Cell key={entry.name} fill={SEVERITY_COLORS[entry.name]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--panel2)', borderColor: 'var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', color: 'var(--muted)' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Issues Table */}
        <div className="lg:col-span-3 rounded-xl border border-[var(--border)] bg-[var(--panel)] overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-[var(--muted)]">Loading issues...</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--muted)] text-[11px] uppercase tracking-wider">
                  <th className="text-left px-4 py-3 font-semibold">Issue</th>
                  <th className="text-left px-4 py-3 font-semibold">Severity</th>
                  <th className="text-left px-4 py-3 font-semibold">Department</th>
                  <th className="text-left px-4 py-3 font-semibold">Owner</th>
                  <th className="text-left px-4 py-3 font-semibold">Due Date</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-right px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {issues.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-[var(--muted)]">No compliance issues found.</td>
                  </tr>
                ) : issues.map((issue, i) => {
                  const overdue = isOverdue(issue);
                  return (
                    <tr key={issue.id} className={`border-b border-[var(--border)]/50 hover:bg-[var(--panel2)]/60 transition-colors ${i % 2 !== 0 ? 'bg-[var(--panel2)]/30' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-[var(--text)] text-[13px]">{issue.title}</div>
                        {issue.description && (
                          <div className="text-[11px] text-[var(--muted)] mt-0.5 max-w-[200px] truncate">{issue.description}</div>
                        )}
                      </td>
                      <td className="px-4 py-3"><SeverityPill sev={issue.severity} /></td>
                      <td className="px-4 py-3 text-[var(--muted)] text-xs">{issue.department?.name}</td>
                      <td className="px-4 py-3 text-[var(--muted)] text-xs">{issue.owner?.name}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[var(--muted)]">{formatDate(issue.dueDate)}</span>
                          {overdue && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold text-[var(--red)] border border-[var(--red)]/40 bg-[var(--red)]/10">
                              <Clock size={10} /> OVERDUE
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill status={issue.status} />
                        {issue.status === 'RESOLVED' && issue.resolutionNote && (
                          <div className="text-[10px] text-[var(--muted)] mt-1 max-w-[120px] truncate" title={issue.resolutionNote}>
                            ↳ {issue.resolutionNote}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1.5">
                          {issue.status === 'OPEN' && (isAdmin || issue.ownerId === session?.id) && (
                            <button
                              onClick={() => openResolve(issue)}
                              className="px-2.5 py-1 rounded text-[11px] font-medium text-[var(--green)] border border-[var(--green)]/30 hover:bg-[var(--green)]/10 transition-colors"
                            >
                              Resolve
                            </button>
                          )}
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(issue.id)}
                              className="p-1.5 rounded text-[var(--muted)] hover:text-[var(--red)] hover:bg-[var(--red)]/10 transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Raise Compliance Issue"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleCreate} disabled={submitting} className="bg-[var(--purple)] hover:bg-[var(--purple)]/80 text-white">
              {submitting ? 'Raising...' : 'Raise Issue'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            id="ci-title"
            label="Issue Title *"
            placeholder="e.g. Missing MSDS Sheets"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <Textarea
            id="ci-description"
            label="Description"
            placeholder="Describe the compliance issue..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              id="ci-severity"
              label="Severity *"
              value={form.severity}
              onChange={(e) => setForm({ ...form, severity: e.target.value })}
            >
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </Select>
            <Select
              id="ci-dept"
              label="Department *"
              value={form.departmentId}
              onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
            >
              <option value="">Select department</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-1.5">
                Owner * <span className="text-[var(--red)]">Required</span>
              </label>
              <select
                id="ci-owner"
                className="w-full bg-[var(--panel2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--purple)]"
                value={form.ownerId}
                onChange={(e) => setForm({ ...form, ownerId: e.target.value })}
              >
                <option value="">Select owner</option>
                {employees.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-1.5">
                Due Date * <span className="text-[var(--red)]">Required</span>
              </label>
              <input
                id="ci-duedate"
                type="date"
                className="w-full bg-[var(--panel2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--purple)]"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </div>
          </div>
          <Select
            id="ci-audit"
            label="Linked Audit (optional)"
            value={form.auditId}
            onChange={(e) => setForm({ ...form, auditId: e.target.value })}
          >
            <option value="">No linked audit</option>
            {audits.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
          </Select>
          <div className="flex items-start gap-2 p-3 rounded-lg bg-[var(--red)]/8 border border-[var(--red)]/20">
            <AlertTriangle size={14} className="text-[var(--red)] shrink-0 mt-0.5" />
            <p className="text-xs text-[var(--red)]">Owner and Due Date are required by compliance policy. Issues without them will be rejected.</p>
          </div>
        </div>
      </Modal>

      {/* Resolve Modal */}
      <Modal
        isOpen={isResolveOpen}
        onClose={() => setIsResolveOpen(false)}
        title="Resolve Compliance Issue"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsResolveOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleResolve} disabled={resolving} className="bg-[var(--green)] hover:bg-[var(--green)]/80 text-white">
              {resolving ? 'Resolving...' : 'Mark Resolved'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {resolveIssue && (
            <div className="p-3 rounded-lg bg-[var(--panel2)] border border-[var(--border)]">
              <div className="flex items-center gap-2 mb-1">
                <SeverityPill sev={resolveIssue.severity} />
                <span className="text-sm font-medium text-[var(--text)]">{resolveIssue.title}</span>
              </div>
              <p className="text-xs text-[var(--muted)]">{resolveIssue.department?.name} · Owner: {resolveIssue.owner?.name}</p>
            </div>
          )}
          <Textarea
            id="resolve-note"
            label="Resolution Note *"
            placeholder="Describe how the issue was resolved..."
            value={resolutionNote}
            onChange={(e) => setResolutionNote(e.target.value)}
            rows={4}
          />
        </div>
      </Modal>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { formatDate } from '@/lib/utils';
import { Plus, Edit2, Trash2, Download, ChevronRight, X, AlertCircle } from 'lucide-react';

const STATUS_STYLES = {
  COMPLETED: 'bg-[var(--blue)]/15 text-[var(--blue)] border border-[var(--blue)]/20',
  UNDER_REVIEW: 'bg-[var(--purple)]/15 text-[var(--purple)] border border-[var(--purple)]/20',
  PLANNED: 'bg-[var(--border)] text-[var(--muted)]'
};

const SEVERITY_STYLES = {
  HIGH: 'bg-[var(--red)]/15 text-[var(--red)] border border-[var(--red)]/20',
  MEDIUM: 'bg-[var(--orange)]/15 text-[var(--orange)] border border-[var(--orange)]/20',
  LOW: 'bg-[var(--border)] text-[var(--muted)]'
};

function StatusPill({ status }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_STYLES[status] || 'bg-[var(--border)] text-[var(--muted)]'}`}>
      {status?.replace('_', ' ')}
    </span>
  );
}

function SeverityPill({ severity }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${SEVERITY_STYLES[severity] || 'bg-[var(--border)] text-[var(--muted)]'}`}>
      {severity}
    </span>
  );
}

function AuditDrawer({ audit, onClose, isAdmin }) {
  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md z-50 flex flex-col bg-[var(--panel)] border-l border-[var(--border)] shadow-2xl">
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
        <div>
          <h2 className="text-base font-bold text-[var(--text)]">{audit.title}</h2>
          <p className="text-xs text-[var(--muted)] mt-0.5">{audit.department?.name} · {formatDate(audit.date)}</p>
        </div>
        <button onClick={onClose} className="p-2 rounded hover:bg-[var(--border)]/50 text-[var(--muted)] hover:text-[var(--text)] transition-colors">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        <div>
          <h3 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-2">Auditor</h3>
          <p className="text-sm text-[var(--text)]">{audit.auditor}</p>
        </div>
        <div>
          <h3 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-2">Status</h3>
          <StatusPill status={audit.status} />
        </div>
        <div>
          <h3 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-2">Findings</h3>
          <p className="text-sm text-[var(--text)] whitespace-pre-wrap">{audit.findings}</p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
              Linked Issues ({audit.complianceIssues?.length || 0})
            </h3>
            {isAdmin && (
              <a
                href={`/governance/compliance-issues?auditId=${audit.id}`}
                className="text-[11px] text-[var(--purple)] hover:underline"
              >
                + Raise Issue
              </a>
            )}
          </div>
          {audit.complianceIssues?.length > 0 ? (
            <div className="space-y-2">
              {audit.complianceIssues.map((issue) => (
                <div key={issue.id} className="p-3 rounded-lg bg-[var(--panel2)] border border-[var(--border)] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[var(--text)]">{issue.title}</span>
                    <SeverityPill severity={issue.severity} />
                  </div>
                  <p className="text-[11px] text-[var(--muted)]">Owner: {issue.owner?.name} · Due: {formatDate(issue.dueDate)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[var(--muted)] italic">No compliance issues linked.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AuditsPage() {
  const [audits, setAudits] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedAudit, setSelectedAudit] = useState(null);
  const [drawerAudit, setDrawerAudit] = useState(null);
  const toast = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [form, setForm] = useState({ title: '', departmentId: '', auditor: '', date: '', findings: '', status: 'PLANNED' });
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [aRes, dRes, sRes] = await Promise.all([
        fetch('/api/governance/audits'),
        fetch('/api/settings/departments'),
        fetch('/api/auth/me')
      ]);
      if (aRes.ok) setAudits(await aRes.json());
      if (dRes.ok) setDepartments(await dRes.json());
      if (sRes.ok) setSession(await sRes.json());
    } catch {
      toast.error('Failed to load audits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []); // eslint-disable-line

  const openCreate = () => {
    setModalMode('create');
    setSelectedAudit(null);
    setForm({ title: '', departmentId: departments[0]?.id || '', auditor: '', date: new Date().toISOString().slice(0, 10), findings: '', status: 'PLANNED' });
    setIsModalOpen(true);
  };

  const openEdit = (a) => {
    setModalMode('edit');
    setSelectedAudit(a);
    setForm({ title: a.title, departmentId: a.departmentId, auditor: a.auditor, date: a.date.slice(0, 10), findings: a.findings, status: a.status });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    setSubmitting(true);
    try {
      const url = modalMode === 'create' ? '/api/governance/audits' : `/api/governance/audits/${selectedAudit.id}`;
      const method = modalMode === 'create' ? 'POST' : 'PUT';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Audit ${modalMode === 'create' ? 'created' : 'updated'} successfully`);
        setIsModalOpen(false);
        fetchAll();
      } else {
        toast.error(data.error || 'Failed to save audit');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this audit?')) return;
    const res = await fetch(`/api/governance/audits/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (res.ok) { toast.success('Audit deleted'); fetchAll(); }
    else toast.error(data.error || 'Failed to delete audit');
  };

  const exportCSV = () => {
    const rows = [
      ['Title', 'Department', 'Auditor', 'Date', 'Status', 'Findings'],
      ...audits.map((a) => [
        `"${a.title}"`, `"${a.department?.name}"`, `"${a.auditor}"`,
        formatDate(a.date), a.status, `"${a.findings?.replace(/"/g, '""')}"`
      ])
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audits-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const isAdmin = session?.role === 'ADMIN';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)] tracking-tight font-space">Audits</h1>
          <p className="text-sm text-[var(--muted)]">Governance audit register — findings and compliance linkages.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={exportCSV} className="border border-[var(--border)]">
            <Download size={15} className="mr-1.5" /> Export CSV
          </Button>
          {isAdmin && (
            <Button variant="primary" onClick={openCreate} className="bg-[var(--purple)] hover:bg-[var(--purple)]/80 text-white">
              <Plus size={15} className="mr-1.5" /> New Audit
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-[var(--muted)]">Loading audits...</div>
      ) : (
        <div className="rounded-xl border border-[var(--border)] overflow-hidden bg-[var(--panel)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--muted)] text-[11px] uppercase tracking-wider">
                <th className="text-left px-5 py-3 font-semibold">Title</th>
                <th className="text-left px-4 py-3 font-semibold">Department</th>
                <th className="text-left px-4 py-3 font-semibold">Auditor</th>
                <th className="text-left px-4 py-3 font-semibold">Date</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
                <th className="text-left px-4 py-3 font-semibold">Issues</th>
                <th className="text-right px-5 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {audits.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-[var(--muted)]">No audits found.</td>
                </tr>
              ) : audits.map((a, i) => (
                <tr key={a.id} className={`border-b border-[var(--border)]/50 hover:bg-[var(--panel2)]/60 transition-colors ${i % 2 === 0 ? '' : 'bg-[var(--panel2)]/30'}`}>
                  <td className="px-5 py-3 font-medium text-[var(--text)]">
                    <button className="flex items-center gap-1 hover:text-[var(--purple)] transition-colors text-left" onClick={() => setDrawerAudit(a)}>
                      {a.title} <ChevronRight size={13} className="text-[var(--muted)]" />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-[var(--muted)]">{a.department?.name}</td>
                  <td className="px-4 py-3 text-[var(--muted)]">{a.auditor}</td>
                  <td className="px-4 py-3 text-[var(--muted)]">{formatDate(a.date)}</td>
                  <td className="px-4 py-3"><StatusPill status={a.status} /></td>
                  <td className="px-4 py-3 text-[var(--muted)]">{a.complianceIssues?.length || 0}</td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1.5">
                      {isAdmin && (
                        <>
                          <button onClick={() => openEdit(a)} className="p-1.5 rounded text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--border)]/50 transition-colors">
                            <Edit2 size={13} />
                          </button>
                          <button onClick={() => handleDelete(a.id)} className="p-1.5 rounded text-[var(--muted)] hover:text-[var(--red)] hover:bg-[var(--red)]/10 transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Drawer */}
      {drawerAudit && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setDrawerAudit(null)} />
          <AuditDrawer audit={drawerAudit} onClose={() => setDrawerAudit(null)} isAdmin={isAdmin} />
        </>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'New Audit' : 'Edit Audit'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave} disabled={submitting} className="bg-[var(--purple)] hover:bg-[var(--purple)]/80 text-white">
              {submitting ? 'Saving...' : 'Save Audit'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            id="audit-title"
            label="Title *"
            placeholder="e.g. Annual Environmental Audit 2024"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              id="audit-dept"
              label="Department *"
              value={form.departmentId}
              onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
            >
              <option value="">Select department</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select>
            <Input
              id="audit-auditor"
              label="Auditor *"
              placeholder="Auditor name"
              value={form.auditor}
              onChange={(e) => setForm({ ...form, auditor: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              id="audit-date"
              label="Date *"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
            <Select
              id="audit-status"
              label="Status"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="PLANNED">Planned</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="COMPLETED">Completed</option>
            </Select>
          </div>
          <Textarea
            id="audit-findings"
            label="Findings *"
            placeholder="Describe audit findings..."
            value={form.findings}
            onChange={(e) => setForm({ ...form, findings: e.target.value })}
            rows={4}
          />
        </div>
      </Modal>
    </div>
  );
}
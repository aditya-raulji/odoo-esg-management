'use client';

import { useState, useEffect, useCallback } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import ProgressBar from '@/components/ui/ProgressBar';
import { useToast } from '@/components/ui/Toast';
import { formatDate } from '@/lib/utils';
import { Plus, Edit2, Trash2, Calendar, Shield, CheckCircle, ChevronDown, ChevronUp, Bell, Users, Clock } from 'lucide-react';

function PolicyCard({ policy, session, onEdit, onDelete, onAcknowledge, myAckDate, expanded, onToggleExpand }) {
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [sendingReminder, setSendingReminder] = useState(false);
  const toast = useToast();
  const isAdmin = session?.role === 'ADMIN';

  const fetchStats = useCallback(async () => {
    if (!isAdmin) return;
    setLoadingStats(true);
    try {
      const res = await fetch(`/api/governance/acknowledgements/${policy.id}`);
      if (res.ok) setStats(await res.json());
    } finally {
      setLoadingStats(false);
    }
  }, [policy.id, isAdmin]);

  useEffect(() => {
    if (expanded && isAdmin) fetchStats();
  }, [expanded, fetchStats, isAdmin]);

  const sendReminder = async () => {
    setSendingReminder(true);
    try {
      const res = await fetch('/api/governance/acknowledgements/remind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ policyId: policy.id })
      });
      const data = await res.json();
      if (res.ok) toast.success(data.message);
      else toast.error(data.error || 'Failed to send reminders');
    } catch {
      toast.error('Network error');
    } finally {
      setSendingReminder(false);
    }
  };

  return (
    <Card className="relative flex flex-col overflow-hidden border border-[var(--border)] bg-[var(--panel)]">
      {/* Header */}
      <div className="p-5 space-y-3">
        <div className="flex justify-between items-start gap-2">
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${
            policy.status === 'Active'
              ? 'bg-[var(--purple)]/15 text-[var(--purple)] border border-[var(--purple)]/20'
              : 'bg-[var(--border)] text-[var(--muted)]'
          }`}>
            {policy.status}
          </span>
          {isAdmin && (
            <div className="flex gap-1.5 shrink-0">
              <button onClick={() => onEdit(policy)} className="p-1.5 rounded text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--border)]/50 transition-colors">
                <Edit2 size={13} />
              </button>
              <button onClick={() => onDelete(policy.id)} className="p-1.5 rounded text-[var(--muted)] hover:text-[var(--red)] hover:bg-[var(--red)]/10 transition-colors">
                <Trash2 size={13} />
              </button>
            </div>
          )}
        </div>

        <div>
          <h3 className="text-[15px] font-bold text-[var(--text)] leading-tight">{policy.title}</h3>
          <p className="text-[11px] text-[var(--muted)] mt-1 flex items-center gap-1">
            <Shield size={11} className="text-[var(--purple)]" /> Version {policy.version}
          </p>
          <p className="text-sm text-[var(--muted)] mt-2.5 line-clamp-3">{policy.body}</p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto">
        <div className="px-5 py-3 bg-[var(--panel2)] border-t border-[var(--border)] flex justify-between items-center gap-2">
          <div className="flex items-center text-xs text-[var(--muted)]">
            <Calendar size={12} className="mr-1 text-[var(--purple)]" />
            Effective {formatDate(policy.effectiveDate)}
          </div>

          {/* Employee Acknowledge button */}
          {!isAdmin && (
            myAckDate ? (
              <span className="flex items-center gap-1 text-[11px] font-medium text-[var(--green)]">
                <CheckCircle size={13} /> Acknowledged {formatDate(myAckDate)}
              </span>
            ) : (
              <Button
                variant="primary"
                className="!text-xs !py-1.5 !px-3 bg-[var(--purple)] hover:bg-[var(--purple)]/80 text-white"
                onClick={() => onAcknowledge(policy.id)}
              >
                Acknowledge
              </Button>
            )
          )}

          {/* Admin expand toggle */}
          {isAdmin && (
            <button
              onClick={() => onToggleExpand(policy.id)}
              className="flex items-center gap-1 text-[11px] text-[var(--purple)] hover:text-[var(--purple)]/80 transition-colors"
            >
              <Users size={13} /> Tracking {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          )}
        </div>

        {/* Admin Expanded tracking section */}
        {isAdmin && expanded && (
          <div className="px-5 py-4 bg-[var(--bg)] border-t border-[var(--border)] space-y-3">
            {loadingStats ? (
              <p className="text-xs text-[var(--muted)]">Loading stats...</p>
            ) : stats ? (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-[var(--muted)]">
                    {stats.acknowledgedCount}/{stats.totalEmployees} employees acknowledged
                  </span>
                  <span className="text-xs font-bold text-[var(--purple)]">{stats.percentage}%</span>
                </div>
                <ProgressBar value={stats.percentage} max={100} />

                {stats.pendingList?.length > 0 && (
                  <div className="space-y-1.5 mt-2">
                    <p className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wide">Pending Employees</p>
                    <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
                      {stats.pendingList.map((u) => (
                        <div key={u.userId} className="flex justify-between text-xs py-1 border-b border-[var(--border)]/40">
                          <span className="text-[var(--text)]">{u.name}</span>
                          <span className="text-[var(--muted)]">{u.department}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  variant="ghost"
                  className="!text-xs !py-1.5 !px-3 border border-[var(--purple)]/30 text-[var(--purple)] hover:bg-[var(--purple)]/10 w-full"
                  onClick={sendReminder}
                  disabled={sendingReminder || stats.pendingList?.length === 0}
                >
                  <Bell size={12} className="mr-1.5" />
                  {sendingReminder ? 'Sending...' : `Send Reminder to ${stats.pendingList?.length || 0} pending`}
                </Button>
              </>
            ) : (
              <p className="text-xs text-[var(--muted)]">Failed to load stats.</p>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

export default function PoliciesPage() {
  const [policies, setPolicies] = useState([]);
  const [session, setSession] = useState(null);
  const [myAcks, setMyAcks] = useState({});
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const toast = useToast();

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [title, setTitle] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [version, setVersion] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [status, setStatus] = useState('Active');
  const [submitting, setSubmitting] = useState(false);

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) setSession(await res.json());
    } catch {}
  };

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/governance/policies');
      if (res.ok) setPolicies(await res.json());
      else toast.error('Failed to load policies');
    } catch {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyAcks = async () => {
    try {
      const res = await fetch('/api/governance/acknowledgements');
      if (res.ok) {
        const data = await res.json();
        const map = {};
        data.forEach((a) => { map[a.policyId] = a.acknowledgedAt; });
        setMyAcks(map);
      }
    } catch {}
  };

  useEffect(() => {
    fetchSession();
    fetchPolicies();
    fetchMyAcks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAcknowledge = async (policyId) => {
    try {
      const res = await fetch('/api/governance/acknowledgements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ policyId })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Policy acknowledged successfully');
        setMyAcks((prev) => ({ ...prev, [policyId]: new Date().toISOString() }));
      } else {
        toast.error(data.error || 'Failed to acknowledge policy');
      }
    } catch {
      toast.error('Network error');
    }
  };

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedPolicy(null);
    setTitle('');
    setBodyText('');
    setVersion('1.0');
    setEffectiveDate(new Date().toISOString().slice(0, 10));
    setStatus('Active');
    setIsModalOpen(true);
  };

  const openEditModal = (policy) => {
    setModalMode('edit');
    setSelectedPolicy(policy);
    setTitle(policy.title);
    setBodyText(policy.body);
    setVersion(policy.version);
    setEffectiveDate(policy.effectiveDate.slice(0, 10));
    setStatus(policy.status);
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = { title, body: bodyText, version, effectiveDate, status };
    try {
      const url = modalMode === 'create' ? '/api/governance/policies' : `/api/governance/policies/${selectedPolicy.id}`;
      const method = modalMode === 'create' ? 'POST' : 'PUT';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Policy ${modalMode === 'create' ? 'created' : 'updated'} successfully`);
        setIsModalOpen(false);
        fetchPolicies();
      } else {
        toast.error(data.error || 'Failed to save policy');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this policy?')) return;
    try {
      const res = await fetch(`/api/governance/policies/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) { toast.success('Policy deleted'); fetchPolicies(); }
      else toast.error(data.error || 'Failed to delete policy');
    } catch {
      toast.error('Network error');
    }
  };

  const toggleExpand = (id) => setExpandedId((prev) => (prev === id ? null : id));
  const isAdmin = session?.role === 'ADMIN';

  // Employee pending checklist
  const pendingPolicies = policies.filter((p) => !myAcks[p.id] && p.status === 'Active');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)] tracking-tight font-space">ESG Policies</h1>
          <p className="text-sm text-[var(--muted)]">Active compliance policy registers and governance standards.</p>
        </div>
        {isAdmin && (
          <Button
            variant="primary"
            onClick={openCreateModal}
            className="bg-[var(--purple)] hover:bg-[var(--purple)]/80 text-white"
          >
            <Plus size={16} className="mr-1.5" /> New Policy
          </Button>
        )}
      </div>

      {/* Employee pending alert */}
      {!isAdmin && pendingPolicies.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-[var(--amber)]/30 bg-[var(--amber)]/10">
          <Clock size={16} className="text-[var(--amber)] shrink-0" />
          <p className="text-sm text-[var(--amber)]">
            <span className="font-bold">{pendingPolicies.length} policy</span> awaiting your acknowledgement.
          </p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-[var(--muted)]">Loading policies...</div>
      ) : policies.length === 0 ? (
        <div className="text-center py-16 text-[var(--muted)]">No policies found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {policies.map((p) => (
            <PolicyCard
              key={p.id}
              policy={p}
              session={session}
              onEdit={openEditModal}
              onDelete={handleDelete}
              onAcknowledge={handleAcknowledge}
              myAckDate={myAcks[p.id]}
              expanded={expandedId === p.id}
              onToggleExpand={toggleExpand}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Create ESG Policy' : 'Edit ESG Policy'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={submitting}
              className="bg-[var(--purple)] hover:bg-[var(--purple)]/80 text-white"
            >
              {submitting ? 'Saving...' : 'Save Policy'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            id="policy-title"
            label="Policy Title *"
            placeholder="e.g. Environmental Code of Conduct"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <div className="grid grid-cols-3 gap-3">
            <Input
              id="policy-version"
              label="Version *"
              placeholder="1.0"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              required
            />
            <Input
              id="policy-date"
              label="Effective Date *"
              type="date"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
              required
            />
            <Select
              id="policy-status"
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </Select>
          </div>
          <Textarea
            id="policy-body"
            label="Policy Content *"
            placeholder="Paste or write full policy details here..."
            value={bodyText}
            onChange={(e) => setBodyText(e.target.value)}
            rows={6}
            required
          />
        </form>
      </Modal>
    </div>
  );
}
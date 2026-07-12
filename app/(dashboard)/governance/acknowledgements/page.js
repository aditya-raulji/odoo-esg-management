'use client';

import { useState, useEffect, useCallback } from 'react';
import Card from '@/components/ui/Card';
import ProgressBar from '@/components/ui/ProgressBar';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { formatDate } from '@/lib/utils';
import { Bell, CheckCircle, Clock, Users, Shield, ChevronDown, ChevronUp } from 'lucide-react';

// ──────────────────────────────────────────────
// Admin view: per-policy acknowledgement tracking
// ──────────────────────────────────────────────
function AdminAcknowledgements() {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [stats, setStats] = useState({});
  const [loadingStats, setLoadingStats] = useState({});
  const [sending, setSending] = useState({});
  const toast = useToast();

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/governance/policies');
      if (res.ok) setPolicies(await res.json());
    } catch {
      toast.error('Failed to load policies');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = useCallback(async (policyId) => {
    setLoadingStats((prev) => ({ ...prev, [policyId]: true }));
    try {
      const res = await fetch(`/api/governance/acknowledgements/${policyId}`);
      if (res.ok) {
        const data = await res.json();
        setStats((prev) => ({ ...prev, [policyId]: data }));
      }
    } finally {
      setLoadingStats((prev) => ({ ...prev, [policyId]: false }));
    }
  }, []);

  useEffect(() => { fetchPolicies(); }, []); // eslint-disable-line

  const toggleExpand = (id) => {
    setExpandedId((prev) => {
      if (prev === id) return null;
      fetchStats(id);
      return id;
    });
  };

  const sendReminder = async (policyId) => {
    setSending((prev) => ({ ...prev, [policyId]: true }));
    try {
      const res = await fetch('/api/governance/acknowledgements/remind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ policyId })
      });
      const data = await res.json();
      if (res.ok) toast.success(data.message);
      else toast.error(data.error || 'Failed to send reminders');
    } catch {
      toast.error('Network error');
    } finally {
      setSending((prev) => ({ ...prev, [policyId]: false }));
    }
  };

  if (loading) return <div className="text-center py-12 text-[var(--muted)]">Loading policies...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider">Policy Acknowledgement Tracking</h2>

      {policies.length === 0 ? (
        <div className="text-center py-10 text-[var(--muted)]">No policies found. Create policies in the Policies section.</div>
      ) : policies.map((policy) => {
        const s = stats[policy.id];
        const isExpanded = expandedId === policy.id;
        const pct = s?.percentage ?? 0;

        return (
          <div key={policy.id} className="rounded-xl border border-[var(--border)] bg-[var(--panel)] overflow-hidden">
            {/* Header row */}
            <div className="flex items-center justify-between px-5 py-4 gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Shield size={14} className="text-[var(--purple)] shrink-0" />
                  <h3 className="text-sm font-semibold text-[var(--text)] truncate">{policy.title}</h3>
                  <span className="text-[10px] text-[var(--muted)] shrink-0">v{policy.version}</span>
                </div>
                {/* Inline progress bar */}
                <div className="mt-2.5">
                  <ProgressBar value={pct} max={100} color="purple" height="h-1.5" showPercent={false} />
                  <p className="text-[11px] text-[var(--muted)] mt-1">
                    {s ? `${s.acknowledgedCount} / ${s.totalEmployees} employees — ${pct}% complete` : 'Click to load progress'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {s && s.pendingList?.length > 0 && (
                  <Button
                    variant="ghost"
                    className="!text-xs !py-1.5 !px-3 border border-[var(--purple)]/30 text-[var(--purple)] hover:bg-[var(--purple)]/10"
                    onClick={() => sendReminder(policy.id)}
                    disabled={sending[policy.id]}
                  >
                    <Bell size={12} className="mr-1" />
                    {sending[policy.id] ? 'Sending...' : `Remind ${s.pendingList.length}`}
                  </Button>
                )}
                <button
                  onClick={() => toggleExpand(policy.id)}
                  className="p-2 rounded-lg text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--border)]/50 transition-colors"
                >
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>
            </div>

            {/* Expanded detail */}
            {isExpanded && (
              <div className="border-t border-[var(--border)] px-5 py-4 bg-[var(--bg)] space-y-4">
                {loadingStats[policy.id] ? (
                  <p className="text-xs text-[var(--muted)]">Loading...</p>
                ) : s ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Pending list */}
                    <div>
                      <h4 className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Clock size={11} /> Pending ({s.pendingList?.length || 0})
                      </h4>
                      {s.pendingList?.length === 0 ? (
                        <p className="text-xs text-[var(--green)] flex items-center gap-1.5"><CheckCircle size={12} /> All employees acknowledged!</p>
                      ) : (
                        <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                          {s.pendingList.map((u) => (
                            <div key={u.userId} className="flex justify-between text-xs py-1 border-b border-[var(--border)]/40">
                              <span className="text-[var(--text)]">{u.name}</span>
                              <span className="text-[var(--muted)]">{u.department}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Acknowledged list */}
                    <div>
                      <h4 className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <CheckCircle size={11} className="text-[var(--green)]" /> Acknowledged ({s.acknowledgedList?.length || 0})
                      </h4>
                      <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                        {s.acknowledgedList?.map((u) => (
                          <div key={u.userId} className="flex justify-between text-xs py-1 border-b border-[var(--border)]/40">
                            <span className="text-[var(--text)]">{u.name}</span>
                            <span className="text-[var(--muted)]">{formatDate(u.acknowledgedAt)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-[var(--muted)]">Failed to load tracking data.</p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ──────────────────────────────────────────────
// Employee view: pending policies checklist
// ──────────────────────────────────────────────
function EmployeeAcknowledgements({ session }) {
  const [policies, setPolicies] = useState([]);
  const [myAcks, setMyAcks] = useState({});
  const [loading, setLoading] = useState(true);
  const [acknowledging, setAcknowledging] = useState({});
  const toast = useToast();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [pRes, aRes] = await Promise.all([
          fetch('/api/governance/policies'),
          fetch('/api/governance/acknowledgements')
        ]);
        if (pRes.ok) setPolicies(await pRes.json());
        if (aRes.ok) {
          const acks = await aRes.json();
          const map = {};
          acks.forEach((a) => { map[a.policyId] = a.acknowledgedAt; });
          setMyAcks(map);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAcknowledge = async (policyId) => {
    setAcknowledging((prev) => ({ ...prev, [policyId]: true }));
    try {
      const res = await fetch('/api/governance/acknowledgements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ policyId })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Policy acknowledged!');
        setMyAcks((prev) => ({ ...prev, [policyId]: new Date().toISOString() }));
      } else {
        toast.error(data.error || 'Failed to acknowledge');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setAcknowledging((prev) => ({ ...prev, [policyId]: false }));
    }
  };

  if (loading) return <div className="text-center py-12 text-[var(--muted)]">Loading...</div>;

  const pending = policies.filter((p) => !myAcks[p.id] && p.status === 'Active');
  const done = policies.filter((p) => !!myAcks[p.id]);

  return (
    <div className="space-y-6">
      {/* Pending */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Clock size={14} className="text-[var(--amber)]" />
          <h2 className="text-sm font-semibold text-[var(--text)]">Awaiting Acknowledgement ({pending.length})</h2>
        </div>
        {pending.length === 0 ? (
          <div className="flex items-center gap-2 p-4 rounded-xl border border-[var(--green)]/30 bg-[var(--green)]/8 text-sm text-[var(--green)]">
            <CheckCircle size={15} /> You have acknowledged all active policies!
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((p) => (
              <div key={p.id} className="flex items-start justify-between gap-4 p-4 rounded-xl border border-[var(--amber)]/25 bg-[var(--panel)]">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Shield size={13} className="text-[var(--purple)] shrink-0" />
                    <h3 className="text-sm font-semibold text-[var(--text)] truncate">{p.title}</h3>
                    <span className="text-[10px] text-[var(--muted)] shrink-0">v{p.version}</span>
                  </div>
                  <p className="text-xs text-[var(--muted)] mt-1 line-clamp-2">{p.body}</p>
                  <p className="text-[11px] text-[var(--muted)] mt-1.5 flex items-center gap-1">
                    <Clock size={10} /> Effective {formatDate(p.effectiveDate)}
                  </p>
                </div>
                <Button
                  variant="primary"
                  className="!text-xs !py-2 !px-4 bg-[var(--purple)] hover:bg-[var(--purple)]/80 text-white shrink-0"
                  onClick={() => handleAcknowledge(p.id)}
                  disabled={acknowledging[p.id]}
                >
                  {acknowledging[p.id] ? 'Saving...' : 'Acknowledge'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed */}
      {done.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle size={14} className="text-[var(--green)]" />
            <h2 className="text-sm font-semibold text-[var(--text)]">Acknowledged ({done.length})</h2>
          </div>
          <div className="space-y-2">
            {done.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--panel)]">
                <div className="flex items-center gap-2">
                  <CheckCircle size={13} className="text-[var(--green)] shrink-0" />
                  <span className="text-sm text-[var(--text)]">{p.title}</span>
                  <span className="text-[10px] text-[var(--muted)]">v{p.version}</span>
                </div>
                <span className="text-xs text-[var(--muted)]">{formatDate(myAcks[p.id])}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Main page
// ──────────────────────────────────────────────
export default function AcknowledgementsPage() {
  const [session, setSession] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => setSession(d))
      .catch(() => {})
      .finally(() => setLoadingSession(false));
  }, []);

  if (loadingSession) return <div className="text-center py-20 text-[var(--muted)]">Loading...</div>;

  const isAdmin = session?.role === 'ADMIN';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[var(--purple)]/15 text-[var(--purple)] flex items-center justify-center border border-[var(--purple)]/20">
          <Users size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)] tracking-tight font-space">
            {isAdmin ? 'Policy Acknowledgement Tracking' : 'My Policy Acknowledgements'}
          </h1>
          <p className="text-sm text-[var(--muted)]">
            {isAdmin
              ? 'Monitor employee acknowledgement rates, view pending staff, and send reminders.'
              : 'Acknowledge active ESG policies required of all employees.'}
          </p>
        </div>
      </div>

      {isAdmin ? <AdminAcknowledgements /> : <EmployeeAcknowledgements session={session} />}
    </div>
  );
}
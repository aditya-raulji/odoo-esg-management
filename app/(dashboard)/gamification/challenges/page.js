'use client';

import { useState, useEffect, useCallback } from 'react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { formatDate } from '@/lib/utils';
import { Plus, Edit2, Trash2, Zap, Calendar, Target, Users, ChevronRight } from 'lucide-react';

const STATUS_CONFIG = {
  DRAFT:        { label: 'Draft',        color: 'bg-[var(--border)] text-[var(--muted)]' },
  ACTIVE:       { label: 'Active',       color: 'bg-[var(--green)]/15 text-[var(--green)] border border-[var(--green)]/25' },
  UNDER_REVIEW: { label: 'Under Review', color: 'bg-[var(--purple)]/15 text-[var(--purple)] border border-[var(--purple)]/25' },
  COMPLETED:    { label: 'Completed',    color: 'bg-[var(--blue)]/15 text-[var(--blue)] border border-[var(--blue)]/25' },
  ARCHIVED:     { label: 'Archived',     color: 'bg-[var(--border)] text-[var(--muted)]' }
};

const DIFFICULTY_CONFIG = {
  EASY:   { label: 'Easy',   color: 'text-[var(--green)]', bg: 'bg-[var(--green)]/10' },
  MEDIUM: { label: 'Medium', color: 'text-[var(--amber)]', bg: 'bg-[var(--amber)]/10' },
  HARD:   { label: 'Hard',   color: 'text-[var(--red)]',   bg: 'bg-[var(--red)]/10'   }
};

// Admin lifecycle transitions
const TRANSITION_BUTTONS = {
  DRAFT:        [{ label: 'Activate',          action: 'ACTIVE',        variant: 'green'  }],
  ACTIVE:       [{ label: 'Move to Review',    action: 'UNDER_REVIEW',  variant: 'purple' }],
  UNDER_REVIEW: [{ label: 'Mark Completed',    action: 'COMPLETED',     variant: 'primary'}],
  COMPLETED:    [{ label: 'Archive',           action: 'ARCHIVED',      variant: 'ghost'  }],
  ARCHIVED:     []
};

const FILTER_TABS = ['ALL', 'DRAFT', 'ACTIVE', 'UNDER_REVIEW', 'COMPLETED', 'ARCHIVED'];

function ChallengeCard({ challenge, session, onEdit, onDelete, onTransition, myParticipation, onJoin, joiningId }) {
  const isAdmin = session?.role === 'ADMIN';
  const statusCfg = STATUS_CONFIG[challenge.status] || STATUS_CONFIG.DRAFT;
  const diffCfg = DIFFICULTY_CONFIG[challenge.difficulty] || DIFFICULTY_CONFIG.EASY;
  const isDeadlinePast = new Date(challenge.deadline) < new Date();
  const hasJoined = !!myParticipation;
  const transitions = isAdmin ? (TRANSITION_BUTTONS[challenge.status] || []) : [];

  return (
    <div className="relative flex flex-col rounded-xl border border-[var(--border)] bg-[var(--panel)] overflow-hidden hover:border-[var(--orange)]/40 transition-all duration-200 hover:shadow-lg hover:shadow-[var(--orange)]/5">
      {/* Top color bar */}
      <div className="h-1 w-full bg-gradient-to-r from-[var(--orange)] to-[var(--orange)]/40" />

      <div className="p-5 flex-1 space-y-3">
        {/* Header */}
        <div className="flex justify-between items-start gap-2">
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${statusCfg.color}`}>
            {statusCfg.label}
          </span>
          {isAdmin && (
            <div className="flex gap-1 shrink-0">
              <button onClick={() => onEdit(challenge)} className="p-1.5 rounded text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--border)]/50 transition-colors">
                <Edit2 size={12} />
              </button>
              {['DRAFT', 'ARCHIVED'].includes(challenge.status) && (
                <button onClick={() => onDelete(challenge.id)} className="p-1.5 rounded text-[var(--muted)] hover:text-[var(--red)] hover:bg-[var(--red)]/10 transition-colors">
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Icon + Title */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--orange)]/15 flex items-center justify-center shrink-0">
            <Target size={18} className="text-[var(--orange)]" />
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-[var(--text)] leading-tight">{challenge.title}</h3>
            <p className="text-[11px] text-[var(--muted)] mt-0.5">{challenge.category?.name}</p>
          </div>
        </div>

        <p className="text-sm text-[var(--muted)] line-clamp-2">{challenge.description}</p>

        {/* Meta */}
        <div className="flex flex-wrap gap-3 text-xs text-[var(--muted)]">
          <span className="flex items-center gap-1">
            <Zap size={11} className="text-[var(--orange)]" />
            <strong className="text-[var(--text)]">{challenge.xp} XP</strong>
          </span>
          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${diffCfg.bg} ${diffCfg.color}`}>
            {diffCfg.label}
          </span>
          <span className="flex items-center gap-1">
            <Calendar size={11} className={isDeadlinePast ? 'text-[var(--red)]' : 'text-[var(--muted)]'} />
            <span className={isDeadlinePast ? 'text-[var(--red)]' : ''}>
              Deadline {formatDate(challenge.deadline)}
            </span>
          </span>
          <span className="flex items-center gap-1">
            <Users size={11} />
            {challenge.participations?.length || 0} joined
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-[var(--border)] bg-[var(--panel2)]/50 space-y-2">
        {/* Admin lifecycle buttons */}
        {isAdmin && transitions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {transitions.map((t) => (
              <Button
                key={t.action}
                variant={t.variant}
                size="xs"
                onClick={() => onTransition(challenge.id, t.action)}
                className={t.variant === 'green' ? 'bg-[var(--green)] border-[var(--green)] text-black' : ''}
              >
                {t.label} <ChevronRight size={12} />
              </Button>
            ))}
            {challenge.status !== 'ARCHIVED' && (
              <Button variant="ghost" size="xs" onClick={() => onTransition(challenge.id, 'ARCHIVED')}>
                Archive
              </Button>
            )}
          </div>
        )}

        {/* Employee join button */}
        {!isAdmin && (
          hasJoined ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--green)] font-medium">✓ Joined</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                myParticipation.approvalStatus === 'APPROVED' ? 'bg-[var(--green)]/15 text-[var(--green)]' :
                myParticipation.approvalStatus === 'REJECTED' ? 'bg-[var(--red)]/15 text-[var(--red)]' :
                'bg-[var(--border)] text-[var(--muted)]'
              }`}>
                {myParticipation.approvalStatus}
              </span>
            </div>
          ) : (
            <Button
              variant="orange"
              size="sm"
              onClick={() => onJoin(challenge.id)}
              disabled={challenge.status !== 'ACTIVE' || joiningId === challenge.id}
              className="w-full justify-center"
            >
              {joiningId === challenge.id ? 'Joining...' : 'Join Challenge'}
            </Button>
          )
        )}
      </div>
    </div>
  );
}

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState([]);
  const [categories, setCategories] = useState([]);
  const [session, setSession] = useState(null);
  const [myParticipations, setMyParticipations] = useState({});
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState(null);
  const toast = useToast();

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState({ title: '', categoryId: '', description: '', xp: '', difficulty: 'EASY', evidenceRequired: false, deadline: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, sRes, pRes] = await Promise.all([
        fetch('/api/gamification/challenges'),
        fetch('/api/auth/me'),
        fetch('/api/gamification/challenge-participation')
      ]);
      if (cRes.ok) setChallenges(await cRes.json());
      if (sRes.ok) setSession(await sRes.json());
      if (pRes.ok) {
        const parts = await pRes.json();
        const map = {};
        parts.forEach((p) => { map[p.challengeId] = p; });
        setMyParticipations(map);
      }
    } catch {
      toast.error('Failed to load challenges');
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/settings/categories?type=CHALLENGE');
        if (res.ok) setCategories(await res.json());
      } catch {}
    };
    fetchAll();
    fetchCategories();
  }, []); // eslint-disable-line

  const openCreate = () => {
    setModalMode('create');
    setEditTarget(null);
    setForm({ title: '', categoryId: categories[0]?.id || '', description: '', xp: '100', difficulty: 'EASY', evidenceRequired: false, deadline: '' });
    setIsModalOpen(true);
  };

  const openEdit = (c) => {
    setModalMode('edit');
    setEditTarget(c);
    setForm({ title: c.title, categoryId: c.categoryId, description: c.description, xp: String(c.xp), difficulty: c.difficulty, evidenceRequired: c.evidenceRequired, deadline: c.deadline.slice(0, 10) });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    setSubmitting(true);
    try {
      const url = modalMode === 'create' ? '/api/gamification/challenges' : `/api/gamification/challenges/${editTarget.id}`;
      const method = modalMode === 'create' ? 'POST' : 'PATCH';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (res.ok) { toast.success(`Challenge ${modalMode === 'create' ? 'created' : 'updated'}`); setIsModalOpen(false); fetchAll(); }
      else toast.error(data.error || 'Failed to save');
    } catch { toast.error('Network error'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this challenge?')) return;
    const res = await fetch(`/api/gamification/challenges/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (res.ok) { toast.success('Challenge deleted'); fetchAll(); }
    else toast.error(data.error || 'Failed to delete');
  };

  const handleTransition = async (id, newStatus) => {
    const res = await fetch(`/api/gamification/challenges/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    const data = await res.json();
    if (res.ok) { toast.success(`Status → ${newStatus}`); fetchAll(); }
    else toast.error(data.error || 'Transition failed');
  };

  const handleJoin = async (challengeId) => {
    setJoiningId(challengeId);
    try {
      const res = await fetch('/api/gamification/challenge-participation', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId })
      });
      const data = await res.json();
      if (res.ok) { toast.success('Joined challenge!'); fetchAll(); }
      else toast.error(data.error || 'Failed to join');
    } catch { toast.error('Network error'); }
    finally { setJoiningId(null); }
  };

  const isAdmin = session?.role === 'ADMIN';
  const filtered = filter === 'ALL' ? challenges : challenges.filter((c) => c.status === filter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)] tracking-tight font-space">Challenges</h1>
          <p className="text-sm text-[var(--muted)]">Earn XP and points by completing ESG challenges.</p>
        </div>
        {isAdmin && (
          <Button variant="orange" onClick={openCreate}>
            <Plus size={15} className="mr-1" /> New Challenge
          </Button>
        )}
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {FILTER_TABS.map((tab) => {
          const cfg = STATUS_CONFIG[tab] || { label: 'All', color: '' };
          const active = filter === tab;
          return (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                active
                  ? tab === 'ALL'
                    ? 'bg-[var(--orange)] text-white'
                    : cfg.color + ' ring-2 ring-[var(--orange)]/40'
                  : 'bg-[var(--panel2)] text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              {tab === 'ALL' ? 'All' : cfg.label}
              <span className="ml-1.5 opacity-60">
                {tab === 'ALL' ? challenges.length : challenges.filter((c) => c.status === tab).length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-center py-16 text-[var(--muted)]">Loading challenges...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-[var(--muted)]">No challenges found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((c) => (
            <ChallengeCard
              key={c.id}
              challenge={c}
              session={session}
              onEdit={openEdit}
              onDelete={handleDelete}
              onTransition={handleTransition}
              myParticipation={myParticipations[c.id]}
              onJoin={handleJoin}
              joiningId={joiningId}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'New Challenge' : 'Edit Challenge'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="orange" onClick={handleSave} disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Challenge'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input id="ch-title" label="Title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Commute Green Week" />
          <div className="grid grid-cols-2 gap-3">
            <Select id="ch-category" label="Category *" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
              <option value="">Select category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            <Select id="ch-difficulty" label="Difficulty *" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </Select>
          </div>
          <Textarea id="ch-desc" label="Description *" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
          <div className="grid grid-cols-2 gap-3">
            <Input id="ch-xp" label="XP Reward *" type="number" value={form.xp} onChange={(e) => setForm({ ...form, xp: e.target.value })} placeholder="100" />
            <Input id="ch-deadline" label="Deadline *" type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
          </div>
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.evidenceRequired}
              onChange={(e) => setForm({ ...form, evidenceRequired: e.target.checked })}
              className="w-4 h-4 accent-[var(--orange)]"
            />
            <span className="text-sm text-[var(--text)]">Evidence required for approval</span>
          </label>
        </div>
      </Modal>
    </div>
  );
}
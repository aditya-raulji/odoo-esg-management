'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { Plus, Edit2, Trash2, Lock } from 'lucide-react';

const RULE_LABELS = {
  XP_THRESHOLD:        { label: 'XP Threshold',          desc: (v) => `Earn ${v} lifetime XP` },
  CHALLENGES_COMPLETED:{ label: 'Challenges Completed',   desc: (v) => `Complete ${v} challenge(s)` },
  CSR_COMPLETED:       { label: 'CSR Activities',         desc: (v) => `Complete ${v} CSR activity/activities` }
};

function BadgeChip({ badge }) {
  const rule = RULE_LABELS[badge.unlockRuleType];
  return (
    <div className={`relative flex flex-col items-center p-5 rounded-2xl border-2 transition-all duration-300 ${
      badge.earned
        ? 'border-[var(--orange)] bg-[var(--orange)]/8 shadow-lg shadow-[var(--orange)]/10'
        : 'border-[var(--border)] bg-[var(--panel)] opacity-60'
    }`}>
      {/* Lock overlay for unearned */}
      {!badge.earned && (
        <div className="absolute top-3 right-3">
          <Lock size={12} className="text-[var(--muted)]" />
        </div>
      )}

      {/* Icon */}
      <div className={`text-4xl mb-3 ${badge.earned ? '' : 'grayscale'}`}>
        {badge.icon}
      </div>

      {/* Name */}
      <h3 className={`text-sm font-bold text-center ${badge.earned ? 'text-[var(--text)]' : 'text-[var(--muted)]'}`}>
        {badge.name}
      </h3>

      {/* Description */}
      <p className="text-[11px] text-[var(--muted)] text-center mt-1">{badge.description}</p>

      {/* Unlock rule */}
      <div className={`mt-2 px-2.5 py-1 rounded-full text-[10px] font-semibold ${
        badge.earned
          ? 'bg-[var(--orange)]/20 text-[var(--orange)]'
          : 'bg-[var(--border)] text-[var(--muted)]'
      }`}>
        {rule?.desc(badge.unlockValue)}
      </div>

      {/* Earned date */}
      {badge.earned && badge.awardedAt && (
        <p className="text-[10px] text-[var(--green)] mt-1.5">
          ✓ Earned {new Date(badge.awardedAt).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}

export default function BadgesPage() {
  const [badges, setBadges] = useState([]);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  // Admin modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', icon: '🏅', unlockRuleType: 'XP_THRESHOLD', unlockValue: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [bRes, sRes] = await Promise.all([
        fetch('/api/gamification/badges'),
        fetch('/api/auth/me')
      ]);
      if (bRes.ok) setBadges(await bRes.json());
      if (sRes.ok) setSession(await sRes.json());
    } catch { toast.error('Failed to load badges'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []); // eslint-disable-line

  const openCreate = () => {
    setModalMode('create');
    setEditTarget(null);
    setForm({ name: '', description: '', icon: '🏅', unlockRuleType: 'XP_THRESHOLD', unlockValue: '' });
    setIsModalOpen(true);
  };

  const openEdit = (b) => {
    setModalMode('edit');
    setEditTarget(b);
    setForm({ name: b.name, description: b.description, icon: b.icon, unlockRuleType: b.unlockRuleType, unlockValue: String(b.unlockValue) });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    setSubmitting(true);
    try {
      const url = modalMode === 'create' ? '/api/gamification/badges' : `/api/gamification/badges/${editTarget.id}`;
      const method = modalMode === 'create' ? 'POST' : 'PUT';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (res.ok) { toast.success(`Badge ${modalMode === 'create' ? 'created' : 'updated'}`); setIsModalOpen(false); fetchAll(); }
      else toast.error(data.error || 'Failed to save');
    } catch { toast.error('Network error'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this badge?')) return;
    const res = await fetch(`/api/gamification/badges/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (res.ok) { toast.success('Badge deleted'); fetchAll(); }
    else toast.error(data.error || 'Failed to delete');
  };

  const isAdmin = session?.role === 'ADMIN';
  const earnedCount = badges.filter((b) => b.earned).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)] tracking-tight font-space">Badges</h1>
          <p className="text-sm text-[var(--muted)]">
            {isAdmin ? 'Manage achievement badges and auto-award rules.' : `You've earned ${earnedCount} of ${badges.length} badges.`}
          </p>
        </div>
        {isAdmin && (
          <Button variant="orange" onClick={openCreate}>
            <Plus size={15} className="mr-1" /> New Badge
          </Button>
        )}
      </div>

      {/* Employee "My Badges" strip */}
      {!isAdmin && earnedCount > 0 && (
        <div className="flex flex-wrap gap-3 p-4 rounded-xl border border-[var(--orange)]/20 bg-[var(--orange)]/5">
          <span className="text-xs font-semibold text-[var(--orange)] w-full">🏅 My Badges</span>
          {badges.filter((b) => b.earned).map((b) => (
            <span key={b.id} title={b.description} className="text-2xl cursor-help">{b.icon}</span>
          ))}
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-[var(--muted)]">Loading badges...</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {badges.map((badge) => (
            <div key={badge.id} className="relative group">
              <BadgeChip badge={badge} />
              {isAdmin && (
                <div className="absolute top-3 left-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(badge)} className="p-1 rounded bg-[var(--panel2)] text-[var(--muted)] hover:text-[var(--text)] transition-colors">
                    <Edit2 size={11} />
                  </button>
                  <button onClick={() => handleDelete(badge.id)} className="p-1 rounded bg-[var(--panel2)] text-[var(--muted)] hover:text-[var(--red)] transition-colors">
                    <Trash2 size={11} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Create Badge' : 'Edit Badge'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="orange" onClick={handleSave} disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Badge'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Input id="badge-icon" label="Icon (emoji)" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="🏅" />
            <div className="col-span-2">
              <Input id="badge-name" label="Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Carbon Saver" />
            </div>
          </div>
          <Textarea id="badge-desc" label="Description *" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Brief description of the badge" />
          <div className="grid grid-cols-2 gap-3">
            <Select id="badge-rule" label="Unlock Rule *" value={form.unlockRuleType} onChange={(e) => setForm({ ...form, unlockRuleType: e.target.value })}>
              <option value="XP_THRESHOLD">XP Threshold</option>
              <option value="CHALLENGES_COMPLETED">Challenges Completed</option>
              <option value="CSR_COMPLETED">CSR Completed</option>
            </Select>
            <Input id="badge-value" label="Threshold Value *" type="number" value={form.unlockValue} onChange={(e) => setForm({ ...form, unlockValue: e.target.value })} placeholder="100" />
          </div>
          <div className="p-3 rounded-lg bg-[var(--orange)]/8 border border-[var(--orange)]/20">
            <p className="text-xs text-[var(--orange)]">
              Preview: <strong>{RULE_LABELS[form.unlockRuleType]?.desc(form.unlockValue || '?')}</strong>
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
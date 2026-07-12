'use client';

import { useState, useEffect, useCallback } from 'react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { formatDate } from '@/lib/utils';
import { Plus, Edit2, Trash2, Gift, Coins, Package, AlertTriangle } from 'lucide-react';

function RewardCard({ reward, userPoints, isAdmin, onEdit, onDelete, onRedeem, redeeming }) {
  const canAfford = userPoints >= reward.pointsRequired;
  const inStock = reward.stock > 0;
  const isActive = reward.status === 'Active';

  return (
    <div className={`flex flex-col rounded-xl border overflow-hidden transition-all duration-200 ${
      isActive && inStock && canAfford
        ? 'border-[var(--orange)]/40 bg-[var(--panel)] hover:shadow-lg hover:shadow-[var(--orange)]/5'
        : 'border-[var(--border)] bg-[var(--panel)] opacity-70'
    }`}>
      {/* Color top bar */}
      <div className={`h-1 ${isActive && inStock ? 'bg-gradient-to-r from-[var(--orange)] to-[var(--amber)]' : 'bg-[var(--border)]'}`} />

      <div className="p-5 flex-1 space-y-3">
        <div className="flex justify-between items-start">
          <div className="w-10 h-10 rounded-xl bg-[var(--orange)]/15 flex items-center justify-center">
            <Gift size={18} className="text-[var(--orange)]" />
          </div>
          {isAdmin && (
            <div className="flex gap-1">
              <button onClick={() => onEdit(reward)} className="p-1.5 rounded text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--border)]/50 transition-colors">
                <Edit2 size={12} />
              </button>
              <button onClick={() => onDelete(reward.id)} className="p-1.5 rounded text-[var(--muted)] hover:text-[var(--red)] hover:bg-[var(--red)]/10 transition-colors">
                <Trash2 size={12} />
              </button>
            </div>
          )}
        </div>

        <div>
          <h3 className="text-[15px] font-bold text-[var(--text)]">{reward.name}</h3>
          <p className="text-sm text-[var(--muted)] mt-1.5 line-clamp-2">{reward.description}</p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Coins size={14} className="text-[var(--orange)]" />
            <span className="text-lg font-extrabold text-[var(--orange)] font-space">{reward.pointsRequired}</span>
            <span className="text-xs text-[var(--muted)]">pts</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
            <Package size={12} />
            <span className={reward.stock <= 3 && reward.stock > 0 ? 'text-[var(--amber)] font-semibold' : ''}>
              {reward.stock === 0 ? 'Out of stock' : `${reward.stock} left`}
            </span>
          </div>
        </div>

        {/* User balance hint */}
        {!isAdmin && !canAfford && isActive && inStock && (
          <div className="flex items-center gap-1.5 text-xs text-[var(--red)]">
            <AlertTriangle size={11} /> Need {reward.pointsRequired - userPoints} more pts
          </div>
        )}
      </div>

      {!isAdmin && (
        <div className="px-5 py-3 border-t border-[var(--border)] bg-[var(--panel2)]/50">
          <Button
            variant="orange"
            size="sm"
            className="w-full justify-center"
            disabled={!canAfford || !inStock || !isActive || redeeming === reward.id}
            onClick={() => onRedeem(reward)}
          >
            {redeeming === reward.id ? 'Redeeming...' : !inStock ? 'Out of Stock' : !canAfford ? `Need ${reward.pointsRequired} pts` : 'Redeem'}
          </Button>
        </div>
      )}
    </div>
  );
}

export default function RewardsPage() {
  const [rewards, setRewards] = useState([]);
  const [redemptions, setRedemptions] = useState([]);
  const [userPoints, setUserPoints] = useState(0);
  const [userXp, setUserXp] = useState(0);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('catalog');
  const [redeeming, setRedeeming] = useState(null);
  const toast = useToast();

  // Admin modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', pointsRequired: '', stock: '', status: 'Active' });
  const [submitting, setSubmitting] = useState(false);

  // Confirm redeem modal
  const [confirmReward, setConfirmReward] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [rRes, sRes, redRes] = await Promise.all([
        fetch('/api/gamification/rewards'),
        fetch('/api/auth/me'),
        fetch('/api/gamification/rewards/redemptions')
      ]);
      if (rRes.ok) {
        const data = await rRes.json();
        setRewards(data.rewards || []);
        setUserPoints(data.userPoints || 0);
        setUserXp(data.userXp || 0);
      }
      if (sRes.ok) setSession(await sRes.json());
      if (redRes.ok) setRedemptions(await redRes.json());
    } catch { toast.error('Failed to load rewards'); }
    finally { setLoading(false); }
  }, []); // eslint-disable-line

  useEffect(() => { fetchAll(); }, []); // eslint-disable-line

  const openCreate = () => {
    setModalMode('create');
    setEditTarget(null);
    setForm({ name: '', description: '', pointsRequired: '', stock: '', status: 'Active' });
    setIsModalOpen(true);
  };

  const openEdit = (r) => {
    setModalMode('edit');
    setEditTarget(r);
    setForm({ name: r.name, description: r.description, pointsRequired: String(r.pointsRequired), stock: String(r.stock), status: r.status });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    setSubmitting(true);
    try {
      const url = modalMode === 'create' ? '/api/gamification/rewards' : `/api/gamification/rewards/${editTarget.id}`;
      const method = modalMode === 'create' ? 'POST' : 'PATCH';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (res.ok) { toast.success(`Reward ${modalMode === 'create' ? 'created' : 'updated'}`); setIsModalOpen(false); fetchAll(); }
      else toast.error(data.error || 'Failed to save');
    } catch { toast.error('Network error'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this reward?')) return;
    const res = await fetch(`/api/gamification/rewards/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (res.ok) { toast.success('Reward deleted'); fetchAll(); }
    else toast.error(data.error || 'Failed to delete');
  };

  const confirmRedeem = (reward) => { setConfirmReward(reward); };

  const handleRedeem = async () => {
    if (!confirmReward) return;
    setRedeeming(confirmReward.id);
    setConfirmReward(null);
    try {
      const res = await fetch(`/api/gamification/rewards/${confirmReward.id}/redeem`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setUserPoints(data.remainingPoints);
        fetchAll();
      } else {
        toast.error(data.error || 'Redemption failed');
      }
    } catch { toast.error('Network error'); }
    finally { setRedeeming(null); }
  };

  const isAdmin = session?.role === 'ADMIN';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)] tracking-tight font-space">Rewards</h1>
          <p className="text-sm text-[var(--muted)]">Redeem points for sustainable rewards.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* User balance */}
          {!isAdmin && (
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--panel)]">
              <div className="text-center">
                <p className="text-xs text-[var(--muted)]">Points</p>
                <p className="text-lg font-extrabold text-[var(--orange)] font-space">{userPoints}</p>
              </div>
              <div className="w-px h-8 bg-[var(--border)]" />
              <div className="text-center">
                <p className="text-xs text-[var(--muted)]">Lifetime XP</p>
                <p className="text-lg font-extrabold text-[var(--blue)] font-space">{userXp}</p>
              </div>
            </div>
          )}
          {isAdmin && (
            <Button variant="orange" onClick={openCreate}>
              <Plus size={15} className="mr-1" /> New Reward
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[var(--panel2)] p-1 rounded-lg w-fit">
        {['catalog', 'history'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === tab ? 'bg-[var(--panel)] text-[var(--text)] shadow-sm' : 'text-[var(--muted)] hover:text-[var(--text)]'}`}
          >
            {tab === 'catalog' ? '🎁 Catalog' : '📋 Redemption History'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-[var(--muted)]">Loading rewards...</div>
      ) : activeTab === 'catalog' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {rewards.map((r) => (
            <RewardCard
              key={r.id}
              reward={r}
              userPoints={userPoints}
              isAdmin={isAdmin}
              onEdit={openEdit}
              onDelete={handleDelete}
              onRedeem={confirmRedeem}
              redeeming={redeeming}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--muted)] text-[11px] uppercase tracking-wider">
                {isAdmin && <th className="text-left px-5 py-3 font-semibold">Employee</th>}
                <th className="text-left px-5 py-3 font-semibold">Reward</th>
                <th className="text-left px-4 py-3 font-semibold">Points Spent</th>
                <th className="text-left px-4 py-3 font-semibold">Date</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {redemptions.length === 0 ? (
                <tr><td colSpan={isAdmin ? 5 : 4} className="text-center py-10 text-[var(--muted)]">No redemptions yet.</td></tr>
              ) : redemptions.map((r, i) => (
                <tr key={r.id} className={`border-b border-[var(--border)]/50 ${i % 2 !== 0 ? 'bg-[var(--panel2)]/30' : ''}`}>
                  {isAdmin && <td className="px-5 py-3 text-[var(--text)]">{r.user?.name} <span className="text-[var(--muted)] text-xs">({r.user?.department?.name})</span></td>}
                  <td className="px-5 py-3 font-medium text-[var(--text)]">{r.reward?.name}</td>
                  <td className="px-4 py-3 text-[var(--orange)] font-bold">{r.pointsSpent} pts</td>
                  <td className="px-4 py-3 text-[var(--muted)]">{formatDate(r.redeemedAt)}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--green)]/15 text-[var(--green)] border border-[var(--green)]/25">
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Admin modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalMode === 'create' ? 'New Reward' : 'Edit Reward'}
        footer={<>
          <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
          <Button variant="orange" onClick={handleSave} disabled={submitting}>{submitting ? 'Saving...' : 'Save Reward'}</Button>
        </>}
      >
        <div className="space-y-4">
          <Input id="rw-name" label="Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Extra Leave Day" />
          <Textarea id="rw-desc" label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
          <div className="grid grid-cols-3 gap-3">
            <Input id="rw-pts" label="Points Required *" type="number" value={form.pointsRequired} onChange={(e) => setForm({ ...form, pointsRequired: e.target.value })} placeholder="500" />
            <Input id="rw-stock" label="Stock *" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} placeholder="10" />
            <Select id="rw-status" label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </Select>
          </div>
        </div>
      </Modal>

      {/* Redeem confirmation modal */}
      <Modal isOpen={!!confirmReward} onClose={() => setConfirmReward(null)} title="Confirm Redemption"
        footer={<>
          <Button variant="ghost" onClick={() => setConfirmReward(null)}>Cancel</Button>
          <Button variant="orange" onClick={handleRedeem}>Confirm Redeem</Button>
        </>}
      >
        {confirmReward && (
          <div className="space-y-3">
            <p className="text-sm text-[var(--text)]">
              Redeem <strong>{confirmReward.name}</strong> for{' '}
              <strong className="text-[var(--orange)]">{confirmReward.pointsRequired} points</strong>?
            </p>
            <p className="text-sm text-[var(--muted)]">
              Your balance after: <strong className="text-[var(--text)]">{userPoints - confirmReward.pointsRequired} points</strong>
            </p>
            <div className="p-3 rounded-lg bg-[var(--amber)]/10 border border-[var(--amber)]/20 text-xs text-[var(--amber)]">
              ⚠️ This action is irreversible. Points will be deducted immediately.
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
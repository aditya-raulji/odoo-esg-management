'use client';

import { useState, useEffect, useCallback } from 'react';
import Button from '@/components/ui/Button';
import ProgressBar from '@/components/ui/ProgressBar';
import Modal from '@/components/ui/Modal';
import Textarea from '@/components/ui/Textarea';
import { useToast } from '@/components/ui/Toast';
import { formatDate } from '@/lib/utils';
import { CheckCircle, XCircle, Upload, FileText, Zap, Target } from 'lucide-react';

const APPROVAL_STYLES = {
  PENDING:  'bg-[var(--amber)]/15 text-[var(--amber)] border border-[var(--amber)]/25',
  APPROVED: 'bg-[var(--green)]/15 text-[var(--green)] border border-[var(--green)]/25',
  REJECTED: 'bg-[var(--red)]/15 text-[var(--red)] border border-[var(--red)]/25'
};

// ──────────────────────────────────────────────
// Admin review queue
// ──────────────────────────────────────────────
function AdminQueue({ participations, onApprove, onReject, processing }) {
  const pending = participations.filter((p) => p.approvalStatus === 'PENDING');

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider">Review Queue ({pending.length})</h2>
      {pending.length === 0 ? (
        <div className="flex items-center justify-center py-12 text-[var(--muted)] text-sm">
          <CheckCircle size={16} className="mr-2 text-[var(--green)]" /> No pending submissions
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--border)] overflow-hidden bg-[var(--panel)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--muted)] text-[11px] uppercase tracking-wider">
                <th className="text-left px-5 py-3 font-semibold">Employee</th>
                <th className="text-left px-4 py-3 font-semibold">Challenge</th>
                <th className="text-left px-4 py-3 font-semibold">Progress</th>
                <th className="text-left px-4 py-3 font-semibold">XP Reward</th>
                <th className="text-left px-4 py-3 font-semibold">Proof</th>
                <th className="text-right px-5 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((p, i) => (
                <tr key={p.id} className={`border-b border-[var(--border)]/50 hover:bg-[var(--panel2)]/60 transition-colors ${i % 2 !== 0 ? 'bg-[var(--panel2)]/30' : ''}`}>
                  <td className="px-5 py-3">
                    <div className="font-medium text-[var(--text)]">{p.user?.name}</div>
                    <div className="text-[11px] text-[var(--muted)]">{p.user?.department?.name}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-[var(--text)] text-[13px]">{p.challenge?.title}</div>
                    <div className="text-[11px] text-[var(--muted)]">Joined {formatDate(p.createdAt)}</div>
                  </td>
                  <td className="px-4 py-3 min-w-[120px]">
                    <ProgressBar value={p.progress} max={100} color="orange" height="h-1.5" showPercent={false} />
                    <span className="text-[11px] text-[var(--muted)]">{p.progress}%</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-sm font-bold text-[var(--orange)]">
                      <Zap size={13} /> {p.challenge?.xp} XP
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {p.proofUrl ? (
                      <a href={p.proofUrl} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1 text-xs text-[var(--blue)] hover:underline">
                        <FileText size={12} /> View Proof
                      </a>
                    ) : (
                      <span className="text-[11px] text-[var(--muted)]">No proof</span>
                    )}
                    {p.challenge?.evidenceRequired && !p.proofUrl && (
                      <div className="text-[10px] text-[var(--red)] mt-0.5">Required!</div>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => onApprove(p.id)}
                        disabled={processing === p.id}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--green)] border border-[var(--green)]/30 hover:bg-[var(--green)]/10 transition-colors disabled:opacity-50"
                      >
                        <CheckCircle size={12} /> Approve
                      </button>
                      <button
                        onClick={() => onReject(p.id)}
                        disabled={processing === p.id}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--red)] border border-[var(--red)]/30 hover:bg-[var(--red)]/10 transition-colors disabled:opacity-50"
                      >
                        <XCircle size={12} /> Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* History */}
      {participations.filter((p) => p.approvalStatus !== 'PENDING').length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider mb-3">History</h2>
          <div className="rounded-xl border border-[var(--border)] overflow-hidden bg-[var(--panel)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--muted)] text-[11px] uppercase tracking-wider">
                  <th className="text-left px-5 py-3 font-semibold">Employee</th>
                  <th className="text-left px-4 py-3 font-semibold">Challenge</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-left px-4 py-3 font-semibold">XP Awarded</th>
                </tr>
              </thead>
              <tbody>
                {participations.filter((p) => p.approvalStatus !== 'PENDING').map((p, i) => (
                  <tr key={p.id} className={`border-b border-[var(--border)]/50 ${i % 2 !== 0 ? 'bg-[var(--panel2)]/30' : ''}`}>
                    <td className="px-5 py-3 text-[var(--text)]">{p.user?.name}</td>
                    <td className="px-4 py-3 text-[var(--muted)]">{p.challenge?.title}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${APPROVAL_STYLES[p.approvalStatus]}`}>
                        {p.approvalStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--orange)] font-bold text-xs">
                      {p.approvalStatus === 'APPROVED' ? `${p.xpAwarded} XP` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Employee "My Challenges" view
// ──────────────────────────────────────────────
function MyParticipations({ participations, session, onUpdateProgress, onUploadProof }) {
  if (participations.length === 0) {
    return (
      <div className="text-center py-12 text-[var(--muted)]">
        <Target size={32} className="mx-auto mb-3 text-[var(--orange)]/40" />
        <p>You haven&apos;t joined any challenges yet.</p>
        <p className="text-xs mt-1">Go to Challenges to join active ones!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {participations.map((p) => (
        <ParticipationCard
          key={p.id}
          participation={p}
          onUpdateProgress={onUpdateProgress}
          onUploadProof={onUploadProof}
        />
      ))}
    </div>
  );
}

function ParticipationCard({ participation: p, onUpdateProgress, onUploadProof }) {
  const [localProgress, setLocalProgress] = useState(p.progress);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const toast = useToast();

  const canUpdate = p.approvalStatus === 'PENDING';

  const saveProgress = async () => {
    setSaving(true);
    try {
      await onUpdateProgress(p.id, localProgress);
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) { toast.error('File must be under 5 MB'); return; }
    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowed.includes(file.type)) { toast.error('Only JPG, PNG, PDF allowed'); return; }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok) {
        await onUploadProof(p.id, data.url);
        toast.success('Proof uploaded!');
      } else {
        toast.error(data.error || 'Upload failed');
      }
    } catch { toast.error('Upload error'); }
    finally { setUploading(false); }
  };

  return (
    <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--panel)] space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-sm font-bold text-[var(--text)]">{p.challenge?.title}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-[var(--orange)] font-semibold flex items-center gap-1">
              <Zap size={11} /> {p.challenge?.xp} XP
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${APPROVAL_STYLES[p.approvalStatus]}`}>
              {p.approvalStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Progress slider */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-[var(--muted)]">
          <span>Progress</span>
          <span className="font-semibold text-[var(--text)]">{localProgress}%</span>
        </div>
        {canUpdate ? (
          <input
            type="range" min={0} max={100} value={localProgress}
            onChange={(e) => setLocalProgress(parseInt(e.target.value))}
            className="w-full accent-[var(--orange)] cursor-pointer"
          />
        ) : (
          <ProgressBar value={p.progress} max={100} color="orange" height="h-2" showPercent={false} />
        )}
        {canUpdate && localProgress !== p.progress && (
          <Button size="xs" variant="ghost" onClick={saveProgress} disabled={saving} className="border border-[var(--orange)]/30 text-[var(--orange)] hover:bg-[var(--orange)]/10">
            {saving ? 'Saving...' : 'Save Progress'}
          </Button>
        )}
      </div>

      {/* Proof upload */}
      {canUpdate && (
        <div>
          {p.proofUrl ? (
            <div className="flex items-center gap-2 text-xs text-[var(--green)]">
              <FileText size={13} /> Proof uploaded
              <a href={p.proofUrl} target="_blank" rel="noreferrer" className="underline text-[var(--blue)]">View</a>
            </div>
          ) : (
            <label className={`flex items-center gap-2 cursor-pointer text-xs px-3 py-2 rounded-lg border ${p.challenge?.evidenceRequired ? 'border-[var(--red)]/40 text-[var(--red)]' : 'border-[var(--border)] text-[var(--muted)]'} hover:bg-[var(--border)]/30 transition-colors`}>
              <Upload size={13} />
              {uploading ? 'Uploading...' : p.challenge?.evidenceRequired ? 'Upload Proof (Required)' : 'Upload Proof'}
              <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={handleFileUpload} className="hidden" disabled={uploading} />
            </label>
          )}
        </div>
      )}

      {p.approvalStatus === 'APPROVED' && (
        <div className="flex items-center gap-2 text-xs text-[var(--green)] font-medium">
          <CheckCircle size={14} /> {p.xpAwarded} XP & points awarded!
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Main page
// ──────────────────────────────────────────────
export default function ChallengeParticipationPage() {
  const [participations, setParticipations] = useState([]);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const toast = useToast();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, sRes] = await Promise.all([
        fetch('/api/gamification/challenge-participation'),
        fetch('/api/auth/me')
      ]);
      if (pRes.ok) setParticipations(await pRes.json());
      if (sRes.ok) setSession(await sRes.json());
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, []); // eslint-disable-line

  useEffect(() => { fetchAll(); }, []); // eslint-disable-line

  const handleApprove = async (id) => {
    setProcessing(id);
    try {
      const res = await fetch(`/api/gamification/challenge-participation/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'APPROVE' })
      });
      const data = await res.json();
      if (res.ok) { toast.success(`Approved! ${data.xpAwarded} XP awarded`); fetchAll(); }
      else toast.error(data.error || 'Approval failed');
    } catch { toast.error('Network error'); }
    finally { setProcessing(null); }
  };

  const handleReject = async (id) => {
    setProcessing(id);
    try {
      const res = await fetch(`/api/gamification/challenge-participation/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REJECT' })
      });
      const data = await res.json();
      if (res.ok) { toast.success('Submission rejected'); fetchAll(); }
      else toast.error(data.error || 'Rejection failed');
    } catch { toast.error('Network error'); }
    finally { setProcessing(null); }
  };

  const handleUpdateProgress = async (id, progress) => {
    const res = await fetch(`/api/gamification/challenge-participation/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ progress })
    });
    const data = await res.json();
    if (res.ok) { toast.success('Progress saved'); fetchAll(); }
    else toast.error(data.error || 'Failed to save');
  };

  const handleUploadProof = async (id, proofUrl) => {
    const res = await fetch(`/api/gamification/challenge-participation/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proofUrl })
    });
    if (res.ok) fetchAll();
  };

  const isAdmin = session?.role === 'ADMIN';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)] tracking-tight font-space">
          {isAdmin ? 'Challenge Participation' : 'My Challenges'}
        </h1>
        <p className="text-sm text-[var(--muted)]">
          {isAdmin ? 'Review employee submissions and award XP.' : 'Track your challenge progress and upload proof.'}
        </p>
      </div>

      {loading ? (
        <div className="text-center py-16 text-[var(--muted)]">Loading...</div>
      ) : isAdmin ? (
        <AdminQueue participations={participations} onApprove={handleApprove} onReject={handleReject} processing={processing} />
      ) : (
        <MyParticipations participations={participations} session={session} onUpdateProgress={handleUpdateProgress} onUploadProof={handleUploadProof} />
      )}
    </div>
  );
}
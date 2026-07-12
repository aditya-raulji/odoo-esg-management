'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Select from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { formatDate } from '@/lib/utils';
import { Plus, Edit2, Trash2, Calendar, FileText, CheckCircle, Info, Shield } from 'lucide-react';

export default function PoliciesPage() {
  const [policies, setPolicies] = useState([]);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [selectedPolicy, setSelectedPolicy] = useState(null);

  // Form states
  const [title, setTitle] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [version, setVersion] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [status, setStatus] = useState('Active');
  const [submitting, setSubmitting] = useState(false);

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        setSession(await res.json());
      }
    } catch (err) {
      console.error('Error fetching session', err);
    }
  };

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/governance/policies');
      if (res.ok) {
        setPolicies(await res.json());
      } else {
        toast.error('Failed to load policies');
      }
    } catch {
      toast.error('Network error while loading policies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
    fetchPolicies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    const payload = {
      title,
      body: bodyText,
      version,
      effectiveDate,
      status
    };

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
      if (res.ok) {
        toast.success('Policy deleted successfully');
        fetchPolicies();
      } else {
        toast.error(data.error || 'Failed to delete policy');
      }
    } catch {
      toast.error('Network error');
    }
  };

  const isAdmin = session?.role === 'ADMIN';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)] tracking-tight font-space">ESG Policies</h1>
          <p className="text-sm text-[var(--muted)]">Active compliance policy registers and governance standards.</p>
        </div>
        {isAdmin && (
          <Button variant="primary" onClick={openCreateModal} className="bg-[var(--purple)] hover:bg-[var(--purple)]/80 text-white">
            <Plus size={16} className="mr-1" /> New Policy
          </Button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-10 text-[var(--muted)]">Loading policies...</div>
      ) : policies.length === 0 ? (
        <div className="text-center py-10 text-[var(--muted)]">No policies found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {policies.map((p) => (
            <Card key={p.id} className="relative flex flex-col justify-between overflow-hidden border border-[var(--border)] bg-[var(--panel)]">
              <div className="p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${p.status === 'Active' ? 'bg-[var(--purple)]/15 text-[var(--purple)] border border-[var(--purple)]/20' : 'bg-[var(--border)] text-[var(--muted)]'}`}>
                    {p.status}
                  </span>
                  <div className="flex gap-2">
                    {isAdmin && (
                      <>
                        <button onClick={() => openEditModal(p)} className="p-1 text-[var(--muted)] hover:text-[var(--text)] transition-colors">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(p.id)} className="p-1 text-[var(--muted)] hover:text-[var(--red)] transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-[var(--text)] tracking-tight">{p.title}</h3>
                  <p className="text-xs text-[var(--muted)] mt-1.5 flex items-center gap-1.5">
                    <Shield size={12} className="text-[var(--purple)]" /> Version {p.version}
                  </p>
                  <p className="text-sm text-[var(--muted)] mt-2.5 line-clamp-4">{p.body}</p>
                </div>
              </div>

              <div className="px-5 py-4 bg-[var(--panel2)] border-t border-[var(--border)] flex justify-between items-center">
                <div className="flex items-center text-xs text-[var(--muted)]">
                  <Calendar size={14} className="mr-1.5 text-[var(--purple)]" />
                  Effective: {formatDate(p.effectiveDate)}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* New/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalMode === 'create' ? 'Create ESG Policy' : 'Edit ESG Policy'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave} disabled={submitting} className="bg-[var(--purple)] hover:bg-[var(--purple)]/80 text-white">
              {submitting ? 'Saving...' : 'Save Policy'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input id="policy-title" label="Policy Title *" placeholder="e.g. Environmental Code of Conduct" value={title} onChange={(e) => setTitle(e.target.value)} required />

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1">
              <Input id="policy-version" label="Version *" placeholder="e.g. 1.0" value={version} onChange={(e) => setVersion(e.target.value)} required />
            </div>
            <div className="col-span-1">
              <Input id="policy-date" label="Effective Date *" type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} required />
            </div>
            <div className="col-span-1">
              <Select id="policy-status" label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </Select>
            </div>
          </div>

          <Textarea id="policy-body" label="Policy Content *" placeholder="Paste or write full policy details here..." value={bodyText} onChange={(e) => setBodyText(e.target.value)} rows={6} required />
        </form>
      </Modal>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { formatDate } from '@/lib/utils';
import { Plus, Edit2, Trash2, Calendar, Award, CheckCircle, Info } from 'lucide-react';

export default function CSRActivitiesPage() {
  const [activities, setActivities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orgSettings, setOrgSettings] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [selectedActivity, setSelectedActivity] = useState(null);

  // Form states
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [pointsReward, setPointsReward] = useState('50');
  const [evidenceRequired, setEvidenceRequired] = useState(false);
  const [status, setStatus] = useState('OPEN');
  const [submitting, setSubmitting] = useState(false);

  const fetchSessionAndSettings = async () => {
    try {
      const sessRes = await fetch('/api/auth/me');
      if (sessRes.ok) {
        const sessData = await sessRes.json();
        setSession(sessData);
        if (sessData.role === 'ADMIN') {
          const catRes = await fetch('/api/settings/categories');
          if (catRes.ok) {
            const cats = await catRes.json();
            setCategories(cats.filter((c) => c.type === 'CSR_ACTIVITY' && c.status === 'Active'));
          }
        }
      }
      const settingsRes = await fetch('/api/settings/esg-config');
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setOrgSettings(settingsData);
        if (settingsData.evidenceRequired) {
          setEvidenceRequired(true);
        }
      }
    } catch (err) {
      console.error('Error fetching session/settings', err);
    }
  };

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/social/csr-activities');
      if (res.ok) {
        setActivities(await res.json());
      } else {
        toast.error('Failed to load CSR activities');
      }
    } catch {
      toast.error('Network error while loading CSR activities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionAndSettings();
    fetchActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync evidenceRequired toggle with global settings
  useEffect(() => {
    if (orgSettings?.evidenceRequired) {
      setEvidenceRequired(true);
    }
  }, [orgSettings]);

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedActivity(null);
    setTitle('');
    setCategoryId(categories[0]?.id || '');
    setDate(new Date().toISOString().slice(0, 10));
    setDescription('');
    setPointsReward('50');
    setEvidenceRequired(orgSettings?.evidenceRequired ?? false);
    setStatus('OPEN');
    setIsModalOpen(true);
  };

  const openEditModal = (act) => {
    setModalMode('edit');
    setSelectedActivity(act);
    setTitle(act.title);
    setCategoryId(act.categoryId);
    setDate(act.date.slice(0, 10));
    setDescription(act.description);
    setPointsReward(String(act.pointsReward));
    setEvidenceRequired(orgSettings?.evidenceRequired ? true : act.evidenceRequired);
    setStatus(act.status);
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const body = {
      title,
      categoryId: parseInt(categoryId),
      date,
      description,
      pointsReward: parseInt(pointsReward),
      evidenceRequired: orgSettings?.evidenceRequired ? true : evidenceRequired,
      status
    };

    try {
      const url = modalMode === 'create' ? '/api/social/csr-activities' : `/api/social/csr-activities/${selectedActivity.id}`;
      const method = modalMode === 'create' ? 'POST' : 'PUT';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`CSR Activity ${modalMode === 'create' ? 'created' : 'updated'} successfully`);
        setIsModalOpen(false);
        fetchActivities();
      } else {
        toast.error(data.error || 'Failed to save activity');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this activity?')) return;
    try {
      const res = await fetch(`/api/social/csr-activities/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        toast.success('CSR Activity deleted successfully');
        fetchActivities();
      } else {
        toast.error(data.error || 'Failed to delete activity');
      }
    } catch {
      toast.error('Network error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">CSR Activities</h1>
          <p className="text-sm text-[var(--muted)]">Participate in corporate social responsibility initiatives.</p>
        </div>
        {session?.role === 'ADMIN' && (
          <Button variant="primary" onClick={openCreateModal} className="bg-[var(--blue)] hover:bg-[var(--blue)]/80 text-white">
            <Plus size={16} className="mr-1" /> New Activity
          </Button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-10 text-[var(--muted)]">Loading activities...</div>
      ) : activities.length === 0 ? (
        <div className="text-center py-10 text-[var(--muted)]">No CSR activities found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activities.map((act) => (
            <Card key={act.id} className="relative flex flex-col justify-between overflow-hidden border border-[var(--border)] bg-[var(--panel)]">
              <div className="p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--blue)]/10 text-[var(--blue)] border border-[var(--blue)]/20">
                    {act.category?.name || 'CSR'}
                  </span>
                  <div className="flex gap-2">
                    {session?.role === 'ADMIN' && (
                      <>
                        <button onClick={() => openEditModal(act)} className="p-1 text-[var(--muted)] hover:text-[var(--text)] transition-colors">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(act.id)} className="p-1 text-[var(--muted)] hover:text-[var(--red)] transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-[var(--text)] tracking-tight">{act.title}</h3>
                  <p className="text-sm text-[var(--muted)] mt-1.5 line-clamp-3">{act.description}</p>
                </div>

                <div className="space-y-2 pt-2 border-t border-[var(--border)]">
                  <div className="flex items-center text-xs text-[var(--muted)]">
                    <Calendar size={14} className="mr-1.5 text-[var(--blue)]" />
                    {formatDate(act.date)}
                  </div>
                  <div className="flex items-center text-xs text-[var(--muted)]">
                    <Award size={14} className="mr-1.5 text-[var(--orange)]" />
                    +{act.pointsReward} Points / XP
                  </div>
                </div>
              </div>

              <div className="px-5 py-4 bg-[var(--panel2)] border-t border-[var(--border)] flex justify-between items-center">
                <span className="text-xs text-[var(--muted)]">
                  {act.joinedCount} joined
                </span>
                <span className={`text-xs font-medium ${act.evidenceRequired ? 'text-[var(--amber)]' : 'text-[var(--green)]'}`}>
                  {act.evidenceRequired ? 'Evidence Required' : 'Open'}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* New/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalMode === 'create' ? 'Create CSR Activity' : 'Edit CSR Activity'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave} disabled={submitting} className="bg-[var(--blue)] hover:bg-[var(--blue)]/80 text-white">
              {submitting ? 'Saving...' : 'Save Activity'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input id="act-title" label="Title *" placeholder="e.g. Tree Plantation Drive" value={title} onChange={(e) => setTitle(e.target.value)} required />

          <div className="grid grid-cols-2 gap-4">
            <Select id="act-category" label="Category *" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
            <Input id="act-date" label="Date *" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input id="act-points" label="Points Reward *" type="number" min="1" value={pointsReward} onChange={(e) => setPointsReward(e.target.value)} required />
            <Select id="act-status" label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="OPEN">Open</option>
              <option value="CLOSED">Closed</option>
            </Select>
          </div>

          <Input id="act-desc" label="Description *" placeholder="Describe the activity..." value={description} onChange={(e) => setDescription(e.target.value)} required />

          <div className="flex flex-col gap-1 bg-[var(--panel2)] p-3.5 rounded-xl border border-[var(--border)]">
            <div className="flex items-center justify-between">
              <label htmlFor="act-evidence" className="text-sm font-medium text-[var(--text)] flex items-center gap-1.5">
                Require Evidence for Completion
                {orgSettings?.evidenceRequired && (
                  <span className="text-[10px] bg-[var(--blue)]/10 text-[var(--blue)] px-1.5 py-0.5 rounded border border-[var(--blue)]/20">Enforced</span>
                )}
              </label>
              <input
                id="act-evidence"
                type="checkbox"
                checked={evidenceRequired}
                onChange={(e) => setEvidenceRequired(e.target.checked)}
                disabled={orgSettings?.evidenceRequired}
                className="w-4 h-4 rounded text-[var(--blue)] focus:ring-[var(--blue)] bg-[var(--panel)] border-[var(--border)] cursor-pointer"
              />
            </div>
            {orgSettings?.evidenceRequired && (
              <p className="text-xs text-[var(--muted)] mt-1.5 flex items-center gap-1">
                <Info size={12} className="text-[var(--blue)] shrink-0" /> Enforced by ESG Configuration settings.
              </p>
            )}
          </div>
        </form>
      </Modal>
    </div>
  );
}
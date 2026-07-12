'use client';

import { useState, useEffect, useCallback } from 'react';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';
import DataTable from '@/components/ui/DataTable';
import StatusPill from '@/components/ui/StatusPill';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { formatDate } from '@/lib/utils';
import { FileText, Check, X, Upload, ExternalLink, AlertCircle } from 'lucide-react';

export default function EmployeeParticipationPage() {
  const [participations, setParticipations] = useState([]);
  const [session, setSession] = useState(null);
  const [orgSettings, setOrgSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  // Rejection Modal
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submittingReject, setSubmittingReject] = useState(false);

  // Upload Proof Modal (for employees)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadingId, setUploadingId] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [submittingUpload, setSubmittingUpload] = useState(false);

  const fetchSessionAndSettings = async () => {
    try {
      const meRes = await fetch('/api/auth/me');
      if (meRes.ok) {
        setSession(await meRes.json());
      }
      const settingsRes = await fetch('/api/settings/esg-config');
      if (settingsRes.ok) {
        setOrgSettings(await settingsRes.json());
      }
    } catch (err) {
      console.error('Error loading session/settings', err);
    }
  };

  const fetchParticipations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/social/employee-participation');
      if (res.ok) {
        setParticipations(await res.json());
      } else {
        toast.error('Failed to load participation records');
      }
    } catch {
      toast.error('Network error while loading records');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSessionAndSettings();
    fetchParticipations();
  }, [fetchParticipations]);

  const handleApprove = async (id) => {
    try {
      const res = await fetch(`/api/social/employee-participation/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approvalStatus: 'APPROVED' })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Approved successfully! Points and XP credited.');
        fetchParticipations();
      } else {
        toast.error(data.error || 'Approval failed');
      }
    } catch {
      toast.error('Network error');
    }
  };

  const handleRejectClick = (id) => {
    setRejectingId(id);
    setRejectionReason('');
    setIsRejectModalOpen(true);
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    setSubmittingReject(true);
    try {
      const res = await fetch(`/api/social/employee-participation/${rejectingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approvalStatus: 'REJECTED',
          rejectionReason
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Participation rejected');
        setIsRejectModalOpen(false);
        fetchParticipations();
      } else {
        toast.error(data.error || 'Rejection failed');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSubmittingReject(false);
    }
  };

  const handleUploadClick = (id) => {
    setUploadingId(id);
    setSelectedFile(null);
    setIsUploadModalOpen(true);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setSubmittingUpload(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      // 1. Upload the file to api/upload
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        toast.error(uploadData.error || 'Upload failed');
        return;
      }

      // 2. Link file url to the participation
      const linkRes = await fetch(`/api/social/employee-participation/${uploadingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proofUrl: uploadData.url })
      });
      const linkData = await linkRes.json();

      if (linkRes.ok) {
        toast.success('Proof uploaded successfully!');
        setIsUploadModalOpen(false);
        fetchParticipations();
      } else {
        toast.error(linkData.error || 'Failed to update record');
      }
    } catch {
      toast.error('Network error during upload');
    } finally {
      setSubmittingUpload(false);
    }
  };

  // Helper to check evidence requirements
  const checkRequiresEvidence = (row) => {
    const globalEnforced = orgSettings?.evidenceRequired ?? true;
    return row.activity?.evidenceRequired || globalEnforced;
  };

  // Define Columns for Admin View
  const adminColumns = [
    { key: 'user', label: 'Employee', render: (val) => val?.name || '—' },
    { key: 'activity', label: 'Activity', render: (val) => val?.title || '—' },
    {
      key: 'proofUrl',
      label: 'Proof',
      render: (val) => {
        if (!val) return <span className="text-[var(--muted)]">—</span>;
        const filename = val.split('/').pop();
        return (
          <a
            href={val}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[var(--blue)]/10 text-[var(--blue)] border border-[var(--blue)]/20 hover:underline text-xs font-medium"
          >
            <FileText size={12} /> {filename} <ExternalLink size={10} />
          </a>
        );
      }
    },
    { key: 'activity', label: 'Points', render: (val) => `+${val?.pointsReward || 0}` },
    {
      key: 'approvalStatus',
      label: 'Approval Status',
      render: (val) => {
        let pillStatus = 'pending';
        if (val === 'APPROVED') pillStatus = 'active';
        if (val === 'REJECTED') pillStatus = 'inactive';
        return <StatusPill status={pillStatus} label={val} />;
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => {
        if (row.approvalStatus !== 'PENDING') return <span className="text-xs text-[var(--muted)]">Resolved</span>;
        const requiresEvidence = checkRequiresEvidence(row);
        const approveDisabled = requiresEvidence && !row.proofUrl;

        return (
          <div className="flex gap-2">
            <div className="relative group">
              <Button
                variant="primary"
                size="xs"
                onClick={() => handleApprove(row.id)}
                disabled={approveDisabled}
                className="bg-[var(--blue)] hover:bg-[var(--blue)]/80 text-white disabled:opacity-40"
              >
                <Check size={12} className="mr-0.5" /> Approve
              </Button>
              {approveDisabled && (
                <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 hidden group-hover:block bg-[var(--panel2)] border border-[var(--border)] text-[var(--text)] text-[10px] p-2 rounded shadow-xl whitespace-nowrap z-30">
                  <div className="flex items-center gap-1 text-[var(--amber)]">
                    <AlertCircle size={10} /> Evidence required before approval
                  </div>
                </div>
              )}
            </div>
            <Button
              variant="danger"
              size="xs"
              onClick={() => handleRejectClick(row.id)}
              className="bg-[var(--red)] hover:bg-[var(--red)]/80 text-white"
            >
              <X size={12} className="mr-0.5" /> Reject
            </Button>
          </div>
        );
      }
    }
  ];

  // Define Columns for Employee View
  const employeeColumns = [
    { key: 'activity', label: 'Activity', render: (val) => val?.title || '—' },
    { key: 'activity', label: 'Date', render: (val) => formatDate(val?.date) },
    { key: 'activity', label: 'Points', render: (val) => `+${val?.pointsReward || 0}` },
    {
      key: 'proofUrl',
      label: 'Proof',
      render: (val, row) => {
        if (val) {
          const filename = val.split('/').pop();
          return (
            <a
              href={val}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[var(--blue)]/10 text-[var(--blue)] border border-[var(--blue)]/20 hover:underline text-xs font-medium"
            >
              <FileText size={12} /> {filename} <ExternalLink size={10} />
            </a>
          );
        }
        if (row.approvalStatus === 'PENDING') {
          return (
            <Button variant="ghost" size="xs" onClick={() => handleUploadClick(row.id)} className="text-[var(--blue)] border-[var(--blue)]/30">
              <Upload size={12} className="mr-0.5" /> Upload Proof
            </Button>
          );
        }
        return <span className="text-[var(--muted)]">—</span>;
      }
    },
    {
      key: 'approvalStatus',
      label: 'Approval Status',
      render: (val) => {
        let pillStatus = 'pending';
        if (val === 'APPROVED') pillStatus = 'active';
        if (val === 'REJECTED') pillStatus = 'inactive';
        return <StatusPill status={pillStatus} label={val} />;
      }
    }
  ];

  const isAdmin = session?.role === 'ADMIN';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)] tracking-tight font-space">
          {isAdmin ? 'Employee Participation: approval queue' : 'Employee CSR Participation'}
        </h1>
        <p className="text-sm text-[var(--muted)] mt-0.5">
          {isAdmin ? 'Review evidence and approve reward points for CSR activities.' : 'Track your logged social activities and submit evidence.'}
        </p>
      </div>

      <Card>
        <DataTable
          columns={isAdmin ? adminColumns : employeeColumns}
          data={participations}
          loading={loading}
          emptyMessage={isAdmin ? 'No pending approval requests.' : 'You have not joined any activities yet.'}
        />
      </Card>

      {/* Reject Modal */}
      <Modal isOpen={isRejectModalOpen} onClose={() => setIsRejectModalOpen(false)} title="Reject Participation"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsRejectModalOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleRejectSubmit} disabled={submittingReject} className="bg-[var(--red)] hover:bg-[var(--red)]/80 text-white">
              {submittingReject ? 'Rejecting...' : 'Reject Request'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleRejectSubmit} className="space-y-4">
          <p className="text-sm text-[var(--muted)]">Please state a reason for rejecting this request. The employee will receive a notification.</p>
          <Input id="reject-reason" label="Rejection Reason" placeholder="e.g. Evidence file is unreadable or incorrect." value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} required />
        </form>
      </Modal>

      {/* Upload Proof Modal */}
      <Modal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} title="Upload Completion Evidence"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsUploadModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleUploadSubmit} disabled={submittingUpload || !selectedFile} className="bg-[var(--blue)] hover:bg-[var(--blue)]/80 text-white">
              {submittingUpload ? 'Uploading...' : 'Submit Evidence'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleUploadSubmit} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--text)]">Select Document or Photo *</label>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={(e) => setSelectedFile(e.target.files[0])}
              className="w-full text-sm text-[var(--text)] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[var(--panel2)] file:text-[var(--text)] file:border-[var(--border)] hover:file:bg-[var(--border)] cursor-pointer"
              required
            />
            <span className="text-[10px] text-[var(--muted)] mt-1">Accepts JPG, PNG, PDF formats. Maximum file size: 5MB.</span>
          </div>
        </form>
      </Modal>
    </div>
  );
}
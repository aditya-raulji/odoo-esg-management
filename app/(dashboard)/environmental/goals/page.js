'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Edit, Trash2, Eye, Download, ChevronDown, X, ArrowUpRight, RefreshCw } from 'lucide-react';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';
import DataTable from '@/components/ui/DataTable';
import StatusPill from '@/components/ui/StatusPill';
import ProgressBar from '@/components/ui/ProgressBar';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { formatDate } from '@/lib/utils';

export default function EnvironmentalGoalsPage() {
  const [data, setData] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Export Dropdown State
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    departmentId: '',
    targetCO2: '',
    currentCO2: '',
    deadline: '',
    status: 'ACTIVE'
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Delete Confirm Modal State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Detail Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentViewGoal, setCurrentViewGoal] = useState(null);

  const toast = useToast();

  useEffect(() => {
    fetchGoals();
    fetchDepartments();
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchGoals = () => {
    setLoading(true);
    fetch('/api/environmental/goals')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch goals');
        return res.json();
      })
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(err => {
        toast.error('Error', err.message || 'Failed to load goals');
        setLoading(false);
      });
  };

  const fetchDepartments = () => {
    fetch('/api/settings/departments')
      .then(res => {
        if (res.ok) return res.json();
        return [];
      })
      .then(d => setDepartments(d))
      .catch(err => console.error('Failed to load departments', err));
  };

  const fetchTransactions = () => {
    fetch('/api/environmental/carbon-transactions')
      .then(res => {
        if (res.ok) return res.json();
        return { data: [] };
      })
      .then(d => setTransactions(d.data || d))
      .catch(err => console.error('Failed to load carbon transactions', err));
  };

  const handleRecompute = async (id) => {
    try {
      const res = await fetch(`/api/environmental/goals/${id}/recompute`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok) { toast.error('Error', json.error || 'Recompute failed'); return; }
      toast.success('Recomputed', `Current CO₂ updated to ${json.currentCO2Tonnes} t from ${json.txCount} transactions`);
      fetchGoals();
    } catch { toast.error('Error', 'Network error'); }
  };

  const handleRecomputeAll = async () => {
    try {
      const res = await fetch('/api/environmental/goals/recompute-all', { method: 'POST' });
      const json = await res.json();
      if (!res.ok) { toast.error('Error', json.error || 'Bulk recompute failed'); return; }
      toast.success('Done', `${json.updated} goals recomputed from carbon transactions`);
      fetchGoals();
    } catch { toast.error('Error', 'Network error'); }
  };

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const nameMatch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const deptMatch = item.department?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      return nameMatch || deptMatch;
    });
  }, [data, searchQuery]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setFormData({
      name: '',
      departmentId: departments[0]?.id || '',
      targetCO2: '',
      currentCO2: '',
      deadline: '',
      status: 'ACTIVE'
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (goal) => {
    setModalMode('edit');
    setCurrentId(goal.id);
    setFormData({
      name: goal.name,
      departmentId: goal.departmentId,
      targetCO2: goal.targetCO2,
      currentCO2: goal.currentCO2,
      deadline: goal.deadline.split('T')[0],
      status: goal.status
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenDelete = (id) => {
    setDeleteId(id);
    setIsDeleteOpen(true);
  };

  const handleOpenView = (goal) => {
    setCurrentViewGoal(goal);
    setIsDrawerOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Goal Name is required';
    if (!formData.departmentId) errors.departmentId = 'Department is required';
    
    const target = parseFloat(formData.targetCO2);
    if (isNaN(target)) {
      errors.targetCO2 = 'Target CO2 is required';
    } else if (target <= 0) {
      errors.targetCO2 = 'Target CO2 must be greater than 0';
    }

    const current = parseFloat(formData.currentCO2);
    if (isNaN(current)) {
      errors.currentCO2 = 'Current CO2 is required';
    } else if (current < 0) {
      errors.currentCO2 = 'Current CO2 cannot be negative';
    }

    if (!formData.deadline) errors.deadline = 'Deadline is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const suggestCompletion = (goal) => {
    toast({
      type: 'info',
      title: 'Goal Reached 100%!',
      message: (
        <div className="mt-1.5 flex flex-col gap-2">
          <p className="text-xs text-[var(--muted)]">Goal &quot;{goal.name}&quot; has reached target. Update status to COMPLETED?</p>
          <button
            onClick={async () => {
              try {
                const res = await fetch(`/api/environmental/goals/${goal.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    name: goal.name,
                    departmentId: goal.departmentId,
                    targetCO2: goal.targetCO2,
                    currentCO2: goal.currentCO2,
                    deadline: goal.deadline,
                    status: 'COMPLETED'
                  })
                });
                if (!res.ok) throw new Error('Failed to update');
                toast.success('Updated', `Goal status set to COMPLETED`);
                fetchGoals();
              } catch (err) {
                toast.error('Error', err.message);
              }
            }}
            className="w-fit px-2 py-1 bg-[var(--green)] hover:bg-green-400 text-black text-xs font-bold rounded shadow transition-all"
          >
            Mark as Completed
          </button>
        </div>
      ),
      duration: 8000
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    const url = modalMode === 'create'
      ? '/api/environmental/goals'
      : `/api/environmental/goals/${currentId}`;
    
    const method = modalMode === 'create' ? 'POST' : 'PUT';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          departmentId: parseInt(formData.departmentId),
          targetCO2: parseFloat(formData.targetCO2),
          currentCO2: parseFloat(formData.currentCO2)
        })
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Operation failed');

      toast.success(
        'Success',
        `Goal ${modalMode === 'create' ? 'created' : 'updated'} successfully`
      );
      setIsModalOpen(false);
      fetchGoals();

      // Check if progress reached 100% and it's not marked Completed
      const progress = Math.min(100, Math.round((result.currentCO2 / result.targetCO2) * 100));
      if (progress >= 100 && result.status !== 'COMPLETED') {
        suggestCompletion(result);
      }
    } catch (err) {
      toast.error('Error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/environmental/goals/${deleteId}`, {
        method: 'DELETE'
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to delete');

      toast.success('Success', 'Goal deleted successfully');
      setIsDeleteOpen(false);
      fetchGoals();
    } catch (err) {
      toast.error('Error', err.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleExportCSV = () => {
    if (data.length === 0) {
      toast.error('Export Failed', 'No goals available to export.');
      return;
    }

    const headers = ['Goal Name', 'Department', 'Target CO2 (t)', 'Current CO2 (t)', 'Progress (%)', 'Deadline', 'Status'];
    const rows = filteredData.map(goal => {
      const progress = Math.min(100, Math.round((goal.currentCO2 / goal.targetCO2) * 100));
      return [
        `"${goal.name.replace(/"/g, '""')}"`,
        `"${(goal.department?.name || '').replace(/"/g, '""')}"`,
        goal.targetCO2,
        goal.currentCO2,
        `${progress}%`,
        formatDate(goal.deadline),
        goal.status
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `environmental_goals_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportOpen(false);

    toast.success('Success', 'Goals exported to CSV successfully');
  };

  // Get department emissions context (summary stats & recent items)
  const deptEmissionsContext = useMemo(() => {
    if (!currentViewGoal) return { total: 0, count: 0, recent: [] };
    
    const deptId = currentViewGoal.departmentId;
    const deptTx = transactions.filter(t => t.departmentId === deptId);
    
    const total = deptTx.reduce((sum, t) => sum + (t.co2Amount / 1000), 0); // Convert kg to tonnes
    const recent = deptTx.slice(0, 5); // top 5 recent
    
    return {
      total: parseFloat(total.toFixed(2)),
      count: deptTx.length,
      recent
    };
  }, [currentViewGoal, transactions]);

  const columns = [
    { key: 'name', label: 'Goal Name' },
    { key: 'department', label: 'Department', render: (val) => val?.name },
    { 
      key: 'targetCO2', 
      label: 'Target CO₂ (t)', 
      render: (val) => `${val.toLocaleString()} t`
    },
    { 
      key: 'currentCO2', 
      label: 'Current CO₂ (t)', 
      render: (val) => `${val.toLocaleString()} t`
    },
    { 
      key: 'progress', 
      label: 'Progress', 
      render: (_, row) => {
        const progress = Math.min(100, Math.round((row.currentCO2 / row.targetCO2) * 100));
        return (
          <div className="flex items-center gap-3 min-w-[120px]">
            <div className="w-24 h-1.5 bg-[var(--border)] rounded-full overflow-hidden shrink-0">
              <div className="h-full bg-[var(--green)] rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-xs font-semibold">{progress}%</span>
          </div>
        );
      }
    },
    { key: 'deadline', label: 'Deadline', render: (val) => formatDate(val) },
    { 
      key: 'status', 
      label: 'Status', 
      render: (val) => {
        if (val === 'ACTIVE') {
          return <StatusPill status="Active" className="bg-transparent border border-green-500/30 text-green-400" />;
        }
        return <StatusPill status={val} />;
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex gap-1.5 justify-end">
          <Button
            variant="ghost"
            size="xs"
            onClick={() => handleRecompute(row.id)}
            className="text-[var(--green)] border-[var(--green)]/30 hover:bg-[var(--green)]/10"
            title="Recompute from transactions"
          >
            <RefreshCw size={12} />
          </Button>
          <Button 
            variant="ghost" 
            size="xs" 
            onClick={() => handleOpenView(row)}
            className="text-[var(--blue)] border-[var(--blue)]/30 hover:bg-[var(--blue)]/10 hover:text-[var(--blue)]"
            title="View Details"
          >
            <Eye size={13} />
          </Button>
          <Button 
            variant="ghost" 
            size="xs" 
            onClick={() => handleOpenEdit(row)}
            className="text-[var(--orange)] border-[var(--orange)]/30 hover:bg-[var(--orange)]/10 hover:text-[var(--orange)]"
            title="Edit"
          >
            <Edit size={13} />
          </Button>
          <Button 
            variant="ghost" 
            size="xs" 
            onClick={() => handleOpenDelete(row.id)}
            className="text-[var(--red)] border-[var(--red)]/30 hover:bg-[var(--red)]/10 hover:text-[var(--red)]"
            title="Delete"
          >
            <Trash2 size={13} />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)] tracking-tight font-space">Environmental Goals</h1>
          <p className="text-sm text-[var(--muted)]">Monitor and track carbon reduction targets across departments.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={handleRecomputeAll} title="Recompute all goals from carbon transactions">
            <RefreshCw size={14} className="mr-1" /> Recompute All
          </Button>
          <Button variant="green" onClick={handleOpenCreate}>
            <Plus size={16} /> New Goal
          </Button>
        </div>
      </div>

      <Card>
        {/* Toolbar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsExportOpen(!isExportOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--panel2)] border border-[var(--border)] rounded-lg text-sm font-semibold hover:bg-[var(--border)] hover:text-[var(--text)] transition-all select-none"
            >
              <Download size={14} /> Export <ChevronDown size={14} className={`transform transition-transform ${isExportOpen ? 'rotate-180' : ''}`} />
            </button>
            {isExportOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsExportOpen(false)} />
                <div className="absolute left-0 mt-1.5 w-40 bg-[var(--panel)] border border-[var(--border)] rounded-lg shadow-xl py-1 z-20 animate-in fade-in duration-100">
                  <button
                    onClick={handleExportCSV}
                    className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-[var(--panel2)] hover:text-[var(--green)] transition-all"
                  >
                    Export as CSV
                  </button>
                  <button
                    disabled
                    className="w-full text-left px-4 py-2 text-xs font-semibold opacity-40 cursor-not-allowed text-[var(--muted)]"
                  >
                    Export as PDF (Reports)
                  </button>
                  <button
                    disabled
                    className="w-full text-left px-4 py-2 text-xs font-semibold opacity-40 cursor-not-allowed text-[var(--muted)]"
                  >
                    Export as Excel (Reports)
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--muted)]" />
            <input
              type="text"
              placeholder="Search goals or departments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[var(--panel2)] border border-[var(--border)] rounded-lg text-sm text-[var(--text)] focus:outline-none focus:border-[var(--green)] focus:ring-1 focus:ring-[var(--green)] transition-all placeholder:text-[var(--muted)]"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <svg className="animate-spin h-6 w-6 text-[var(--green)]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-[var(--panel2)] rounded-full flex items-center justify-center mb-4 text-[var(--green)] border border-[var(--green)]/20 shadow-lg shadow-[var(--green)]/5">
              <svg className="h-7 w-7 text-[var(--green)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-[var(--text)] font-space mb-1">No goals found</h3>
            <p className="text-xs text-[var(--muted)] max-w-xs mb-3">Set up a carbon reduction goal or adjust your search.</p>
          </div>
        ) : (
          <DataTable 
            columns={columns} 
            data={filteredData} 
            loading={loading}
          />
        )}

        <div className="mt-4 text-center">
          <span className="text-[11px] text-[var(--muted)] italic tracking-wide">
            * Carbon Transactions auto-generated from Purchase/Manufacturing/Fleet/Expenses
          </span>
        </div>
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Create Environmental Goal' : 'Edit Environmental Goal'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="green" 
              onClick={handleSubmit}
              loading={submitting}
            >
              {modalMode === 'create' ? 'Create' : 'Save Changes'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="name"
            label="Goal Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Cut Packaging Carbon Footprint"
            error={formErrors.name}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              id="departmentId"
              label="Department"
              value={formData.departmentId}
              onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
              error={formErrors.departmentId}
              required
            >
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </Select>

            <Input
              id="deadline"
              label="Deadline"
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              error={formErrors.deadline}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              id="targetCO2"
              label="Target CO₂ (tonnes)"
              type="number"
              step="any"
              value={formData.targetCO2}
              onChange={(e) => setFormData({ ...formData, targetCO2: e.target.value })}
              placeholder="e.g. 500"
              error={formErrors.targetCO2}
              required
            />

            <Input
              id="currentCO2"
              label="Current CO₂ (tonnes)"
              type="number"
              step="any"
              value={formData.currentCO2}
              onChange={(e) => setFormData({ ...formData, currentCO2: e.target.value })}
              placeholder="e.g. 150"
              error={formErrors.currentCO2}
              required
            />
          </div>

          <Select
            id="status"
            label="Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          >
            <option value="ACTIVE">Active (Green Outline)</option>
            <option value="ON_TRACK">On Track (Solid Green)</option>
            <option value="COMPLETED">Completed (Solid Blue)</option>
          </Select>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Confirm Deletion"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="danger" 
              onClick={handleDelete}
              loading={deleting}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-[var(--muted)]">
          Are you sure you want to delete this environmental goal? This action cannot be undone.
        </p>
      </Modal>

      {/* View Detail Drawer (Dept Emission Context) */}
      {isDrawerOpen && currentViewGoal && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity duration-200" 
            onClick={() => setIsDrawerOpen(false)}
          />
          
          {/* Drawer Content */}
          <div className="relative w-full max-w-lg bg-[var(--panel)] border-l border-[var(--border)] h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-250">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border)]">
              <div>
                <span className="text-[10px] tracking-wider uppercase font-semibold text-[var(--green)]">Goal details & context</span>
                <h2 className="text-lg font-bold text-[var(--text)] font-space mt-0.5">{currentViewGoal.name}</h2>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--panel2)] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Goal parameters Card */}
              <div className="bg-[var(--panel2)] p-4 rounded-xl border border-[var(--border)] space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--muted)]">Department</span>
                  <span className="text-sm font-bold text-[var(--text)]">{currentViewGoal.department?.name}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--muted)]">Deadline</span>
                  <span className="text-sm font-bold text-[var(--text)]">{formatDate(currentViewGoal.deadline)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--muted)]">Goal Status</span>
                  {currentViewGoal.status === 'ACTIVE' ? (
                    <StatusPill status="Active" className="bg-transparent border border-green-500/30 text-green-400" />
                  ) : (
                    <StatusPill status={currentViewGoal.status} />
                  )}
                </div>

                <div className="border-t border-[var(--border)] pt-4 space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-[var(--muted)]">Reduction Progress:</span>
                    <span className="text-[var(--green)]">
                      {Math.min(100, Math.round((currentViewGoal.currentCO2 / currentViewGoal.targetCO2) * 100))}%
                    </span>
                  </div>
                  <ProgressBar 
                    value={currentViewGoal.currentCO2} 
                    max={currentViewGoal.targetCO2} 
                    showPercent={false}
                  />
                  <div className="flex justify-between text-[11px] text-[var(--muted)] mt-1">
                    <span>Current: {currentViewGoal.currentCO2.toLocaleString()} t CO₂</span>
                    <span>Target: {currentViewGoal.targetCO2.toLocaleString()} t CO₂</span>
                  </div>
                </div>
              </div>

              {/* Department Emission Context */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[var(--text)] font-space uppercase tracking-wider">Department Emissions Context</h3>
                  <span className="flex items-center gap-0.5 text-xs text-[var(--green)] font-semibold">
                    Live Data <ArrowUpRight size={14} />
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[var(--panel2)] p-4 rounded-xl border border-[var(--border)] text-center">
                    <span className="text-[10px] text-[var(--muted)] font-semibold uppercase tracking-wider">Total logged emissions</span>
                    <p className="text-2xl font-extrabold text-[var(--text)] font-space mt-1">{deptEmissionsContext.total} t</p>
                  </div>
                  <div className="bg-[var(--panel2)] p-4 rounded-xl border border-[var(--border)] text-center">
                    <span className="text-[10px] text-[var(--muted)] font-semibold uppercase tracking-wider">Transaction logs</span>
                    <p className="text-2xl font-extrabold text-[var(--text)] font-space mt-1">{deptEmissionsContext.count} entries</p>
                  </div>
                </div>

                {/* Recent department transactions */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider">Recent Carbon Transactions</h4>
                  {deptEmissionsContext.recent.length === 0 ? (
                    <div className="bg-[var(--panel2)] p-4 rounded-xl border border-[var(--border)] text-center text-xs text-[var(--muted)]">
                      No carbon transaction logs found for this department.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {deptEmissionsContext.recent.map(t => (
                        <div key={t.id} className="flex justify-between items-center bg-[var(--panel2)] border border-[var(--border)] px-3.5 py-2.5 rounded-lg text-xs hover:border-[var(--green)]/20 transition-all">
                          <div>
                            <p className="font-semibold text-[var(--text)]">{t.emissionFactor?.name}</p>
                            <p className="text-[10px] text-[var(--muted)] mt-0.5">{formatDate(t.date)} • {t.quantity} {t.emissionFactor?.unit}</p>
                          </div>
                          <span className="font-bold text-[var(--red)]">{t.co2Amount.toLocaleString()} kg CO₂</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--panel2)] flex justify-end">
              <Button variant="ghost" onClick={() => setIsDrawerOpen(false)}>
                Close Context
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';
import DataTable from '@/components/ui/DataTable';
import StatusPill from '@/components/ui/StatusPill';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { Plus, Edit2, Trash2 } from 'lucide-react';

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [selectedDept, setSelectedDept] = useState(null);
  const toast = useToast();

  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [head, setHead] = useState('');
  const [parentId, setParentId] = useState('');
  const [employeeCount, setEmployeeCount] = useState('0');
  const [status, setStatus] = useState('Active');
  const [submitting, setSubmitting] = useState(false);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings/departments');
      if (res.ok) {
        const data = await res.json();
        setDepartments(data);
      } else {
        toast.error('Failed to load departments');
      }
    } catch (err) {
      toast.error('Network error while loading departments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedDept(null);
    setName('');
    setCode('');
    setHead('');
    setParentId('');
    setEmployeeCount('0');
    setStatus('Active');
    setIsModalOpen(true);
  };

  const openEditModal = (dept) => {
    setModalMode('edit');
    setSelectedDept(dept);
    setName(dept.name);
    setCode(dept.code);
    setHead(dept.head);
    setParentId(dept.parentId ? String(dept.parentId) : '');
    setEmployeeCount(String(dept.employeeCount));
    setStatus(dept.status);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !code.trim() || !head.trim()) {
      toast.warning('Validation Warning', 'Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    const payload = {
      name,
      code,
      head,
      parentId: parentId ? parseInt(parentId) : null,
      employeeCount: parseInt(employeeCount) || 0,
      status
    };

    try {
      let res;
      if (modalMode === 'create') {
        res = await fetch('/api/settings/departments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`/api/settings/departments/${selectedDept.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      const result = await res.json();

      if (res.ok) {
        toast.success(
          `Department ${modalMode === 'create' ? 'Created' : 'Updated'}`,
          `Successfully saved ${name}.`
        );
        setIsModalOpen(false);
        fetchDepartments();
      } else {
        toast.error('Operation Failed', result.error || 'Server error occurred.');
      }
    } catch (err) {
      toast.error('Error', 'An error occurred during submission.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (dept) => {
    if (!window.confirm(`Are you sure you want to delete ${dept.name}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/settings/departments/${dept.id}`, {
        method: 'DELETE'
      });
      const result = await res.json();

      if (res.ok) {
        toast.success('Department Deleted', `Successfully removed ${dept.name}.`);
        fetchDepartments();
      } else {
        toast.error('Failed to Delete', result.error || 'Check department dependencies.');
      }
    } catch (err) {
      toast.error('Network Error', 'Could not complete the delete request.');
    }
  };

  // Exclude self from parent options during edit
  const parentOptions = departments.filter((d) => {
    if (modalMode === 'edit' && selectedDept) {
      return d.id !== selectedDept.id;
    }
    return true;
  });

  const columns = [
    { key: 'code', label: 'Code' },
    { key: 'name', label: 'Department Name' },
    { key: 'head', label: 'Head of Department' },
    { key: 'parent', label: 'Parent Dept', render: (val) => val?.name || '—' },
    { key: 'employeeCount', label: 'Employees' },
    { key: 'status', label: 'Status', render: (val) => <StatusPill status={val} /> },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <Button variant="edit" size="xs" onClick={() => openEditModal(row)} aria-label={`Edit ${row.name}`}>
            <Edit2 size={12} className="mr-1" /> Edit
          </Button>
          <Button variant="danger" size="xs" onClick={() => handleDelete(row)} aria-label={`Delete ${row.name}`}>
            <Trash2 size={12} className="mr-1" /> Delete
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Departments</h1>
          <p className="text-sm text-[var(--muted)]">Manage business departments, parent hierarchies, and status flags.</p>
        </div>
        <Button variant="ghost" onClick={openCreateModal} className="bg-white text-black hover:bg-neutral-200 border-none">
          <Plus size={16} className="mr-2" /> New Department
        </Button>
      </div>

      {/* Table */}
      <Card>
        <DataTable columns={columns} data={departments} loading={loading} />
      </Card>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Create Department' : 'Edit Department'}
        footer={
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="green" onClick={handleSubmit} loading={submitting}>
              {modalMode === 'create' ? 'Create' : 'Save Changes'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="dept-name"
            label="Department Name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Quality Assurance"
            required
          />

          <Input
            id="dept-code"
            label="Unique Department Code *"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g. QA"
            required
            disabled={modalMode === 'edit'} // Lock code on edit for consistency
          />

          <Input
            id="dept-head"
            label="Head of Department *"
            value={head}
            onChange={(e) => setHead(e.target.value)}
            placeholder="e.g. J. Doe"
            required
          />

          <Select
            id="dept-parent"
            label="Parent Department"
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
          >
            <option value="">None (Top-Level)</option>
            {parentOptions.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.code})
              </option>
            ))}
          </Select>

          <Input
            id="dept-employees"
            label="Employee Count"
            type="number"
            value={employeeCount}
            onChange={(e) => setEmployeeCount(e.target.value)}
            min="0"
          />

          <Select
            id="dept-status"
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </Select>
        </form>
      </Modal>
    </div>
  );
}
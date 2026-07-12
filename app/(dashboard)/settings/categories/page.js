'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import DataTable from '@/components/ui/DataTable';
import StatusPill from '@/components/ui/StatusPill';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { Plus, Edit2, Trash2 } from 'lucide-react';

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'CSR_ACTIVITY' | 'CHALLENGE'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [selectedCategory, setSelectedCategory] = useState(null);
  const toast = useToast();

  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState('CSR_ACTIVITY');
  const [status, setStatus] = useState('Active');
  const [submitting, setSubmitting] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      } else {
        toast.error('Failed to load categories');
      }
    } catch (err) {
      toast.error('Network error while loading categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedCategory(null);
    setName('');
    setType('CSR_ACTIVITY');
    setStatus('Active');
    setIsModalOpen(true);
  };

  const openEditModal = (cat) => {
    setModalMode('edit');
    setSelectedCategory(cat);
    setName(cat.name);
    setType(cat.type);
    setStatus(cat.status);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.warning('Validation Warning', 'Category Name is required.');
      return;
    }

    setSubmitting(true);
    const payload = { name: name.trim(), type, status };

    try {
      let res;
      if (modalMode === 'create') {
        res = await fetch('/api/settings/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`/api/settings/categories/${selectedCategory.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      const result = await res.json();

      if (res.ok) {
        toast.success(
          `Category ${modalMode === 'create' ? 'Created' : 'Updated'}`,
          `Successfully saved ${name}.`
        );
        setIsModalOpen(false);
        fetchCategories();
      } else {
        toast.error('Operation Failed', result.error || 'Server error occurred.');
      }
    } catch (err) {
      toast.error('Error', 'An error occurred during submission.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (cat) => {
    if (!window.confirm(`Are you sure you want to delete ${cat.name}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/settings/categories/${cat.id}`, {
        method: 'DELETE'
      });
      const result = await res.json();

      if (res.ok) {
        toast.success('Category Deleted', `Successfully removed ${cat.name}.`);
        fetchCategories();
      } else {
        toast.error('Failed to Delete', result.error || 'Check category dependencies.');
      }
    } catch (err) {
      toast.error('Network Error', 'Could not complete the delete request.');
    }
  };

  const filteredCategories = categories.filter((cat) => {
    if (activeTab === 'ALL') return true;
    return cat.type === activeTab;
  });

  const columns = [
    { key: 'name', label: 'Category Name' },
    {
      key: 'type',
      label: 'Type',
      render: (val) => (
        <span className="text-xs uppercase px-2 py-0.5 rounded bg-[var(--panel2)] border border-[var(--border)]">
          {val === 'CSR_ACTIVITY' ? 'CSR Activity' : 'Challenge'}
        </span>
      )
    },
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
          <h1 className="text-2xl font-bold text-[var(--text)]">Categories</h1>
          <p className="text-sm text-[var(--muted)]">Configure category groups for CSR Activities and Gamification Challenges.</p>
        </div>
        <Button variant="ghost" onClick={openCreateModal} className="bg-white text-black hover:bg-neutral-200 border-none">
          <Plus size={16} className="mr-2" /> New Category
        </Button>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { label: 'All', value: 'ALL' },
          { label: 'CSR Activities', value: 'CSR_ACTIVITY' },
          { label: 'Challenges', value: 'CHALLENGE' }
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap ${
              activeTab === tab.value
                ? 'bg-[var(--blue)]/15 border-[var(--blue)] text-[var(--blue)]'
                : 'bg-[var(--panel)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <Card>
        <DataTable columns={columns} data={filteredCategories} loading={loading} />
      </Card>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Create Category' : 'Edit Category'}
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
            id="cat-name"
            label="Category Name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Waste Management"
            required
          />

          <Select
            id="cat-type"
            label="Type"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="CSR_ACTIVITY">CSR Activity</option>
            <option value="CHALLENGE">Challenge</option>
          </Select>

          <Select
            id="cat-status"
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

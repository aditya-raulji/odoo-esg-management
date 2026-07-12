'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';
import DataTable from '@/components/ui/DataTable';
import StatusPill from '@/components/ui/StatusPill';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';

export default function EmissionFactorsPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSourceType, setSelectedSourceType] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    sourceType: 'PURCHASE',
    unit: '',
    co2PerUnit: '',
    status: 'Active'
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Delete Confirm Modal State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const toast = useToast();

  const sourceTypes = ['ALL', 'PURCHASE', 'MANUFACTURING', 'FLEET', 'EXPENSE'];

  useEffect(() => {
    fetchFactors();
  }, []);

  const fetchFactors = () => {
    setLoading(true);
    fetch('/api/environmental/emission-factors')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch emission factors');
        return res.json();
      })
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(err => {
        toast.error('Error', err.message || 'Failed to load emission factors');
        setLoading(false);
      });
  };

  // Filtered data based on search and chip selection
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.unit.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedSourceType === 'ALL' || item.sourceType.toUpperCase() === selectedSourceType;
      return matchesSearch && matchesType;
    });
  }, [data, searchQuery, selectedSourceType]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setFormData({
      name: '',
      sourceType: 'PURCHASE',
      unit: '',
      co2PerUnit: '',
      status: 'Active'
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (factor) => {
    setModalMode('edit');
    setCurrentId(factor.id);
    setFormData({
      name: factor.name,
      sourceType: factor.sourceType,
      unit: factor.unit,
      co2PerUnit: factor.co2PerUnit,
      status: factor.status
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenDelete = (id) => {
    setDeleteId(id);
    setIsDeleteOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.unit.trim()) errors.unit = 'Unit is required';
    
    const co2 = parseFloat(formData.co2PerUnit);
    if (isNaN(co2)) {
      errors.co2PerUnit = 'CO2 per unit must be a number';
    } else if (co2 <= 0) {
      errors.co2PerUnit = 'CO2 per unit must be greater than 0';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    const url = modalMode === 'create' 
      ? '/api/environmental/emission-factors' 
      : `/api/environmental/emission-factors/${currentId}`;
    
    const method = modalMode === 'create' ? 'POST' : 'PUT';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          co2PerUnit: parseFloat(formData.co2PerUnit)
        })
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Operation failed');

      toast.success(
        'Success', 
        `Emission factor ${modalMode === 'create' ? 'created' : 'updated'} successfully`
      );
      setIsModalOpen(false);
      fetchFactors();
    } catch (err) {
      toast.error('Error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/environmental/emission-factors/${deleteId}`, {
        method: 'DELETE'
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to delete');

      toast.success('Success', 'Emission factor deleted successfully');
      setIsDeleteOpen(false);
      fetchFactors();
    } catch (err) {
      toast.error('Error', err.message);
    } finally {
      setDeleting(false);
    }
  };

  const renderSourceTypePill = (type) => {
    const map = {
      PURCHASE: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
      MANUFACTURING: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
      FLEET: 'bg-green-500/10 text-green-400 border border-green-500/20',
      EXPENSE: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
    };
    const style = map[type?.toUpperCase()] || 'bg-white/5 text-[var(--muted)]';
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style}`}>
        {type?.charAt(0) + type?.slice(1).toLowerCase()}
      </span>
    );
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { 
      key: 'sourceType', 
      label: 'Source Type', 
      render: (val) => renderSourceTypePill(val) 
    },
    { key: 'unit', label: 'Unit' },
    { 
      key: 'co2PerUnit', 
      label: 'kg CO₂ per Unit',
      render: (val) => val.toFixed(4)
    },
    { 
      key: 'status', 
      label: 'Status', 
      render: (val) => <StatusPill status={val} /> 
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex gap-2 justify-end">
          <Button 
            variant="ghost" 
            size="xs" 
            onClick={() => handleOpenEdit(row)}
            className="text-[var(--orange)] border-[var(--orange)]/30 hover:bg-[var(--orange)]/10 hover:text-[var(--orange)]"
            title="Edit"
          >
            <Edit size={14} />
          </Button>
          <Button 
            variant="ghost" 
            size="xs" 
            onClick={() => handleOpenDelete(row.id)}
            className="text-[var(--red)] border-[var(--red)]/30 hover:bg-[var(--red)]/10 hover:text-[var(--red)]"
            title="Delete"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)] tracking-tight font-space">Emission Factors</h1>
          <p className="text-sm text-[var(--muted)]">Emission factors for carbon calculations.</p>
        </div>
        <Button variant="green" onClick={handleOpenCreate}>
          <Plus size={16} /> New Factor
        </Button>
      </div>

      <Card>
        {/* Toolbar */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          {/* Filter chips */}
          <div className="flex flex-wrap gap-2">
            {sourceTypes.map((type) => {
              const isActive = selectedSourceType === type;
              return (
                <button
                  key={type}
                  onClick={() => setSelectedSourceType(type)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150 ${
                    isActive
                      ? 'bg-[var(--green)] text-black border-[var(--green)]'
                      : 'bg-[var(--panel2)] border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--muted)]'
                  }`}
                >
                  {type === 'ALL' ? 'All' : type.charAt(0) + type.slice(1).toLowerCase()}
                </button>
              );
            })}
          </div>

          {/* Search box */}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--muted)]" />
            <input
              type="text"
              placeholder="Search factors..."
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
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-[var(--text)] font-space mb-1">No emission factors found</h3>
            <p className="text-xs text-[var(--muted)] max-w-xs mb-3">Add a new emission factor or adjust your filters.</p>
          </div>
        ) : (
          <DataTable 
            columns={columns} 
            data={filteredData} 
            loading={loading}
          />
        )}
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Create Emission Factor' : 'Edit Emission Factor'}
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
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Biodiesel B20, Heavy Truck Freight"
            error={formErrors.name}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              id="sourceType"
              label="Source Type"
              value={formData.sourceType}
              onChange={(e) => setFormData({ ...formData, sourceType: e.target.value })}
            >
              <option value="PURCHASE">Purchase</option>
              <option value="MANUFACTURING">Manufacturing</option>
              <option value="FLEET">Fleet</option>
              <option value="EXPENSE">Expense</option>
            </Select>

            <Input
              id="unit"
              label="Unit"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              placeholder="e.g. litre, kWh, kg, tonne-km"
              error={formErrors.unit}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              id="co2PerUnit"
              label="kg CO₂ per Unit"
              type="number"
              step="any"
              value={formData.co2PerUnit}
              onChange={(e) => setFormData({ ...formData, co2PerUnit: e.target.value })}
              placeholder="e.g. 2.68"
              error={formErrors.co2PerUnit}
              required
            />

            <Select
              id="status"
              label="Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </Select>
          </div>
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
          Are you sure you want to delete this emission factor? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Edit, Trash2, LayoutGrid, Table as TableIcon } from 'lucide-react';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';
import DataTable from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';

export default function ProductESGProfilesPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('card'); // 'card' | 'table'

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    carbonFootprintPerUnit: '',
    recyclablePercent: '',
    sustainabilityRating: 'A',
    notes: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Delete Confirm Modal State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const toast = useToast();

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = () => {
    setLoading(true);
    fetch('/api/environmental/product-esg-profiles')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch product profiles');
        return res.json();
      })
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(err => {
        toast.error('Error', err.message || 'Failed to load product ESG profiles');
        setLoading(false);
      });
  };

  const filteredData = useMemo(() => {
    return data.filter(item => {
      return (
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [data, searchQuery]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setFormData({
      name: '',
      sku: '',
      category: '',
      carbonFootprintPerUnit: '',
      recyclablePercent: '',
      sustainabilityRating: 'A',
      notes: ''
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (profile) => {
    setModalMode('edit');
    setCurrentId(profile.id);
    setFormData({
      name: profile.name,
      sku: profile.sku,
      category: profile.category,
      carbonFootprintPerUnit: profile.carbonFootprintPerUnit,
      recyclablePercent: profile.recyclablePercent,
      sustainabilityRating: profile.sustainabilityRating,
      notes: profile.notes || ''
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
    if (!formData.name.trim()) errors.name = 'Product Name is required';
    if (!formData.sku.trim()) errors.sku = 'SKU is required';
    if (!formData.category.trim()) errors.category = 'Category is required';

    const carbon = parseFloat(formData.carbonFootprintPerUnit);
    if (isNaN(carbon)) {
      errors.carbonFootprintPerUnit = 'Carbon footprint must be a number';
    } else if (carbon < 0) {
      errors.carbonFootprintPerUnit = 'Carbon footprint cannot be negative';
    }

    const pct = parseInt(formData.recyclablePercent);
    if (isNaN(pct)) {
      errors.recyclablePercent = 'Recyclable percent is required';
    } else if (pct < 0 || pct > 100) {
      errors.recyclablePercent = 'Recyclable percent must be between 0 and 100';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    const url = modalMode === 'create'
      ? '/api/environmental/product-esg-profiles'
      : `/api/environmental/product-esg-profiles/${currentId}`;
    
    const method = modalMode === 'create' ? 'POST' : 'PUT';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          carbonFootprintPerUnit: parseFloat(formData.carbonFootprintPerUnit),
          recyclablePercent: parseInt(formData.recyclablePercent)
        })
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Operation failed');

      toast.success(
        'Success',
        `Product profile ${modalMode === 'create' ? 'created' : 'updated'} successfully`
      );
      setIsModalOpen(false);
      fetchProfiles();
    } catch (err) {
      toast.error('Error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/environmental/product-esg-profiles/${deleteId}`, {
        method: 'DELETE'
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to delete');

      toast.success('Success', 'Product profile deleted successfully');
      setIsDeleteOpen(false);
      fetchProfiles();
    } catch (err) {
      toast.error('Error', err.message);
    } finally {
      setDeleting(false);
    }
  };

  const getRatingBadge = (rating) => {
    const ratingColors = {
      A: 'bg-green-500/10 text-green-400 border-green-500/20',
      B: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      C: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      D: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      E: 'bg-red-500/10 text-red-400 border-red-500/20'
    };
    const style = ratingColors[rating] || 'bg-white/5 text-[var(--muted)] border-[var(--border)]';
    return (
      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold border ${style}`}>
        {rating}
      </span>
    );
  };

  const columns = [
    { key: 'sku', label: 'SKU' },
    { key: 'name', label: 'Product Name' },
    { key: 'category', label: 'Category' },
    { 
      key: 'carbonFootprintPerUnit', 
      label: 'Carbon Footprint/Unit (kg)',
      render: (val) => `${val.toFixed(2)} kg CO₂`
    },
    { 
      key: 'recyclablePercent', 
      label: 'Recyclable %', 
      render: (val) => (
        <div className="flex items-center gap-2">
          <div className="w-16 h-1.5 bg-[var(--border)] rounded-full overflow-hidden shrink-0">
            <div className="h-full bg-[var(--green)] rounded-full" style={{ width: `${val}%` }} />
          </div>
          <span className="text-xs font-semibold">{val}%</span>
        </div>
      )
    },
    { 
      key: 'sustainabilityRating', 
      label: 'Rating', 
      render: (val) => getRatingBadge(val) 
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
          <h1 className="text-2xl font-bold text-[var(--text)] tracking-tight font-space">Product ESG Profiles</h1>
          <p className="text-sm text-[var(--muted)]">Carbon footprint and recyclability metrics for products.</p>
        </div>
        <Button variant="green" onClick={handleOpenCreate}>
          <Plus size={16} /> New Product
        </Button>
      </div>

      {/* Toolbar / Search & View Switcher */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--muted)]" />
          <input
            type="text"
            placeholder="Search products by name, SKU or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[var(--panel)] border border-[var(--border)] rounded-lg text-sm text-[var(--text)] focus:outline-none focus:border-[var(--green)] focus:ring-1 focus:ring-[var(--green)] transition-all placeholder:text-[var(--muted)]"
          />
        </div>

        {/* View Switcher Toggle */}
        <div className="flex bg-[var(--panel)] border border-[var(--border)] p-1 rounded-lg self-start sm:self-auto">
          <button
            onClick={() => setViewMode('card')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              viewMode === 'card'
                ? 'bg-[var(--green)] text-black'
                : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
            title="Card Grid View"
          >
            <LayoutGrid size={14} /> Card View
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              viewMode === 'table'
                ? 'bg-[var(--green)] text-black'
                : 'text-[var(--muted)] hover:text-[var(--text)]'
            }`}
            title="Table List View"
          >
            <TableIcon size={14} /> Table View
          </button>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <svg className="animate-spin h-8 w-8 text-[var(--green)]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : filteredData.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-[var(--panel2)] rounded-full flex items-center justify-center mb-4 text-[var(--green)] border border-[var(--green)]/20 shadow-lg shadow-[var(--green)]/5">
            <LayoutGrid size={28} />
          </div>
          <h3 className="text-lg font-bold text-[var(--text)] font-space mb-1">No products found</h3>
          <p className="text-sm text-[var(--muted)] max-w-xs mb-4">Create your first product ESG profile or refine your search.</p>
          <Button variant="green" onClick={handleOpenCreate}>
            <Plus size={16} /> Add Product
          </Button>
        </Card>
      ) : viewMode === 'table' ? (
        <Card>
          <DataTable 
            columns={columns} 
            data={filteredData} 
            loading={loading}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredData.map(product => (
            <Card key={product.id} className="flex flex-col justify-between hover:border-[var(--green)]/30 hover:shadow-lg hover:shadow-[var(--green)]/2 transition-all duration-300 relative group">
              <div>
                {/* Header info */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <span className="text-[10px] tracking-wider uppercase font-semibold text-[var(--muted)] font-mono">{product.sku}</span>
                    <h3 className="text-lg font-bold text-[var(--text)] font-space leading-tight mt-0.5 group-hover:text-[var(--green)] transition-colors">{product.name}</h3>
                    <span className="inline-block px-2 py-0.5 bg-[var(--panel2)] border border-[var(--border)] text-[var(--muted)] text-[10px] rounded mt-1.5 font-semibold uppercase">{product.category}</span>
                  </div>
                  {getRatingBadge(product.sustainabilityRating)}
                </div>

                {/* Footprint & recyclability */}
                <div className="space-y-3.5 my-4 pt-4 border-t border-[var(--border)]">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[var(--muted)]">Carbon Footprint:</span>
                    <span className="font-semibold text-[var(--text)]">{product.carbonFootprintPerUnit.toFixed(2)} kg CO₂</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-[var(--muted)]">Recyclability:</span>
                      <span className="text-[var(--green)]">{product.recyclablePercent}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                      <div className="h-full bg-[var(--green)] rounded-full transition-all duration-500" style={{ width: `${product.recyclablePercent}%` }} />
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {product.notes && (
                  <p className="text-xs text-[var(--muted)] italic mt-4 bg-[var(--panel2)] p-2 rounded-lg border border-[var(--border)]">
                    {product.notes}
                  </p>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 justify-end border-t border-[var(--border)] mt-5 pt-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleOpenEdit(product)}
                  className="text-[var(--orange)] border-[var(--orange)]/30 hover:bg-[var(--orange)]/10 hover:text-[var(--orange)] w-full flex items-center justify-center gap-1.5"
                >
                  <Edit size={14} /> Edit
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleOpenDelete(product.id)}
                  className="text-[var(--red)] border-[var(--red)]/30 hover:bg-[var(--red)]/10 hover:text-[var(--red)] w-full flex items-center justify-center gap-1.5"
                >
                  <Trash2 size={14} /> Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Create Product Profile' : 'Edit Product Profile'}
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
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <Input
                id="name"
                label="Product Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. EcoBox Carton"
                error={formErrors.name}
                required
              />
            </div>
            <div>
              <Input
                id="sku"
                label="SKU"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="e.g. BOX-EC"
                error={formErrors.sku}
                required
                disabled={modalMode === 'edit'}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              id="category"
              label="Category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="e.g. Packaging, Electronics"
              error={formErrors.category}
              required
            />

            <Select
              id="sustainabilityRating"
              label="Sustainability Rating"
              value={formData.sustainabilityRating}
              onChange={(e) => setFormData({ ...formData, sustainabilityRating: e.target.value })}
            >
              <option value="A">A (Most Sustainable)</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
              <option value="E">E (Least Sustainable)</option>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              id="carbonFootprintPerUnit"
              label="Carbon Footprint per Unit (kg)"
              type="number"
              step="any"
              value={formData.carbonFootprintPerUnit}
              onChange={(e) => setFormData({ ...formData, carbonFootprintPerUnit: e.target.value })}
              placeholder="e.g. 4.5"
              error={formErrors.carbonFootprintPerUnit}
              required
            />

            <Input
              id="recyclablePercent"
              label="Recyclable Percent (%)"
              type="number"
              value={formData.recyclablePercent}
              onChange={(e) => setFormData({ ...formData, recyclablePercent: e.target.value })}
              placeholder="e.g. 100"
              error={formErrors.recyclablePercent}
              required
            />
          </div>

          <Textarea
            id="notes"
            label="Notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Additional details regarding materials, lifecycle, or disposal instructions..."
            rows={3}
          />
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
          Are you sure you want to delete this product profile? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
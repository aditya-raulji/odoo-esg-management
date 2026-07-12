'use client';
import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import DataTable from '@/components/ui/DataTable';
import StatusPill from '@/components/ui/StatusPill';

export default function ProductESGProfilesPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/environmental/product-esg-profiles')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      });
  }, []);

  const columns = [
    { key: 'sku', label: 'SKU' },
    { key: 'name', label: 'Product Name' },
    { key: 'category', label: 'Category' },
    { key: 'carbonFootprintPerUnit', label: 'Carbon Footprint/Unit (kg)' },
    { key: 'recyclablePercent', label: 'Recyclable %', render: (val) => `${val}%` },
    { key: 'sustainabilityRating', label: 'Rating', render: (val) => <StatusPill status={val === 'A' || val === 'B' ? 'approved' : val === 'C' || val === 'D' ? 'medium' : 'open'} /> }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Product ESG Profiles</h1>
        <p className="text-sm text-[var(--muted)]">Carbon footprint and recyclability metrics for products.</p>
      </div>
      <Card>
        <DataTable columns={columns} data={data} loading={loading} />
      </Card>
    </div>
  );
}
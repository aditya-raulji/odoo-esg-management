'use client';
import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import DataTable from '@/components/ui/DataTable';
import StatusPill from '@/components/ui/StatusPill';
import { formatDate } from '@/lib/utils';

export default function PoliciesPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/governance/policies')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      });
  }, []);

  const columns = [
    { key: 'title', label: 'Policy Title' },
    { key: 'version', label: 'Version' },
    { key: 'effectiveDate', label: 'Effective Date', render: (val) => formatDate(val) },
    { key: 'status', label: 'Status', render: (val) => <StatusPill status={val} /> }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">ESG Policies</h1>
        <p className="text-sm text-[var(--muted)]">Active compliance policy registers.</p>
      </div>
      <Card>
        <DataTable columns={columns} data={data} loading={loading} />
      </Card>
    </div>
  );
}
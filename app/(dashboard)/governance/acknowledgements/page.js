'use client';
import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import DataTable from '@/components/ui/DataTable';
import { formatDate } from '@/lib/utils';

export default function AcknowledgementsPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/governance/acknowledgements')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      });
  }, []);

  const columns = [
    { key: 'user', label: 'Employee', render: (val) => val?.name },
    { key: 'policy', label: 'Policy Acknowledged', render: (val) => val?.title },
    { key: 'acknowledgedAt', label: 'Acknowledged Date', render: (val) => formatDate(val) }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Policy Acknowledgements</h1>
        <p className="text-sm text-[var(--muted)]">Track employee acknowledgements of ESG policies.</p>
      </div>
      <Card>
        <DataTable columns={columns} data={data} loading={loading} />
      </Card>
    </div>
  );
}
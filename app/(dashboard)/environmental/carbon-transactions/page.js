'use client';
import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import DataTable from '@/components/ui/DataTable';
import StatusPill from '@/components/ui/StatusPill';
import { formatDate } from '@/lib/utils';

export default function CarbonTransactionsPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/environmental/carbon-transactions')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      });
  }, []);

  const columns = [
    { key: 'date', label: 'Date', render: (val) => formatDate(val) },
    { key: 'department', label: 'Department', render: (val) => val?.name },
    { key: 'emissionFactor', label: 'Factor', render: (val) => val?.name },
    { key: 'quantity', label: 'Quantity' },
    { key: 'co2Amount', label: 'CO₂ Amount (kg)' },
    { key: 'source', label: 'Source', render: (val) => <StatusPill status={val === 'AUTO' ? 'active' : 'pending'} /> }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Carbon Transactions</h1>
        <p className="text-sm text-[var(--muted)]">All auto and manual carbon transaction entries.</p>
      </div>
      <Card>
        <DataTable columns={columns} data={data} loading={loading} />
      </Card>
    </div>
  );
}
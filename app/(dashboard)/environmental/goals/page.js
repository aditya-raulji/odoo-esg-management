'use client';
import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import DataTable from '@/components/ui/DataTable';
import StatusPill from '@/components/ui/StatusPill';
import ProgressBar from '@/components/ui/ProgressBar';
import { formatDate } from '@/lib/utils';

export default function EnvironmentalGoalsPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/environmental/goals')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      });
  }, []);

  const columns = [
    { key: 'name', label: 'Goal' },
    { key: 'department', label: 'Department', render: (val) => val?.name },
    { key: 'progress', label: 'Progress', render: (_, row) => <ProgressBar value={row.currentCO2} max={row.targetCO2} /> },
    { key: 'deadline', label: 'Deadline', render: (val) => formatDate(val) },
    { key: 'status', label: 'Status', render: (val) => <StatusPill status={val} /> }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Environmental Goals</h1>
        <p className="text-sm text-[var(--muted)]">Environmental target indicators.</p>
      </div>
      <Card>
        <DataTable columns={columns} data={data} loading={loading} />
      </Card>
    </div>
  );
}
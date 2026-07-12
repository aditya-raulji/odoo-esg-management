'use client';
import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import DataTable from '@/components/ui/DataTable';
import StatusPill from '@/components/ui/StatusPill';
import { formatDate } from '@/lib/utils';

export default function CSRActivitiesPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/social/csr-activities')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      });
  }, []);

  const columns = [
    { key: 'title', label: 'CSR Activity' },
    { key: 'category', label: 'Category', render: (val) => val?.name },
    { key: 'date', label: 'Date', render: (val) => formatDate(val) },
    { key: 'pointsReward', label: 'Points Reward' },
    { key: 'joinedCount', label: 'Joined Count' },
    { key: 'status', label: 'Status', render: (val) => <StatusPill status={val} /> }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">CSR Activities</h1>
        <p className="text-sm text-[var(--muted)]">Corporate Social Responsibility activities.</p>
      </div>
      <Card>
        <DataTable columns={columns} data={data} loading={loading} />
      </Card>
    </div>
  );
}
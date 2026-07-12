'use client';
import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import DataTable from '@/components/ui/DataTable';

export default function BadgesPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/gamification/badges')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      });
  }, []);

  const columns = [
    { key: 'icon', label: 'Icon', width: '60px' },
    { key: 'name', label: 'Badge Name' },
    { key: 'description', label: 'Description' },
    { key: 'unlockRuleType', label: 'Rule Type' },
    { key: 'unlockValue', label: 'Threshold Value' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">System Badges</h1>
        <p className="text-sm text-[var(--muted)]">Eco-achievements and reward rules.</p>
      </div>
      <Card>
        <DataTable columns={columns} data={data} loading={loading} />
      </Card>
    </div>
  );
}
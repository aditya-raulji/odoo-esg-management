'use client';
import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import DataTable from '@/components/ui/DataTable';
import StatusPill from '@/components/ui/StatusPill';
import { formatDate } from '@/lib/utils';

export default function ChallengesPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/gamification/challenges')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      });
  }, []);

  const columns = [
    { key: 'title', label: 'Challenge' },
    { key: 'category', label: 'Category', render: (val) => val?.name },
    { key: 'xp', label: 'XP Reward' },
    { key: 'difficulty', label: 'Difficulty', render: (val) => <StatusPill status={val} /> },
    { key: 'deadline', label: 'Deadline', render: (val) => formatDate(val) },
    { key: 'status', label: 'Status', render: (val) => <StatusPill status={val} /> }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Challenges</h1>
        <p className="text-sm text-[var(--muted)]">Sustainability and eco-challenges.</p>
      </div>
      <Card>
        <DataTable columns={columns} data={data} loading={loading} />
      </Card>
    </div>
  );
}
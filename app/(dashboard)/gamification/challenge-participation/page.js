'use client';
import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import DataTable from '@/components/ui/DataTable';
import StatusPill from '@/components/ui/StatusPill';

export default function ChallengeParticipationPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/gamification/challenge-participation')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      });
  }, []);

  const columns = [
    { key: 'user', label: 'Employee', render: (val) => val?.name },
    { key: 'challenge', label: 'Challenge', render: (val) => val?.title },
    { key: 'progress', label: 'Progress', render: (val) => `${val}%` },
    { key: 'xpAwarded', label: 'XP Awarded' },
    { key: 'approvalStatus', label: 'Status', render: (val) => <StatusPill status={val} /> }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Challenge Participation</h1>
        <p className="text-sm text-[var(--muted)]">Track employee progress on active challenges.</p>
      </div>
      <Card>
        <DataTable columns={columns} data={data} loading={loading} />
      </Card>
    </div>
  );
}
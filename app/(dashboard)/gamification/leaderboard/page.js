'use client';
import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import DataTable from '@/components/ui/DataTable';

export default function LeaderboardPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/gamification/leaderboard')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      });
  }, []);

  const columns = [
    { key: 'rank', label: 'Rank', width: '60px' },
    { key: 'name', label: 'Name / Department' },
    { key: 'type', label: 'Type' },
    { key: 'xp', label: 'Total XP' },
    { key: 'points', label: 'Total Points' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Leaderboard</h1>
        <p className="text-sm text-[var(--muted)]">Top eco-friendly departments and users.</p>
      </div>
      <Card>
        <DataTable columns={columns} data={data} loading={loading} />
      </Card>
    </div>
  );
}
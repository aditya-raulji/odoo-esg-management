'use client';
import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import DataTable from '@/components/ui/DataTable';
import { formatDate } from '@/lib/utils';

export default function NotificationsPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/notifications')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      });
  }, []);

  const columns = [
    { key: 'createdAt', label: 'Time', render: (val) => formatDate(val) },
    { key: 'type', label: 'Type' },
    { key: 'title', label: 'Notification' },
    { key: 'message', label: 'Message' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Notifications</h1>
        <p className="text-sm text-[var(--muted)]">Updates from the platform.</p>
      </div>
      <Card>
        <DataTable columns={columns} data={data} loading={loading} />
      </Card>
    </div>
  );
}
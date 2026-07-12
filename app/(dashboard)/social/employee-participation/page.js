'use client';
import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import DataTable from '@/components/ui/DataTable';
import StatusPill from '@/components/ui/StatusPill';
import { formatDate } from '@/lib/utils';

export default function EmployeeParticipationPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/social/employee-participation')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      });
  }, []);

  const columns = [
    { key: 'user', label: 'Employee', render: (val) => val?.name },
    { key: 'activity', label: 'CSR Activity', render: (val) => val?.title },
    { key: 'completionDate', label: 'Completion Date', render: (val) => formatDate(val) },
    { key: 'pointsEarned', label: 'Points Earned' },
    { key: 'approvalStatus', label: 'Approval Status', render: (val) => <StatusPill status={val} /> }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Employee CSR Participation</h1>
        <p className="text-sm text-[var(--muted)]">Participation records for social activities.</p>
      </div>
      <Card>
        <DataTable columns={columns} data={data} loading={loading} />
      </Card>
    </div>
  );
}
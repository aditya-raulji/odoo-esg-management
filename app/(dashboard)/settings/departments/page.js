'use client';
import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import DataTable from '@/components/ui/DataTable';
import StatusPill from '@/components/ui/StatusPill';

export default function DepartmentsPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/settings/departments')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      });
  }, []);

  const columns = [
    { key: 'code', label: 'Code' },
    { key: 'name', label: 'Department Name' },
    { key: 'head', label: 'Head of Department' },
    { key: 'employeeCount', label: 'Headcount' },
    { key: 'status', label: 'Status', render: (val) => <StatusPill status={val} /> }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Departments</h1>
        <p className="text-sm text-[var(--muted)]">Manage business departments.</p>
      </div>
      <Card>
        <DataTable columns={columns} data={data} loading={loading} />
      </Card>
    </div>
  );
}
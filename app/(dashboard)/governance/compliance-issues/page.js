'use client';
import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import DataTable from '@/components/ui/DataTable';
import StatusPill from '@/components/ui/StatusPill';
import { formatDate } from '@/lib/utils';

export default function ComplianceIssuesPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/governance/compliance-issues')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      });
  }, []);

  const columns = [
    { key: 'title', label: 'Issue Title' },
    { key: 'severity', label: 'Severity', render: (val) => <StatusPill status={val} /> },
    { key: 'department', label: 'Department', render: (val) => val?.name },
    { key: 'owner', label: 'Owner', render: (val) => val?.name },
    { key: 'dueDate', label: 'Due Date', render: (val) => formatDate(val) },
    { key: 'status', label: 'Status', render: (val) => <StatusPill status={val} /> }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Compliance Issues</h1>
        <p className="text-sm text-[var(--muted)]">List of compliance and hazard issues.</p>
      </div>
      <Card>
        <DataTable columns={columns} data={data} loading={loading} />
      </Card>
    </div>
  );
}
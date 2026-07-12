'use client';
import { useState, useEffect } from 'react';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';
import DataTable from '@/components/ui/DataTable';
import StatusPill from '@/components/ui/StatusPill';

export default function EmissionFactorsPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/environmental/emission-factors')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      });
  }, []);

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'sourceType', label: 'Source Type' },
    { key: 'unit', label: 'Unit' },
    { key: 'co2PerUnit', label: 'CO₂ Per Unit (kg)' },
    { key: 'status', label: 'Status', render: (val) => <StatusPill status={val} /> }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Emission Factors</h1>
        <p className="text-sm text-[var(--muted)]">Emission factors for carbon calculations.</p>
      </div>
      <Card>
        <DataTable columns={columns} data={data} loading={loading} />
      </Card>
    </div>
  );
}
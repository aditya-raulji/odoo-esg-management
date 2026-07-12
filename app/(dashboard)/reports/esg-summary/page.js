'use client';
import { useState, useEffect } from 'react';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export default function ESGSummaryPage() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch('/api/reports/esg-summary')
      .then(res => res.json())
      .then(setData);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">ESG Summary Report</h1>
        <p className="text-sm text-[var(--muted)]">Overall ESG performance indicators across all departments.</p>
      </div>
      <Card padding={false}>
        <CardHeader className="p-5 pb-0">
          <CardTitle>Department Score Breakdown</CardTitle>
        </CardHeader>
        <div className="h-80 p-5">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="departmentName" tick={{ fill: 'var(--muted)' }} />
              <YAxis tick={{ fill: 'var(--muted)' }} domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Bar dataKey="env" fill="var(--green)" name="Environmental" radius={[4, 4, 0, 0]} />
              <Bar dataKey="social" fill="var(--blue)" name="Social" radius={[4, 4, 0, 0]} />
              <Bar dataKey="gov" fill="var(--purple)" name="Governance" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
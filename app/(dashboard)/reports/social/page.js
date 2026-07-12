'use client';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';

export default function SocialReportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Social Report</h1>
        <p className="text-sm text-[var(--muted)]">Corporate social responsibility and employee metric summaries.</p>
      </div>
      <Card>
        <p className="text-sm text-[var(--text)]">CSR project attendance: <strong>125 employees</strong> across 4 drives.</p>
      </Card>
    </div>
  );
}
'use client';
import Card from '@/components/ui/Card';

export default function CustomReportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Custom Report Builder</h1>
        <p className="text-sm text-[var(--muted)]">Export audit and transaction metrics to XLSX / PDF.</p>
      </div>
      <Card>
        <p className="text-sm text-[var(--muted)]">Select target columns and date ranges to compile custom reports.</p>
      </Card>
    </div>
  );
}
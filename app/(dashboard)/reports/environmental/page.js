'use client';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';

export default function EnvironmentalReportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Environmental Report</h1>
        <p className="text-sm text-[var(--muted)]">Annualized Greenhouse Gas (GHG) reporting and offsets.</p>
      </div>
      <Card>
        <p className="text-sm text-[var(--text)]">Total GHG emissions for period 2026: <strong>148.5 t CO₂</strong>.</p>
        <p className="text-sm text-[var(--muted)] mt-2">No other report records logged in this period.</p>
      </Card>
    </div>
  );
}
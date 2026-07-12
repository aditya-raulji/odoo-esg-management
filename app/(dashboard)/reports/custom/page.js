'use client';

import CustomReportBuilder from './CustomReportBuilder';

export default function CustomReportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-[var(--text)] font-space-grotesk">Custom Report Builder</h1>
        <p className="text-sm text-[var(--muted)]">
          Export audit, challenge and carbon transaction metrics to PDF, Excel, and CSV.
        </p>
      </div>
      <CustomReportBuilder />
    </div>
  );
}
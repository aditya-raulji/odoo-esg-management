'use client';
import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Toggle from '@/components/ui/Toggle';

export default function ESGConfigPage() {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    fetch('/api/settings/esg-config')
      .then(res => res.json())
      .then(setConfig);
  }, []);

  if (!config) return <div className="text-sm text-[var(--muted)]">Loading configuration...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">ESG Configuration</h1>
        <p className="text-sm text-[var(--muted)]">Manage global configuration for carbon calculations and evidence reviews.</p>
      </div>
      <Card className="space-y-6">
        <Toggle id="autoCalc" label="Automatic Emission Calculations" checked={config.autoEmissionCalc} onChange={() => {}} disabled />
        <Toggle id="evidence" label="Evidence Proof Required for Rewards" checked={config.evidenceRequired} onChange={() => {}} disabled />
        <Toggle id="badges" label="Automatic Badge Awards" checked={config.badgeAutoAward} onChange={() => {}} disabled />
        <Toggle id="compliance" label="Email Alerts on Critical Compliance Issues" checked={config.emailAlertsCompliance} onChange={() => {}} disabled />
      </Card>
    </div>
  );
}
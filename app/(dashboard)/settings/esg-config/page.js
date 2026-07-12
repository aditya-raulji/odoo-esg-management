'use client';

import { useState, useEffect } from 'react';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';
import Toggle from '@/components/ui/Toggle';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { Settings, Save, ShieldAlert } from 'lucide-react';

export default function ESGConfigPage() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  // Form State
  const [autoEmissionCalc, setAutoEmissionCalc] = useState(true);
  const [evidenceRequired, setEvidenceRequired] = useState(true);
  const [badgeAutoAward, setBadgeAutoAward] = useState(true);
  const [emailAlertsCompliance, setEmailAlertsCompliance] = useState(true);
  const [weightEnv, setWeightEnv] = useState(40);
  const [weightSocial, setWeightSocial] = useState(30);
  const [weightGov, setWeightGov] = useState(30);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings/esg-config');
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
        if (data) {
          setAutoEmissionCalc(data.autoEmissionCalc);
          setEvidenceRequired(data.evidenceRequired);
          setBadgeAutoAward(data.badgeAutoAward);
          setEmailAlertsCompliance(data.emailAlertsCompliance);
          setWeightEnv(data.weightEnv);
          setWeightSocial(data.weightSocial);
          setWeightGov(data.weightGov);
        }
      } else {
        toast.error('Failed to load configuration');
      }
    } catch (err) {
      toast.error('Network error loading configuration');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const totalWeights = (parseInt(weightEnv) || 0) + (parseInt(weightSocial) || 0) + (parseInt(weightGov) || 0);
  const isWeightSumValid = totalWeights === 100;

  const handleSave = async (e) => {
    e.preventDefault();

    if (!isWeightSumValid) {
      toast.error('Invalid Weights', `The weights must sum to exactly 100. Current sum: ${totalWeights}`);
      return;
    }

    setSaving(true);
    const payload = {
      autoEmissionCalc,
      evidenceRequired,
      badgeAutoAward,
      emailAlertsCompliance,
      weightEnv: parseInt(weightEnv),
      weightSocial: parseInt(weightSocial),
      weightGov: parseInt(weightGov),
    };

    try {
      const res = await fetch('/api/settings/esg-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();

      if (res.ok) {
        toast.success('Settings Saved', 'ESG Configuration successfully updated.');
        fetchConfig();
      } else {
        toast.error('Failed to Save', result.error || 'Server validation error.');
      }
    } catch (err) {
      toast.error('Save Error', 'An error occurred during submission.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-[var(--muted)] animate-pulse">Loading ESG configuration settings...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">ESG Configuration</h1>
        <p className="text-sm text-[var(--muted)]">Manage global configuration for carbon calculations, evidence reviews, and module triggers.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Business Rule Toggles */}
        <Card className="space-y-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings size={18} className="text-[var(--blue)]" /> Business Rule Flags
            </CardTitle>
          </CardHeader>

          <div className="space-y-4 pt-2">
            <div className="flex flex-col gap-1">
              <Toggle
                id="autoCalc"
                label="Enable automatic emission calculation"
                checked={autoEmissionCalc}
                onChange={(e) => setAutoEmissionCalc(e.target.checked)}
              />
              <p className="text-xs text-[var(--muted)] pl-14">
                Automates emission calculations on manufacturing and fleet operation records using matching factors.
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <Toggle
                id="evidence"
                label="Require evidence for all CSR activities"
                checked={evidenceRequired}
                onChange={(e) => setEvidenceRequired(e.target.checked)}
              />
              <p className="text-xs text-[var(--muted)] pl-14">
                CSR activity participations require manual approval and proof files before rewards points are unlocked.
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <Toggle
                id="badges"
                label="Auto-award badges on challenge completion"
                checked={badgeAutoAward}
                onChange={(e) => setBadgeAutoAward(e.target.checked)}
              />
              <p className="text-xs text-[var(--muted)] pl-14">
                Automatically awards Green Beginner and Carbon Saver badges when target rules are satisfied.
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <Toggle
                id="compliance"
                label="Email alerts for new compliance issues"
                checked={emailAlertsCompliance}
                onChange={(e) => setEmailAlertsCompliance(e.target.checked)}
              />
              <p className="text-xs text-[var(--muted)] pl-14">
                Sends a high-severity critical alert notification to administrators whenever audits detect compliance issues.
              </p>
            </div>
          </div>
        </Card>

        {/* Score Weights Card */}
        <Card className="space-y-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert size={18} className="text-[var(--green)]" /> ESG Score Weights
            </CardTitle>
          </CardHeader>

          <div className="space-y-4 pt-2">
            <p className="text-sm text-[var(--muted)]">
              Specify the relative weight percentages for overall ESG score calculation (must sum to exactly 100%).
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                id="weight-env"
                label="Environmental Weight (%) *"
                type="number"
                value={weightEnv}
                onChange={(e) => setWeightEnv(e.target.value)}
                min="0"
                max="100"
                required
              />

              <Input
                id="weight-social"
                label="Social Weight (%) *"
                type="number"
                value={weightSocial}
                onChange={(e) => setWeightSocial(e.target.value)}
                min="0"
                max="100"
                required
              />

              <Input
                id="weight-gov"
                label="Governance Weight (%) *"
                type="number"
                value={weightGov}
                onChange={(e) => setWeightGov(e.target.value)}
                min="0"
                max="100"
                required
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-[var(--panel2)] border border-[var(--border)] rounded-xl mt-4">
              <span className="text-sm font-semibold text-[var(--text)]">Live Weight Total:</span>
              <span className={`text-lg font-bold ${isWeightSumValid ? 'text-[var(--green)]' : 'text-[var(--red)]'}`}>
                {totalWeights}% {isWeightSumValid ? '(Valid)' : `(Must total 100%)`}
              </span>
            </div>
          </div>
        </Card>

        {/* Save button */}
        <div className="flex justify-end">
          <Button variant="green" type="submit" loading={saving} disabled={!isWeightSumValid}>
            <Save size={16} className="mr-2" /> Save Configuration
          </Button>
        </div>
      </form>
    </div>
  );
}
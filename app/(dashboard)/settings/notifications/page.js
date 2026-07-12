'use client';

import { useState, useEffect } from 'react';
import Card, { CardHeader, CardTitle } from '@/components/ui/Card';
import Toggle from '@/components/ui/Toggle';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { Bell, Save } from 'lucide-react';

export default function NotificationSettingsPage() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  // Notification toggles state
  const [notifyApprovals, setNotifyApprovals] = useState(true);
  const [notifyPolicyReminders, setNotifyPolicyReminders] = useState(true);
  const [notifyBadgeUnlocks, setNotifyBadgeUnlocks] = useState(true);
  const [emailAlertsCompliance, setEmailAlertsCompliance] = useState(true);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings/esg-config');
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
        if (data) {
          setNotifyApprovals(data.notifyApprovals);
          setNotifyPolicyReminders(data.notifyPolicyReminders);
          setNotifyBadgeUnlocks(data.notifyBadgeUnlocks);
          setEmailAlertsCompliance(data.emailAlertsCompliance);
        }
      } else {
        toast.error('Failed to load notification settings');
      }
    } catch (err) {
      toast.error('Network error loading settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      notifyApprovals,
      notifyPolicyReminders,
      notifyBadgeUnlocks,
      emailAlertsCompliance
    };

    try {
      const res = await fetch('/api/settings/esg-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await res.json();

      if (res.ok) {
        toast.success('Settings Saved', 'Notification preferences successfully updated.');
        fetchConfig();
      } else {
        toast.error('Failed to Save', result.error || 'Server error occurred.');
      }
    } catch (err) {
      toast.error('Save Error', 'An error occurred during submission.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-[var(--muted)] animate-pulse">Loading notification settings...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Notification Settings</h1>
        <p className="text-sm text-[var(--muted)]">Configure how and when notifications are triggered for compliance and approvals.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="space-y-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell size={18} className="text-[var(--purple)]" /> Notification Preferences
            </CardTitle>
          </CardHeader>

          <div className="space-y-6 pt-2">
            <div className="flex flex-col gap-1 border-b border-[var(--border)] pb-4">
              <Toggle
                id="notif-approvals"
                label="Notify me about pending approvals"
                checked={notifyApprovals}
                onChange={(e) => setNotifyApprovals(e.target.checked)}
              />
              <p className="text-xs text-[var(--muted)] pl-14">
                Triggers dashboard notifications when employee CSR participation or challenges submission requires manager verification.
              </p>
            </div>

            <div className="flex flex-col gap-1 border-b border-[var(--border)] pb-4">
              <Toggle
                id="notif-policies"
                label="Policy acknowledgement reminders"
                checked={notifyPolicyReminders}
                onChange={(e) => setNotifyPolicyReminders(e.target.checked)}
              />
              <p className="text-xs text-[var(--muted)] pl-14">
                Enables alerts prompting employees to read and acknowledge newly released ESG policies.
              </p>
            </div>

            <div className="flex flex-col gap-1 border-b border-[var(--border)] pb-4">
              <Toggle
                id="notif-badges"
                label="Badge unlocked events notifications"
                checked={notifyBadgeUnlocks}
                onChange={(e) => setNotifyBadgeUnlocks(e.target.checked)}
              />
              <p className="text-xs text-[var(--muted)] pl-14">
                Alerts employees and logs dashboard feed events when new badges (e.g. Carbon Saver) are unlocked.
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <Toggle
                id="notif-compliance"
                label="Email alerts for new compliance issues"
                checked={emailAlertsCompliance}
                onChange={(e) => setEmailAlertsCompliance(e.target.checked)}
              />
              <p className="text-xs text-[var(--muted)] pl-14 font-medium text-[var(--orange)]">
                [Shared Flag] Triggers urgent email warnings and flags high-priority compliance violations.
              </p>
            </div>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button variant="green" type="submit" loading={saving}>
            <Save size={16} className="mr-2" /> Save Notification Settings
          </Button>
        </div>
      </form>
    </div>
  );
}

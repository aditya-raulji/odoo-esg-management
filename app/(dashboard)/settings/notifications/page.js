'use client';
import Card from '@/components/ui/Card';
import Toggle from '@/components/ui/Toggle';

export default function NotificationSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]">Notification Settings</h1>
        <p className="text-sm text-[var(--muted)]">Adjust push and dashboard notifications settings.</p>
      </div>
      <Card className="space-y-6">
        <Toggle id="notif-approvals" label="Notify me about pending approvals" checked={true} onChange={() => {}} />
        <Toggle id="notif-policies" label="Policy acknowledgement reminders" checked={true} onChange={() => {}} />
        <Toggle id="notif-badges" label="Badge unlocked events notifications" checked={true} onChange={() => {}} />
      </Card>
    </div>
  );
}
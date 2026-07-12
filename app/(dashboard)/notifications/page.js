'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import DataTable from '@/components/ui/DataTable';
import StatusPill from '@/components/ui/StatusPill';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { formatDate } from '@/lib/utils';
import { Bell, CheckSquare, HeartHandshake, Zap, Medal, BookOpen, AlertTriangle, MessageSquare } from 'lucide-react';

function getNotifIcon(type) {
  switch (type) {
    case 'CSR':
      return <HeartHandshake size={15} className="text-[var(--blue)]" />;
    case 'CHALLENGE':
      return <Zap size={15} className="text-[var(--orange)]" />;
    case 'BADGE':
      return <Medal size={15} className="text-[var(--green)]" />;
    case 'POLICY':
      return <BookOpen size={15} className="text-[var(--purple)]" />;
    case 'COMPLIANCE':
      return <AlertTriangle size={15} className="text-[var(--red)]" />;
    default:
      return <MessageSquare size={15} className="text-[var(--muted)]" />;
  }
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      } else {
        toast.error('Failed to load notifications');
      }
    } catch (err) {
      toast.error('Network error loading notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch('/api/notifications', { method: 'POST' });
      if (res.ok) {
        toast.success('Success', 'All notifications marked as read.');
        fetchNotifications();
      } else {
        toast.error('Error', 'Failed to mark all as read.');
      }
    } catch (err) {
      toast.error('Error', 'Could not complete the request.');
    }
  };

  const handleMarkOneRead = async (id) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const columns = [
    {
      key: 'type',
      label: 'Type',
      width: '100px',
      render: (val) => (
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-[var(--panel2)] border border-[var(--border)]">
            {getNotifIcon(val)}
          </div>
          <span className="text-xs font-semibold uppercase">{val}</span>
        </div>
      )
    },
    {
      key: 'title',
      label: 'Notification',
      render: (val, row) => (
        <span className={row.read ? 'text-[var(--muted)]' : 'font-semibold text-[var(--blue)]'}>
          {val}
        </span>
      )
    },
    {
      key: 'message',
      label: 'Message',
      render: (val, row) => (
        <span className={row.read ? 'text-[var(--muted)]' : 'text-[var(--text)]'}>
          {val}
        </span>
      )
    },
    {
      key: 'createdAt',
      label: 'Date & Time',
      width: '180px',
      render: (val) => formatDate(val, { hour: '2-digit', minute: '2-digit' })
    },
    {
      key: 'status',
      label: 'Read Status',
      width: '120px',
      render: (_, row) => <StatusPill status={row.read ? 'resolved' : 'pending'} />
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '100px',
      render: (_, row) => (
        !row.read && (
          <Button variant="ghost" size="xs" onClick={() => handleMarkOneRead(row.id)}>
            Mark Read
          </Button>
        )
      )
    }
  ];

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Notifications Hub</h1>
          <p className="text-sm text-[var(--muted)]">View and manage all system and activity updates sent to you.</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" onClick={handleMarkAllRead} className="bg-white text-black hover:bg-neutral-200 border-none">
            <CheckSquare size={16} className="mr-2" /> Mark All Read
          </Button>
        )}
      </div>

      {/* Notifications Table */}
      <Card>
        <DataTable columns={columns} data={notifications} loading={loading} />
      </Card>
    </div>
  );
}
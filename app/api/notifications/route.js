import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET own notifications (newest first)
export async function GET(req) {
  const { error, session } = await requireAuth(req);
  if (error) return error;

  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(notifications);
  } catch (err) {
    console.error('Error fetching notifications:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH mark one notification as read
export async function PATCH(req) {
  const { error, session } = await requireAuth(req);
  if (error) return error;

  try {
    const body = await req.json();
    const { id } = body;

    if (!id || typeof id !== 'number') {
      return NextResponse.json({ error: 'Valid notification ID is required' }, { status: 400 });
    }

    // Verify ownership
    const notif = await prisma.notification.findUnique({
      where: { id }
    });

    if (!notif) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    if (notif.userId !== session.id) {
      return NextResponse.json({ error: 'Unauthorized operation' }, { status: 403 });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { read: true }
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error('Error marking notification read:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST mark all notifications as read for the current user
export async function POST(req) {
  const { error, session } = await requireAuth(req);
  if (error) return error;

  try {
    const result = await prisma.notification.updateMany({
      where: { userId: session.id, read: false },
      data: { read: true }
    });

    return NextResponse.json({ success: true, count: result.count });
  } catch (err) {
    console.error('Error marking all notifications read:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
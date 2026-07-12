// app/api/auth/logout/route.js
// POST /api/auth/logout — clear the session cookie

import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth';

export async function POST() {
  const response = NextResponse.json({ success: true });
  return clearSessionCookie(response);
}

export async function GET() {
  const response = NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'));
  return clearSessionCookie(response);
}

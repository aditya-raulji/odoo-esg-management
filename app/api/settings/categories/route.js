import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

// GET all categories (Admin only)
export async function GET(req) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(categories);
  } catch (err) {
    console.error('Error fetching categories:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST create category (Admin only)
export async function POST(req) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  try {
    const body = await req.json();
    const { name, type, status } = body;

    // Server-side validation
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    if (!type || (type !== 'CSR_ACTIVITY' && type !== 'CHALLENGE')) {
      return NextResponse.json({ error: 'Type must be CSR_ACTIVITY or CHALLENGE' }, { status: 400 });
    }

    const newCategory = await prisma.category.create({
      data: {
        name: name.trim(),
        type,
        status: status || 'Active'
      }
    });

    return NextResponse.json(newCategory);
  } catch (err) {
    console.error('Error creating category:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
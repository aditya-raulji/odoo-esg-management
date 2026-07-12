import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

// GET all departments (Admin only)
export async function GET(req) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  try {
    const departments = await prisma.department.findMany({
      include: {
        parent: { select: { name: true } }
      },
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(departments);
  } catch (err) {
    console.error('Error fetching departments:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST create department (Admin only)
export async function POST(req) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  try {
    const body = await req.json();
    const { name, code, head, parentId, employeeCount, status } = body;

    // Server-side validation
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    if (!code || typeof code !== 'string' || code.trim() === '') {
      return NextResponse.json({ error: 'Unique Code is required' }, { status: 400 });
    }
    if (!head || typeof head !== 'string' || head.trim() === '') {
      return NextResponse.json({ error: 'Head of department is required' }, { status: 400 });
    }
    
    // Check code uniqueness
    const existing = await prisma.department.findUnique({
      where: { code: code.toUpperCase().trim() }
    });
    if (existing) {
      return NextResponse.json({ error: 'Department code must be unique' }, { status: 400 });
    }

    const newDept = await prisma.department.create({
      data: {
        name: name.trim(),
        code: code.toUpperCase().trim(),
        head: head.trim(),
        parentId: parentId ? parseInt(parentId) : null,
        employeeCount: employeeCount ? parseInt(employeeCount) : 0,
        status: status || 'Active'
      }
    });

    return NextResponse.json(newDept);
  } catch (err) {
    console.error('Error creating department:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
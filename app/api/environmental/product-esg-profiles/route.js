import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

const SAMPLE_PRODUCTS = [
  { name: 'Steel Frame X1', sku: 'STL-X1', category: 'Raw Materials', carbonFootprintPerUnit: 145.2, recyclablePercent: 90, sustainabilityRating: 'A', notes: 'High-strength structural steel' },
  { name: 'EcoBox Carton', sku: 'BOX-EC', category: 'Packaging', carbonFootprintPerUnit: 4.5, recyclablePercent: 100, sustainabilityRating: 'A', notes: '100% biodegradable cardboard' },
  { name: 'AluCan 330ml', sku: 'CAN-AL330', category: 'Packaging', carbonFootprintPerUnit: 42.1, recyclablePercent: 95, sustainabilityRating: 'B', notes: 'Standard aluminum can' },
  { name: 'Cotton Tote', sku: 'TOT-COT', category: 'Apparel', carbonFootprintPerUnit: 12.5, recyclablePercent: 80, sustainabilityRating: 'B', notes: 'Organic cotton tote bag' },
  { name: 'LED Panel P4', sku: 'LED-P4', category: 'Electronics', carbonFootprintPerUnit: 180.0, recyclablePercent: 45, sustainabilityRating: 'C', notes: 'Energy efficient commercial lighting' },
  { name: 'Recycled Pallet', sku: 'PAL-REC', category: 'Logistics', carbonFootprintPerUnit: 15.0, recyclablePercent: 98, sustainabilityRating: 'A', notes: 'Made from 100% recycled plastics' }
];

export async function GET(req) {
  const { error } = await requireAuth(req);
  if (error) return error;

  try {
    let count = await prisma.productESGProfile.count();
    if (count === 0) {
      await prisma.productESGProfile.createMany({
        data: SAMPLE_PRODUCTS
      });
    }
    const data = await prisma.productESGProfile.findMany({
      orderBy: { id: 'desc' }
    });
    return NextResponse.json(data);
  } catch (err) {
    console.error('Error fetching product ESG profiles:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req) {
  const { error } = await requireAuth(req);
  if (error) return error;

  try {
    const body = await req.json();
    const { name, sku, category, carbonFootprintPerUnit, recyclablePercent, sustainabilityRating, notes } = body;

    // Validation
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json({ error: 'Product Name is required' }, { status: 400 });
    }
    if (!sku || typeof sku !== 'string' || sku.trim() === '') {
      return NextResponse.json({ error: 'SKU is required' }, { status: 400 });
    }
    if (!category || typeof category !== 'string' || category.trim() === '') {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 });
    }
    if (carbonFootprintPerUnit === undefined || carbonFootprintPerUnit === null || typeof carbonFootprintPerUnit !== 'number' || carbonFootprintPerUnit < 0) {
      return NextResponse.json({ error: 'Carbon Footprint must be a non-negative number' }, { status: 400 });
    }
    if (recyclablePercent === undefined || recyclablePercent === null || typeof recyclablePercent !== 'number' || recyclablePercent < 0 || recyclablePercent > 100) {
      return NextResponse.json({ error: 'Recyclable Percent must be an integer between 0 and 100' }, { status: 400 });
    }
    if (!sustainabilityRating || !['A', 'B', 'C', 'D', 'E'].includes(sustainabilityRating.toUpperCase())) {
      return NextResponse.json({ error: 'Sustainability Rating must be A, B, C, D, or E' }, { status: 400 });
    }

    // Check SKU uniqueness
    const cleanSku = sku.trim().toUpperCase();
    const existing = await prisma.productESGProfile.findUnique({
      where: { sku: cleanSku }
    });
    if (existing) {
      return NextResponse.json({ error: `SKU '${cleanSku}' already exists. Please choose a unique SKU.` }, { status: 400 });
    }

    const newProfile = await prisma.productESGProfile.create({
      data: {
        name: name.trim(),
        sku: cleanSku,
        category: category.trim(),
        carbonFootprintPerUnit: parseFloat(carbonFootprintPerUnit),
        recyclablePercent: parseInt(recyclablePercent),
        sustainabilityRating: sustainabilityRating.toUpperCase(),
        notes: notes ? notes.trim() : null
      }
    });

    await logActivity('CARBON', `Product ESG Profile created: ${newProfile.name}`);

    return NextResponse.json(newProfile, { status: 201 });
  } catch (err) {
    console.error('Error creating product profile:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
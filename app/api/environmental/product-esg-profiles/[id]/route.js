import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { logActivity } from '@/lib/activity';

export async function PUT(req, { params }) {
  const { error } = await requireAuth(req);
  if (error) return error;

  const { id } = params;
  const profileId = parseInt(id);

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

    // Check SKU uniqueness (if SKU has changed)
    const cleanSku = sku.trim().toUpperCase();
    const existing = await prisma.productESGProfile.findUnique({
      where: { sku: cleanSku }
    });
    if (existing && existing.id !== profileId) {
      return NextResponse.json({ error: `SKU '${cleanSku}' already exists on another product. Please choose a unique SKU.` }, { status: 400 });
    }

    const updatedProfile = await prisma.productESGProfile.update({
      where: { id: profileId },
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

    await logActivity('CARBON', `Product ESG Profile updated: ${updatedProfile.name}`);

    return NextResponse.json(updatedProfile);
  } catch (err) {
    console.error('Error updating product profile:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const { error } = await requireAuth(req);
  if (error) return error;

  const { id } = params;
  const profileId = parseInt(id);

  try {
    const deletedProfile = await prisma.productESGProfile.delete({
      where: { id: profileId }
    });

    await logActivity('CARBON', `Product ESG Profile deleted: ${deletedProfile.name}`);

    return NextResponse.json({ message: 'Product ESG Profile deleted successfully', deletedProfile });
  } catch (err) {
    console.error('Error deleting product profile:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

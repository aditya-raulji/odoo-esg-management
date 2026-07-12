import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(req) {
  const { error } = await requireAuth(req);
  if (error) return error;

  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate size (max 5 MB)
    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return NextResponse.json({ error: 'File size exceeds maximum limit of 5 MB' }, { status: 400 });
    }

    // Validate type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Only JPG, PNG, and PDF files are allowed' }, { status: 400 });
    }

    // Read bytes
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Determine extension
    let ext = '.bin';
    if (file.type === 'image/jpeg' || file.type === 'image/jpg') ext = '.jpg';
    else if (file.type === 'image/png') ext = '.png';
    else if (file.type === 'application/pdf') ext = '.pdf';

    // Unique filename
    const uniqueName = `proof_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;

    // Path
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    
    // Ensure dir exists
    await mkdir(uploadDir, { recursive: true });
    
    const filePath = join(uploadDir, uniqueName);
    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/${uniqueName}`;

    return NextResponse.json({ url: fileUrl, filename: file.name || uniqueName });
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: 'File upload failed' }, { status: 500 });
  }
}

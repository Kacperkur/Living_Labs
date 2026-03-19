import { NextResponse } from 'next/server';
import { getAdmin } from '../../../firebase-config';

const ACCEPTED_MIME_TYPES: Record<string, string> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'audio/mpeg': 'mp3',
  'audio/mp4': 'm4a',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-excel': 'xls',
};

const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB

/**
 * POST /api/upload-media
 * Accepts multipart/form-data with fields:
 *   - file: the file to upload
 *   - lab_id: the lab this file belongs to
 *
 * Returns: { url: string, path: string, name: string, size: number, type: string }
 */
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const labId = formData.get('lab_id') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    if (!labId) {
      return NextResponse.json({ error: 'lab_id is required' }, { status: 400 });
    }
    if (!ACCEPTED_MIME_TYPES[file.type]) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}. Accepted: PDF, JPG, PNG, MP4, MP3, DOCX, XLSX.` },
        { status: 415 }
      );
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: 'File exceeds 100 MB limit' }, { status: 413 });
    }

    const admin = await getAdmin();
    const bucket = admin.storage().bucket();

    // Build a clean storage path: labs/{labId}/{timestamp}_{sanitised_filename}
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `labs/${labId}/${timestamp}_${safeName}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const storageFile = bucket.file(storagePath);

    await storageFile.save(buffer, {
      contentType: file.type,
      metadata: {
        cacheControl: 'public, max-age=31536000',
        metadata: { labId, originalName: file.name },
      },
    });

    await storageFile.makePublic();

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

    console.log(`✅ upload-media: ${storagePath} (${(file.size / 1024).toFixed(1)} KB)`);
    return NextResponse.json({
      url: publicUrl,
      path: storagePath,
      name: file.name,
      size: file.size,
      type: file.type,
    });

  } catch (error) {
    console.error('❌ upload-media error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}

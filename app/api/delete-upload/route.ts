import { NextResponse } from 'next/server';
import { getAdmin } from '../../../firebase-config';

/**
 * Deletes a file from Firebase Storage by its storage path.
 *
 * Accepts two methods so it works both from in-app fetch() calls and
 * navigator.sendBeacon() (which only supports POST):
 *
 *   DELETE /api/delete-upload   body: { path: "labs/labId/timestamp_file.pdf" }
 *   POST   /api/delete-upload   body: { path: "labs/labId/timestamp_file.pdf" }
 */

async function deleteFile(path: string) {
  const admin = await getAdmin();
  const bucket = admin.storage().bucket();
  await bucket.file(path).delete();
  console.log(`🗑️ delete-upload: removed ${path}`);
}

async function handleRequest(req: Request): Promise<NextResponse> {
  try {
    const body = await req.json().catch(() => null);
    const path = body?.path;

    if (!path || typeof path !== 'string') {
      return NextResponse.json({ error: 'path is required' }, { status: 400 });
    }

    await deleteFile(path);
    return NextResponse.json({ deleted: path });

  } catch (error) {
    // If the file doesn't exist that's fine — treat as success
    const msg = error instanceof Error ? error.message : 'Delete failed';
    if (msg.includes('No such object')) {
      return NextResponse.json({ deleted: true, note: 'already gone' });
    }
    console.error('❌ delete-upload error:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export const DELETE = handleRequest;
export const POST = handleRequest;

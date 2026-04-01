import { NextResponse } from 'next/server';
import { db, storage } from '../../../lib/firebase-admin';
import { Pinecone } from '@pinecone-database/pinecone';

/**
 * DELETE /api/delete-media
 *
 * Removes a media record from:
 *   1. Firestore  — "media" collection doc
 *   2. Pinecone   — "livinglabsdemo" index, "media" namespace
 *   3. Firebase Storage — if content_url is a Storage URL (best-effort)
 *
 * Body (JSON): { id: string, content_url?: string }
 */
export async function DELETE(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const { id, content_url } = body ?? {};

    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const results: Record<string, string> = {};

    // 1. Delete from Firestore
    await db.collection('media').doc(id).delete();
    results.firestore = 'deleted';
    console.log(`🗑️ delete-media: Firestore doc ${id} deleted`);

    // 2. Delete from Pinecone
    try {
      const apiKey = process.env.PINECONE_API_KEY;
      if (apiKey) {
        const index = new Pinecone({ apiKey }).index('livinglabsdemo').namespace('media');
        await index.deleteOne(id);
        results.pinecone = 'deleted';
        console.log(`🗑️ delete-media: Pinecone record ${id} deleted`);
      } else {
        results.pinecone = 'skipped — no API key';
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Pinecone delete failed';
      results.pinecone = `warning: ${msg}`;
      console.warn(`⚠️ delete-media: Pinecone delete failed for ${id}:`, msg);
    }

    // 3. Best-effort Storage deletion — only for Firebase Storage URLs
    if (content_url && typeof content_url === 'string') {
      const storagePath = parseStoragePath(content_url);
      if (storagePath) {
        try {
          await storage.bucket().file(storagePath).delete();
          results.storage = 'deleted';
          console.log(`🗑️ delete-media: Storage file ${storagePath} deleted`);
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Storage delete failed';
          // "No such object" means it was already gone — not an error
          results.storage = msg.includes('No such object') ? 'already gone' : `warning: ${msg}`;
          console.warn(`⚠️ delete-media: Storage delete failed for ${storagePath}:`, msg);
        }
      } else {
        results.storage = 'skipped — external URL';
      }
    } else {
      results.storage = 'skipped — no content_url';
    }

    return NextResponse.json({ id, deleted: true, results });

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Delete failed';
    console.error('❌ delete-media error:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * Parses a Firebase Storage path from a public URL.
 * Handles two common URL formats:
 *   https://storage.googleapis.com/{bucket}/{path}
 *   https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{encoded_path}?alt=media
 */
function parseStoragePath(url: string): string | null {
  try {
    const parsed = new URL(url);

    // Format 1: storage.googleapis.com/{bucket}/{path}
    if (parsed.hostname === 'storage.googleapis.com') {
      const parts = parsed.pathname.split('/').filter(Boolean);
      // parts[0] is the bucket, rest is the path
      if (parts.length > 1) return parts.slice(1).join('/');
    }

    // Format 2: firebasestorage.googleapis.com/v0/b/{bucket}/o/{encoded_path}
    if (parsed.hostname === 'firebasestorage.googleapis.com') {
      const match = parsed.pathname.match(/\/v0\/b\/[^/]+\/o\/(.+)/);
      if (match) return decodeURIComponent(match[1]);
    }
  } catch {
    // Not a valid URL
  }
  return null;
}

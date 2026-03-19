import { NextResponse } from 'next/server';
import { Firestore } from 'firebase-admin/firestore';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const adminModule = require('../../../firebase-config');
const db: Firestore = adminModule.firestore();

// ─── Cache ────────────────────────────────────────────────────────────────────
// Media lists don't change often — 5 minutes is safe.

interface CacheEntry { data: object[]; expiresAt: number; }
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60_000;

function getCached(id: string): object[] | null {
  const entry = cache.get(id);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { cache.delete(id); return null; }
  return entry.data;
}

function setCache(id: string, data: object[]): void {
  if (cache.size >= 500) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(id, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

// ─── Route ────────────────────────────────────────────────────────────────────

/**
 * GET /api/media-by-lab?id=<labId>
 * Returns all media documents for a given lab from Firestore.
 * Queries by both Firestore reference and string lab_id in parallel.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const labId = searchParams.get('id');

    if (!labId) {
      return NextResponse.json({ error: "Missing 'id' query param" }, { status: 400 });
    }

    const cached = getCached(labId);
    if (cached) {
      console.log(`⚡ Cache hit: media-by-lab ${labId}`);
      return NextResponse.json({ media: cached });
    }

    const labRef = db.collection('labs').doc(labId);

    // Query by Firestore reference and plain string in parallel
    const [refSnap, strSnap] = await Promise.all([
      db.collection('media').where('lab_id', '==', labRef).get(),
      db.collection('media').where('lab_id', '==', labId).get(),
    ]);

    const seen = new Set<string>();
    const media: object[] = [];

    for (const snap of [refSnap, strSnap]) {
      for (const doc of snap.docs) {
        if (seen.has(doc.id)) continue;
        seen.add(doc.id);
        const data = doc.data();

        const labIdValue = data.lab_id;
        const resolvedLabId =
          labIdValue && typeof labIdValue === 'object' && 'id' in labIdValue
            ? (labIdValue as { id: string }).id
            : typeof labIdValue === 'string' ? labIdValue : labId;

        media.push({
          id: doc.id,
          title: data.title ?? data.name ?? null,
          author: Array.isArray(data.authors)
            ? data.authors.join(', ')
            : data.author ?? null,
          content_url: data.content_url ?? data.contentUrl ?? null,
          lab_id: resolvedLabId,
          lab_name: data.lab_name ?? data.labName ?? null,
          published: data.published?.toDate?.()?.toISOString?.() ?? data.published ?? null,
          collection: 'media',
          score: 1,
        });
      }
    }

    setCache(labId, media);
    console.log(`✅ media-by-lab: ${media.length} items for lab ${labId}`);
    return NextResponse.json({ media });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch media by lab';
    console.error('❌ media-by-lab error:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

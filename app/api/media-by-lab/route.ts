import { getAdmin } from '../../../firebase-config';
import { NextResponse } from 'next/server';
import { Firestore } from 'firebase-admin/firestore';

let db: Firestore | null = null;

/**
 * GET /api/media-by-lab?id=<labId>
 * Returns all media documents for a given lab from Firestore.
 * Tries both Firestore document reference and plain string lab_id fields.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const labId = searchParams.get('id');

    if (!labId) {
      return NextResponse.json({ error: "Missing 'id' query param" }, { status: 400 });
    }

    if (!db) {
      const admin = await getAdmin();
      db = admin.firestore();
    }

    const labRef = db.collection('labs').doc(labId);

    // Query by Firestore reference (most common) and by string in parallel
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
            ? labIdValue.id
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

    console.log(`✅ Found ${media.length} media items for lab ${labId}`);
    return NextResponse.json({ media });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch media by lab';
    console.error('❌ media-by-lab error:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

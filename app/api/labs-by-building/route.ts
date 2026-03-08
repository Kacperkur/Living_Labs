import { getAdmin } from '../../../firebase-config';
import { NextResponse } from 'next/server';
import { Firestore } from 'firebase-admin/firestore';

let db: Firestore | null = null;

/**
 * GET /api/labs-by-building?building=Chemical+Engineering
 * Queries Firestore directly so location changes are always reflected immediately.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const building = searchParams.get('building');

    if (!building) {
      return NextResponse.json({ error: "Missing 'building' query param" }, { status: 400 });
    }

    if (!db) {
      const admin = await getAdmin();
      db = admin.firestore();
    }

    // Debug mode: pass ?debug=true to see all labs and their raw fields
    const debug = searchParams.get('debug') === 'true';

    if (debug) {
      const allSnapshot = await db.collection('labs').get();
      const allLabs = allSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return NextResponse.json({ debug: true, total: allLabs.length, labs: allLabs });
    }

    console.log(`🏢 Fetching labs for building: "${building}"`);

    const snapshot = await db.collection('labs').where('Location', '==', building).get();

    console.log(`🔍 Firestore query returned ${snapshot.size} docs for Location="${building}"`);

    const labs = snapshot.docs.map(doc => {
      const data = doc.data();

      const toISO = (ts: any) => {
        if (!ts) return null;
        if (typeof ts.toDate === 'function') return ts.toDate().toISOString();
        return null;
      };

      return {
        id: doc.id,
        name: data.lab_name ?? data.name ?? null,
        location: data.Location ?? null,
        biography: data.biography ?? null,
        start_date: toISO(data.start_date),
        end_date: toISO(data.end_date),
        SDGs: Array.isArray(data.SDGs) ? data.SDGs : [],
      };
    });

    console.log(`✅ Found ${labs.length} labs in "${building}"`);
    return NextResponse.json({ building, labs });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to fetch labs by building";
    console.error("❌ labs-by-building error:", error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

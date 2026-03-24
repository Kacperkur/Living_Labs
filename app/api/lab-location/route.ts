import { db } from '../../../lib/firebase-admin';
import { NextResponse } from 'next/server';

/**
 * GET /api/lab-location?id=<labId>
 * Returns the building (Location field) for a lab from Firestore.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const labId = searchParams.get('id');

    if (!labId) {
      return NextResponse.json({ error: "Missing 'id' query param" }, { status: 400 });
    }


    const doc = await db.collection('labs').doc(labId).get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Lab not found' }, { status: 404 });
    }

    const data = doc.data()!;
    return NextResponse.json({ id: labId, building: data.Location ?? null });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch lab location';
    console.error('❌ lab-location error:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

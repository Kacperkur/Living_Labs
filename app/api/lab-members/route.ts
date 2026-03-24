import { db } from '../../../lib/firebase-admin';
import { NextResponse } from 'next/server';

/**
 * GET /api/lab-members?id=<labId>
 * Returns the Members array from a Firestore lab document.
 * Members may be strings (names) or objects with { name, profile_picture_url }.
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

    // Members field may be an array of strings or objects
    const raw: any[] = Array.isArray(data.Members) ? data.Members : [];

    const members = raw.map((m: any) => {
      if (typeof m === 'string') {
        return { name: m, profile_picture_url: null };
      }
      return {
        name: m.name ?? m.display_name ?? m.email ?? 'Unknown',
        profile_picture_url: m.profile_picture_url ?? m.photoURL ?? m.photo_url ?? null,
      };
    });

    return NextResponse.json({ members });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch lab members';
    console.error('❌ lab-members error:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

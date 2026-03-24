import { NextResponse } from 'next/server';
import { db } from '../../../lib/firebase-admin';

function formatDoc(id: string, data: FirebaseFirestore.DocumentData, mediaCounts: Record<string, number>) {
  const toISO = (ts: any) => {
    if (!ts) return null;
    if (typeof ts.toDate === 'function') return ts.toDate().toISOString();
    return null;
  };
  return {
    id,
    name: data.lab_name ?? data.name ?? null,
    building: data.Location ?? null,
    biography: data.biography ?? null,
    start_date: toISO(data.start_date),
    end_date: toISO(data.end_date),
    SDGs: Array.isArray(data.SDGs) ? data.SDGs : [],
    media_count: mediaCounts[id] ?? 0,
  };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');


    // Single lab by ID — no media_count needed here
    if (id) {
      const doc = await db.collection('labs').doc(id).get();
      if (!doc.exists) {
        return NextResponse.json({ error: 'Lab not found' }, { status: 404 });
      }
      return NextResponse.json({ lab: formatDoc(doc.id, doc.data()!, {}) });
    }

    // Fetch all labs and media lab_id fields in parallel
    const [snapshot, mediaSnap] = await Promise.all([
      db.collection('labs').orderBy('lab_name').get(),
      db.collection('media').select('lab_id').get(),
    ]);

    // Count media per lab_id in one pass
    const mediaCounts: Record<string, number> = {};
    mediaSnap.docs.forEach(doc => {
      const labId = doc.data().lab_id;
      if (typeof labId === 'string' && labId) {
        mediaCounts[labId] = (mediaCounts[labId] ?? 0) + 1;
      }
    });

    const labs = snapshot.docs.map(doc => formatDoc(doc.id, doc.data(), mediaCounts));

    return NextResponse.json({ labs });
  } catch (error) {
    console.error('❌ all-labs error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch labs' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { getAdmin } from '../../../firebase-config';
import { Firestore } from 'firebase-admin/firestore';

let db: Firestore | null = null;

function formatDoc(id: string, data: FirebaseFirestore.DocumentData) {
  const toISO = (ts: any) => {
    if (!ts) return null;
    if (typeof ts.toDate === 'function') return ts.toDate().toISOString();
    return null;
  };
  return {
    id,
    name: data.lab_name ?? data.name ?? null,
    location: data.Location ?? null,
    biography: data.biography ?? null,
    start_date: toISO(data.start_date),
    end_date: toISO(data.end_date),
    SDGs: Array.isArray(data.SDGs) ? data.SDGs : [],
  };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!db) {
      const admin = await getAdmin();
      db = admin.firestore();
    }

    // Single lab by ID
    if (id) {
      const doc = await db.collection('labs').doc(id).get();
      if (!doc.exists) {
        return NextResponse.json({ error: 'Lab not found' }, { status: 404 });
      }
      return NextResponse.json({ lab: formatDoc(doc.id, doc.data()!) });
    }

    const snapshot = await db.collection('labs').orderBy('lab_name').get();

    const labs = snapshot.docs.map(doc => formatDoc(doc.id, doc.data()));

    return NextResponse.json({ labs });
  } catch (error) {
    console.error('❌ all-labs error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch labs' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { db } from '../../../lib/firebase-admin';

export async function GET() {
  try {
    const docRef = db.collection('labs').doc('dStVdVkqc86qnhdZTzAw');
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ ok: false, message: 'No document' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: docSnap.data() });
  } catch (err: any) {
    console.error('Firestore error:', err);
    return NextResponse.json({ ok: false, error: err?.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
// Use the server-side initialized admin SDK exported from the project's firebase-config
import admin from '../../../firebase-config';
const db = admin.firestore();

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

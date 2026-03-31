import { NextResponse } from 'next/server';
import { db } from '../../../lib/firebase-admin';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    await db.collection('SustainabilitySummitTesters').add({ email: email.trim().toLowerCase() });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ join-waitlist error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save email' },
      { status: 500 }
    );
  }
}

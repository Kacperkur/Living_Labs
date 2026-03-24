import { NextResponse } from 'next/server';
import { db } from '../../../lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { Pinecone } from '@pinecone-database/pinecone';

const apiKey = process.env.PINECONE_API_KEY;
const pc = new Pinecone({ apiKey: apiKey as string });
const index = pc.index('livinglabsdemo').namespace('media');

/**
 * POST /api/add-media
 *
 * Saves a media document to Firestore, then upserts it to Pinecone using the
 * Firestore doc ID as the record ID so search results map back correctly.
 *
 * Body (JSON):
 * {
 *   title:       string,
 *   authors:     string[],
 *   description: string,   — embedded as the searchable text in Pinecone
 *   content_url: string,
 *   published:   string (YYYY-MM-DD),
 *   lab_id:      string,
 *   lab_name:    string,
 *   location:    string,   — lab's building location, stored as Pinecone metadata
 * }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, authors, description, content_url, published, lab_id, lab_name, location } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }
    if (!lab_id?.trim()) {
      return NextResponse.json({ error: 'lab_id is required' }, { status: 400 });
    }

    const authorString = Array.isArray(authors)
      ? authors.map((a: string) => a.trim()).filter(Boolean).join(', ')
      : typeof authors === 'string' ? authors.trim() : null;

    const publishedTimestamp = published
      ? (() => { const d = new Date(published); return isNaN(d.getTime()) ? null : Timestamp.fromDate(d); })()
      : null;

    // 1. Save to Firestore
    const docData = {
      title: title.trim(),
      author: authorString || null,
      description: description?.trim() || null,
      content_url: content_url?.trim() || null,
      published: publishedTimestamp,
      lab_id: lab_id.trim(),
      lab_name: lab_name?.trim() || null,
      location: location?.trim() || null,
    };

    const docRef = await db.collection('media').add(docData);
    console.log(`✅ add-media: Firestore doc created ${docRef.id} for lab ${lab_id}`);

    // 2. Upsert to Pinecone — use the Firestore doc ID as the record ID so
    //    search hits map back to the correct Firestore document.
    //    The `text` field is what Pinecone embeds for semantic search.
    //    All other fields are stored as metadata and returned with search results.
    const pineconeWarning = await (async () => {
      if (!apiKey) return 'Pinecone API key missing — skipped';
      const descriptionText = description?.trim();
      if (!descriptionText) return 'No description provided — Pinecone upsert skipped';

      try {
        const textParts = [
          `Title: ${title.trim()}`,
          authorString   ? `Authors: ${authorString}`          : null,
          location?.trim() ? `Location: ${location.trim()}`    : null,
          lab_name?.trim() ? `Lab: ${lab_name.trim()}`         : null,
          published        ? `Published: ${published}`          : null,
          `\n${descriptionText}`,
        ].filter(Boolean).join('\n');

        await index.upsertRecords([{
          id: docRef.id,
          text: textParts,
          title: title.trim(),
          author: authorString || '',
          location: location?.trim() || '',
          lab_id: lab_id.trim(),
          lab_name: lab_name?.trim() || '',
          content_url: content_url?.trim() || '',
          published: published || '',
        }]);
        console.log(`✅ add-media: Pinecone record upserted ${docRef.id}`);
        return null;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Pinecone upsert failed';
        console.error('⚠️ add-media: Pinecone upsert error (Firestore save succeeded):', msg);
        return msg;
      }
    })();

    return NextResponse.json({
      id: docRef.id,
      pineconeWarning,
      published: published ?? null,
    });

  } catch (error) {
    console.error('❌ add-media error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to add media' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { getAdmin } from '../../../firebase-config';
import { Firestore, Timestamp } from 'firebase-admin/firestore';
import { Pinecone } from '@pinecone-database/pinecone';

/**
 * POST /api/ingest-media
 *
 * Accepts a CSV body (Content-Type: text/csv), creates documents in the
 * Firestore "media" collection, and upserts each record to Pinecone for
 * semantic search.
 *
 * CSV column order:
 *   id, title, authors, description, content_url, lab_id, lab_name, published
 *
 * Notes:
 *   - "id" is optional — leave blank to auto-generate a Firestore document ID.
 *   - "authors" accepts pipe-separated names, e.g. "Jane Doe|John Smith"
 *   - "description" is embedded as the searchable text in Pinecone
 *   - "published" should be YYYY-MM-DD. Blank = null.
 */

let db: Firestore | null = null;

const apiKey = process.env.PINECONE_API_KEY;
const pc = new Pinecone({ apiKey: apiKey as string });
const index = pc.index('livinglabsdemo').namespace('media');

// ── CSV parser ────────────────────────────────────────────────────────────────

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n').filter(Boolean);
  if (lines.length < 2) return [];
  const headers = parseCSVLine(lines[0]);
  return lines.slice(1).map(line => {
    const values = parseCSVLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = values[i] ?? ''; });
    return row;
  });
}

function toTimestamp(value: string): Timestamp | null {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : Timestamp.fromDate(d);
}

function toAuthorString(value: string): string {
  if (!value) return '';
  return value.split('|').map(s => s.trim()).filter(Boolean).join(', ');
}

// ── Route ─────────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') ?? '';
    if (!contentType.includes('text/csv')) {
      return NextResponse.json({ error: 'Content-Type must be text/csv' }, { status: 415 });
    }

    const body = await req.text();
    const rows = parseCSV(body);

    if (rows.length === 0) {
      return NextResponse.json({ error: 'CSV is empty or missing header row' }, { status: 400 });
    }

    if (!db) {
      const admin = await getAdmin();
      db = admin.firestore();
    }

    const collection = db.collection('media');
    const results: { id: string; status: 'created' | 'updated'; pineconeWarning?: string }[] = [];
    const errors: { row: number; error: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const authorString = toAuthorString(row.authors);
        const description = row.description?.trim() || null;

        const docData: Record<string, unknown> = {
          title:       row.title       || null,
          author:      authorString    || null,
          description: description,
          content_url: row.content_url || null,
          lab_id:      row.lab_id      || null,
          lab_name:    row.lab_name    || null,
          published:   toTimestamp(row.published),
        };

        // 1. Write to Firestore
        let docRef;
        let status: 'created' | 'updated';

        if (row.id) {
          docRef = collection.doc(row.id);
          const existing = await docRef.get();
          status = existing.exists ? 'updated' : 'created';
          await docRef.set(docData, { merge: true });
        } else {
          docRef = await collection.add(docData);
          status = 'created';
        }

        // 2. Upsert to Pinecone — only if description is present
        let pineconeWarning: string | undefined;
        if (!apiKey) {
          pineconeWarning = 'Pinecone API key missing — skipped';
        } else if (!description) {
          pineconeWarning = 'No description — Pinecone upsert skipped';
        } else {
          try {
            const textParts = [
              `Title: ${row.title.trim()}`,
              authorString           ? `Authors: ${authorString}`          : null,
              row.lab_name?.trim()   ? `Lab: ${row.lab_name.trim()}`       : null,
              row.published          ? `Published: ${row.published}`        : null,
              `\n${description}`,
            ].filter(Boolean).join('\n');

            await index.upsertRecords([{
              id:          docRef.id,
              text:        textParts,
              title:       row.title.trim(),
              author:      authorString || '',
              lab_id:      row.lab_id?.trim()   || '',
              lab_name:    row.lab_name?.trim()  || '',
              content_url: row.content_url?.trim() || '',
              published:   row.published || '',
            }]);
          } catch (err) {
            pineconeWarning = err instanceof Error ? err.message : 'Pinecone upsert failed';
            console.error(`⚠️ ingest-media: Pinecone error row ${i + 2}:`, pineconeWarning);
          }
        }

        results.push({ id: docRef.id, status, ...(pineconeWarning ? { pineconeWarning } : {}) });
      } catch (err) {
        errors.push({ row: i + 2, error: err instanceof Error ? err.message : String(err) });
      }
    }

    console.log(`✅ ingest-media: ${results.length} docs written, ${errors.length} errors`);
    return NextResponse.json({ written: results.length, results, errors });

  } catch (error) {
    console.error('❌ ingest-media error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Ingest failed' },
      { status: 500 }
    );
  }
}

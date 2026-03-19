import { NextResponse } from 'next/server';
import { getAdmin } from '../../../firebase-config';
import { Firestore, Timestamp } from 'firebase-admin/firestore';

/**
 * POST /api/ingest-media
 *
 * Accepts a CSV body (Content-Type: text/csv) and creates documents in the
 * Firestore "media" collection.
 *
 * CSV column order:
 *   id, title, authors, content_url, lab_id, lab_name, published
 *
 * Notes:
 *   - "id" is optional — leave blank to auto-generate a Firestore document ID.
 *   - "authors" accepts pipe-separated names, e.g. "Jane Doe|John Smith"
 *   - "published" should be YYYY-MM-DD (e.g. 2023-06-15). Blank = null.
 *
 * Example CSV:
 *   id,title,authors,content_url,lab_id,lab_name,published
 *   ,Path planning algorithms,"Jane Doe|John Smith",https://example.com/paper.pdf,lab123,Autonomous Systems Lab,2023-06-15
 */

let db: Firestore | null = null;

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

function toAuthors(value: string): string {
  // Store as a joined string for compatibility with existing author field
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
    const results: { id: string; status: 'created' | 'updated' }[] = [];
    const errors: { row: number; error: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        const docData: Record<string, unknown> = {
          title: row.title || null,
          author: toAuthors(row.authors) || null,
          content_url: row.content_url || null,
          lab_id: row.lab_id || null,
          lab_name: row.lab_name || null,
          published: toTimestamp(row.published),
        };

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

        results.push({ id: docRef.id, status });
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

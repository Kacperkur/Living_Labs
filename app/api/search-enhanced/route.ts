import { Pinecone } from '@pinecone-database/pinecone';
import { getAdmin } from '../../../firebase-config';
import { NextResponse } from 'next/server';
import { Timestamp, Firestore } from 'firebase-admin/firestore';
import {
  SearchRequest,
  SearchResponse,
  EnrichedMedia,
  PineconeMetadata
} from '../../../types';

const apiKey = process.env.PINECONE_API_KEY;
if (!apiKey) console.warn("⚠️ Missing PINECONE_API_KEY environment variable");

const pc = new Pinecone({ apiKey: apiKey as string });
const index = pc.index("livinglabsdemo").namespace("media");
let db: Firestore | null = null;

// How many results to fetch from Pinecone before threshold filtering.
// Larger than pageSize so filtering still leaves enough results.
const PINECONE_FETCH_LIMIT = 100;

// Default similarity threshold — results below this score are dropped.
const DEFAULT_MIN_SCORE = 0.3;

// Default page size
const DEFAULT_PAGE_SIZE = 20;

function extractRecordId(h: Record<string, unknown>): string | null {
  if (!h) return null;
  const rec = h.record as Record<string, unknown> | undefined;
  if (rec && typeof rec.id === 'string' && rec.id) return rec.id;
  if (typeof h._id === 'string' && h._id) return h._id;
  if (typeof h.id === 'string' && h.id) return h.id;
  const meta = (h.metadata ?? rec?.metadata) as Record<string, unknown> | undefined;
  if (meta) return (meta.id ?? meta.media_id ?? meta.documentId ?? null) as string | null;
  return null;
}

function extractScore(h: Record<string, unknown>): number {
  if (typeof h._score === 'number') return h._score;
  if (typeof h.score === 'number') return h.score;
  return 0;
}

// Single-RPC Firestore enrichment using getAll() instead of N individual .get() calls.
async function enrichWithFirestore(mediaIds: string[]): Promise<Map<string, EnrichedMedia>> {
  const enrichedMap = new Map<string, EnrichedMedia>();
  const ids = Array.from(new Set(mediaIds.filter(Boolean)));
  if (ids.length === 0) return enrichedMap;

  const mediaCollection = db!.collection('media');
  const docRefs = ids.map(id => mediaCollection.doc(id));

  try {
    const snapshots = await db!.getAll(...docRefs);
    snapshots.forEach(snap => {
      if (!snap.exists) return;
      const data = snap.data()!;
      enrichedMap.set(snap.id, {
        id: snap.id,
        title: extractField(data, ['title', 'name', 'Title', 'Name']) as string | null,
        author: normalizeAuthor(extractField(data, ['author', 'authors', 'Author', 'Authors', 'creator', 'Creator'])),
        content_url: extractField(data, ['content_url', 'contentUrl', 'url', 'mediaUrl', 'media_url', 'fileUrl', 'file_url', 'downloadUrl', 'download_url']) as string | null,
        lab_id: normalizeLabId(extractField(data, ['lab_id', 'labId', 'lab', 'Lab'])),
        lab_name: extractField(data, ['lab_name', 'labName', 'displayName']) as string | null,
        published: data.published instanceof Timestamp ? data.published : null,
      });
    });
  } catch (error) {
    console.error('Firestore getAll error:', error);
  }

  return enrichedMap;
}

function extractField(data: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (data[key] != null) return data[key];
    const meta = data.metadata as Record<string, unknown> | undefined;
    if (meta?.[key] != null) return meta[key];
    const fields = data.fields as Record<string, unknown> | undefined;
    if (fields?.[key] != null) return fields[key];
  }
  return null;
}

function normalizeAuthor(value: unknown): string | null {
  if (Array.isArray(value)) return value.join(', ');
  return typeof value === 'string' ? value : null;
}

function normalizeLabId(value: unknown): string | null {
  if (value && typeof value === 'object' && 'id' in value) return (value as { id: string }).id;
  return typeof value === 'string' ? value : null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as SearchRequest;
    const {
      query: queryText,
      topK = DEFAULT_PAGE_SIZE,
      minScore = DEFAULT_MIN_SCORE,
      offset = 0,
    } = body;

    if (!apiKey) {
      return NextResponse.json({ error: "Server missing Pinecone configuration" }, { status: 500 });
    }

    if (!queryText?.trim()) {
      return NextResponse.json({ error: "Missing search query" }, { status: 400 });
    }

    if (!db) {
      const admin = await getAdmin();
      db = admin.firestore();
    }

    console.log(`🔍 Search: "${queryText}" (pageSize: ${topK}, minScore: ${minScore}, offset: ${offset})`);

    // 1. Fetch more than we need from Pinecone, then threshold-filter client-side.
    //    This avoids re-fetching on subsequent pages while keeping Pinecone calls bounded.
    const pineconeRes = await index.searchRecords({
      query: {
        topK: PINECONE_FETCH_LIMIT,
        inputs: { text: queryText }
      },
      fields: ['title', 'author', 'content_url']
    });

    const rawHits = (pineconeRes?.result?.hits ?? []) as unknown as Record<string, unknown>[];

    // 2. Filter by similarity threshold — drop noise
    const qualifiedHits = rawHits.filter(h => extractScore(h) >= minScore);

    // 3. Paginate
    const pageHits = qualifiedHits.slice(offset, offset + topK);
    const hasMore = qualifiedHits.length > offset + topK;

    console.log(`📍 Pinecone: ${rawHits.length} raw → ${qualifiedHits.length} above threshold (${minScore}) → ${pageHits.length} on page`);

    if (pageHits.length === 0) {
      return NextResponse.json({ results: [], count: 0, hasMore: false, notFound: [] } satisfies SearchResponse);
    }

    // 4. Extract IDs for Firestore lookup
    const pageIds = pageHits.map(extractRecordId).filter(Boolean) as string[];
    const uniqueIds = Array.from(new Set(pageIds));

    // 5. Single-RPC Firestore enrichment
    const enrichedMap = await enrichWithFirestore(uniqueIds);
    const notFound = uniqueIds.filter(id => !enrichedMap.has(id));

    if (notFound.length > 0) {
      console.warn(`⚠️ ${notFound.length} Pinecone IDs not found in Firestore:`, notFound);
    }

    // 6. Build results — Map lookup instead of O(n²) find()
    const results = pageHits.map(hit => {
      const hitId = extractRecordId(hit);
      const score = extractScore(hit);
      const firestore = hitId ? enrichedMap.get(hitId) : undefined;

      const pineconeMetadata = (hit.metadata ?? (hit.record as Record<string, unknown> | undefined)?.metadata ?? null) as PineconeMetadata | null;

      return {
        id: hitId ?? '',
        score,
        title: firestore?.title ?? pineconeMetadata?.title ?? null,
        author: firestore?.author ?? pineconeMetadata?.author ?? null,
        content_url: firestore?.content_url ?? pineconeMetadata?.content_url ?? null,
        lab_id: firestore?.lab_id ?? pineconeMetadata?.lab_id ?? null,
        lab_name: firestore?.lab_name ?? pineconeMetadata?.lab_name ?? null,
        published: firestore?.published ? firestore.published.toDate().toISOString() : (pineconeMetadata?.published ?? null),
        collection: 'media' as const,
        pineconeMetadata: pineconeMetadata ?? undefined,
      };
    }).filter(r => r.id.length > 0); // drop any hits we couldn't extract an ID from

    const response: SearchResponse = {
      results: results as SearchResponse['results'],
      count: results.length,
      hasMore,
      notFound,
    };

    return NextResponse.json(response);

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Search failed";
    console.error("❌ Search API Error:", error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

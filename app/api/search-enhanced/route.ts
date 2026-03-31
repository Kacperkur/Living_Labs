import { Pinecone } from '@pinecone-database/pinecone';
import { NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { db } from '../../../lib/firebase-admin';
import {
  SearchRequest,
  SearchResponse,
  EnrichedMedia,
  PineconeMetadata
} from '../../../types';



const DEFAULT_MIN_SCORE = 0.1;
const DEFAULT_PAGE_SIZE = 20;

// ─── Query sanitizer ──────────────────────────────────────────────────────────
// Strips domain-specific filler words that pollute the embedding and cause
// Pinecone to return loosely related results (e.g. "living lab climate" should
// embed as "climate", not as "living lab + climate").
// Words are matched as whole tokens (case-insensitive).

// Single-word fillers — O(1) Set.has() lookup per token
const FILLER_WORDS = new Set([
  // domain fillers
  'living', 'lab', 'labs',
  'uri', 'university', 'research',
  // question / conversational openers
  'what', 'how', 'why', 'where', 'when', 'who',
  'find', 'show', 'search', 'looking', 'look',
  // academic meta-words
  'paper', 'papers', 'study', 'studies', 'publication', 'publications',
  'project', 'projects', 'topic', 'topics', 'work', 'about', 'related',
  // common stop words
  'a', 'an', 'the', 'and', 'or', 'of', 'in', 'on', 'at',
  'for', 'to', 'with', 'by', 'from', 'is', 'are', 'that',
]);

// Multi-word phrases compiled once at module load — longest first so
// "living labs" matches before "living" would get a chance to.
const MULTI_WORD_FILLERS = [
  'living labs',
  'living lab',
  'rhode island',
];

const MULTI_WORD_REGEX = new RegExp(
  MULTI_WORD_FILLERS
    .sort((a, b) => b.length - a.length)
    .map(p => `\\b${p}\\b`)
    .join('|'),
  'gi'
);

function sanitizeQuery(raw: string): string {
  const q = raw.toLowerCase().trim()
    .replace(MULTI_WORD_REGEX, ' ')  // strip multi-word phrases (precompiled)
    .replace(/\s+/g, ' ')            // collapse whitespace
    .trim();

  const tokens = q.split(' ').filter(t => t.length > 0 && !FILLER_WORDS.has(t));
  const cleaned = tokens.join(' ').trim();

  // If sanitizing removed everything, fall back to the original so we still
  // return something rather than sending an empty string to Pinecone.
  return cleaned.length > 0 ? cleaned : raw.trim();
}

// ─── In-memory query cache ────────────────────────────────────────────────────
// TTL = 60 s. Eliminates Pinecone + Firestore round-trips for repeated queries.
// The module-level Map survives between requests in the same server process.
interface CacheEntry { response: SearchResponse; expiresAt: number; }
const queryCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 30_000;
const MAX_CACHE_ENTRIES = 200;

function cacheKey(query: string, minScore: number, offset: number, topK: number): string {
  return `${query.toLowerCase().trim()}|${minScore}|${offset}|${topK}`;
}

function getCached(key: string): SearchResponse | null {
  const entry = queryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { queryCache.delete(key); return null; }
  return entry.response;
}

function setCache(key: string, response: SearchResponse): void {
  if (queryCache.size >= MAX_CACHE_ENTRIES) {
    // Evict oldest entry
    const oldest = queryCache.keys().next().value;
    if (oldest) queryCache.delete(oldest);
  }
  queryCache.set(key, { response, expiresAt: Date.now() + CACHE_TTL_MS });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Firestore enrichment ─────────────────────────────────────────────────────
// Uses db.getAll() — single RPC for all IDs instead of N individual .get() calls.
// Only called for IDs where Pinecone metadata is incomplete.

async function enrichWithFirestore(mediaIds: string[]): Promise<Map<string, EnrichedMedia>> {
  const enrichedMap = new Map<string, EnrichedMedia>();
  const ids = Array.from(new Set(mediaIds.filter(Boolean)));
  if (ids.length === 0) return enrichedMap;

  const mediaCollection = db.collection('media');
  const docRefs = ids.map(id => mediaCollection.doc(id));

  try {
    const snapshots = await db.getAll(...docRefs);
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

// ─── Route ────────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const apiKey = process.env.PINECONE_API_KEY;
  if (!apiKey) console.warn("⚠️ Missing PINECONE_API_KEY environment variable");
  const index = new Pinecone({ apiKey: apiKey as string }).index("livinglabsdemo").namespace("media");

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

    const key = cacheKey(queryText, minScore, offset, topK);
    const cached = getCached(key);
    if (cached) {
      console.log(`⚡ Cache hit: "${queryText}" (offset: ${offset})`);
      return NextResponse.json(cached);
    }

    const pineconeQuery = sanitizeQuery(queryText);
    if (pineconeQuery !== queryText.trim()) {
      console.log(`🧹 Query sanitized: "${queryText}" → "${pineconeQuery}"`);
    }
    console.log(`🔍 Search: "${pineconeQuery}" (pageSize: ${topK}, minScore: ${minScore}, offset: ${offset})`);

    // Adaptive fetch: over-fetch just enough to survive threshold filtering.
    // 3× the needed results, capped at 100. Much faster than always asking for 100.
    const fetchLimit = Math.min((offset + topK) * 3, 200);

    // 1. Pinecone semantic search
    const pineconeRes = await index.searchRecords({
      query: { topK: fetchLimit, inputs: { text: pineconeQuery } },
      fields: ['title', 'author', 'content_url', 'lab_id', 'lab_name']
    });

    const rawHits = (pineconeRes?.result?.hits ?? []) as unknown as Record<string, unknown>[];

    // 2. Threshold filter
    const qualifiedHits = rawHits.filter(h => extractScore(h) >= minScore);

    // 3. Paginate
    const pageHits = qualifiedHits.slice(offset, offset + topK);
    const hasMore = qualifiedHits.length > offset + topK;

    console.log(`📍 Pinecone: ${rawHits.length} raw → ${qualifiedHits.length} above threshold → ${pageHits.length} on page`);

    if (pageHits.length === 0) {
      const empty: SearchResponse = { results: [], count: 0, hasMore: false, notFound: [] };
      setCache(key, empty);
      return NextResponse.json(empty);
    }

    // 4. For each hit, check whether Pinecone metadata already has what we need.
    //    Only call Firestore for IDs where metadata is incomplete — saves the RPC
    //    entirely when your Pinecone index is up to date.
    const needsEnrichment: string[] = [];
    const pineconeMetaMap = new Map<string, PineconeMetadata>();

    for (const hit of pageHits) {
      const id = extractRecordId(hit);
      if (!id) continue;
      const meta = (hit.metadata ?? (hit.record as Record<string, unknown> | undefined)?.metadata ?? {}) as PineconeMetadata;
      pineconeMetaMap.set(id, meta);
      // Only enrich from Firestore if Pinecone is missing key fields
      if (!meta.title || !meta.content_url) needsEnrichment.push(id);
    }

    const firestoreMap = needsEnrichment.length > 0
      ? await enrichWithFirestore(needsEnrichment)
      : new Map<string, EnrichedMedia>();

    if (needsEnrichment.length > 0) {
      console.log(`🔥 Firestore enriched ${firestoreMap.size}/${needsEnrichment.length} docs (${pageHits.length - needsEnrichment.length} served from Pinecone metadata)`);
    }

    // 5. Build results
    const notFound: string[] = [];
    const results = pageHits.map(hit => {
      const hitId = extractRecordId(hit);
      if (!hitId) return null;

      const score = extractScore(hit);
      const pm = pineconeMetaMap.get(hitId);
      const fs = firestoreMap.get(hitId);

      if (needsEnrichment.includes(hitId) && !fs) notFound.push(hitId);

      return {
        id: hitId,
        score,
        title: fs?.title ?? pm?.title ?? null,
        author: fs?.author ?? pm?.author ?? null,
        content_url: fs?.content_url ?? pm?.content_url ?? null,
        lab_id: fs?.lab_id ?? pm?.lab_id ?? null,
        lab_name: fs?.lab_name ?? pm?.lab_name ?? null,
        published: fs?.published
          ? fs.published.toDate().toISOString()
          : (pm?.published ?? null),
        collection: 'media' as const,
      };
    }).filter((r): r is NonNullable<typeof r> => r !== null);

    const response: SearchResponse = {
      results: results as SearchResponse['results'],
      count: results.length,
      hasMore,
      notFound,
    };

    setCache(key, response);
    return NextResponse.json(response);

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Search failed";
    console.error("❌ Search API Error:", error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

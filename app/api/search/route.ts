import { Pinecone } from '@pinecone-database/pinecone';
import { getAdmin } from '../../../firebase-config'; // Firestore Admin SDK (lazy)
import { NextResponse } from 'next/server';

// Ensure key exists
const apiKey = process.env.PINECONE_API_KEY;
if (!apiKey) console.warn("⚠️ Missing PINECONE_API_KEY environment variable");

const pc = new Pinecone({ apiKey: apiKey as string });
const index = pc.index("livinglabsdemo").namespace("media");
let db: any = null;


export async function POST(req: Request) {
  try {
    const { query: queryText, topK = 5 } = await req.json();

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Server missing Pinecone configuration" }),
        { status: 500 }
      );
    }

    if (!queryText || !queryText.trim()) {
      return new Response(
        JSON.stringify({ error: "Missing search query" }),
        { status: 400 }
      );
    }

    // Ensure Firebase admin is initialized before any Firestore ops (if used)
    if (!db) {
      const admin = await getAdmin();
      db = admin.firestore();
    }

    // ✅ Semantic Search using text (returns hits)
    const pineconeRes = await index.searchRecords({
      query: {
        topK,
        inputs: { text: queryText }
      },
      fields: ['title', 'author', 'content_url'] // ✅ include metadata fields your index stores
    });

    const hits = pineconeRes?.result?.hits ?? [];

    // Robust extractor for Pinecone record IDs — different SDKs/versions put the id
    // in different places (record.id, id, _id, or inside metadata). Prefer record.id.
    function extractRecordIdFromHit(h: any): string | null {
      if (!h) return null;
      if (h.record && typeof h.record.id === 'string' && h.record.id) return h.record.id;
      if (typeof h.id === 'string' && h.id) return h.id;
      if (typeof h._id === 'string' && h._id) return h._id;
      if (h.metadata && (h.metadata.id || h.metadata.media_id || h.metadata.documentId)) return (h.metadata.id || h.metadata.media_id || h.metadata.documentId);
      if (h.record && h.record.metadata && (h.record.metadata.id || h.record.metadata.media_id)) return (h.record.metadata.id || h.record.metadata.media_id);
      return null;
    }

    const mediaIds = Array.from(new Set(hits.map(extractRecordIdFromHit).filter(Boolean))) as string[];

    // Log any hits we couldn't extract an ID from to aid debugging
    const hitsMissingId = hits.filter((h: any) => !extractRecordIdFromHit(h));
    if (hitsMissingId.length > 0) {
      console.warn('Some Pinecone hits are missing an extractable record ID:', hitsMissingId.slice(0,5));
    }

    console.log("🔎 Pinecone Search Output:", {
      queryText,
      topK,
      count: hits.length,
      mediaIds,
      rawHits: hits
    });

    return NextResponse.json({
      mediaIds,
      count: mediaIds.length
    });

  } catch (error: any) {
    console.error("❌ Search API Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Search failed" }),
      { status: 500 }
    );
  }
}


// Previous version using more manual Firestore querying:

// import { Pinecone } from '@pinecone-database/pinecone';
// // Server-side Firebase admin instance (initialized in project root `firebase-config.js`)
// import admin from '../../../firebase-config';

// const apiKey = process.env.PINECONE_API_KEY;
// if (!apiKey) {
//   // In Next.js, throwing at module load will crash the server - return an informative runtime error instead in the route
//   console.warn('Warning: Missing PINECONE_API_KEY env var');
// }

// const pc = new Pinecone({ apiKey: apiKey as string });
// const index = pc.index('livinglabsdemo').namespace('media');
// const db = admin.firestore();

// // Helper: query Firestore for documents whose document ID matches any of the
// // provided media IDs. We search all root collections and return matching
// // documents with collection name, id, path and data.
// async function queryFirestoreByDocIds(mediaIds: string[]) {
//   try {
//     const ids = Array.from(new Set(mediaIds.filter(Boolean))) as string[];
//     if (ids.length === 0) return [];

//     const matches: Array<any> = [];
//     const collections = await db.listCollections();

//     // chunk ids to avoid building huge batches (and keep memory use reasonable)
//     const chunk = <T,>(arr: T[], size = 50) => {
//       const out: T[][] = [];
//       for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
//       return out;
//     };

//     for (const coll of collections) {
//       try {
//         for (const idChunk of chunk(ids, 50)) {
//           // fetch each doc in parallel for this collection chunk
//           const snaps = await Promise.all(idChunk.map((id) => coll.doc(id).get()));
//           snaps.forEach((s) => {
//             if (s.exists) matches.push({ collection: coll.id, id: s.id, path: s.ref.path, data: s.data() });
//           });
//         }
//       } catch (e) {
//         console.debug(`Skipping collection ${coll.id} when checking doc IDs:`, (e as any)?.message || e);
//       }
//     }

//     // De-duplicate by collection+id
//     const unique = new Map<string, any>();
//     for (const m of matches) unique.set(`${m.collection}/${m.id}`, m);
//     return Array.from(unique.values());
//   } catch (err) {
//     console.error('Firestore query by doc IDs error:', err);
//     return [];
//   }
// }

// export async function POST(req: Request) {
//   try {
//     const body = await req.json();
//     const queryText = body?.query || '';
//     const topK = typeof body?.topK === 'number' ? body.topK : 5;

//     if (!queryText || !queryText.trim()) {
//       return new Response(JSON.stringify({ error: 'Missing query text' }), { status: 400 });
//     }

//     if (!apiKey) {
//       return new Response(JSON.stringify({ error: 'Server not configured: missing API key' }), { status: 500 });
//     }

//     const results = await index.searchRecords({
//       query: {
//         topK,
//         inputs: { text: queryText },
//       },
//     });

//     // Developer-friendly logging: extract project_id and lab_id from common Pinecone shapes
//     try {
//       const anyRes: any = results as any;
//       // hits can live under result.hits (example), or matches/records depending on SDK
//       const hits = Array.isArray(anyRes?.result?.hits)
//         ? anyRes.result.hits
//         : Array.isArray(anyRes?.matches)
//         ? anyRes.matches
//         : Array.isArray(anyRes?.records)
//         ? anyRes.records
//         : [];

//       // Per Pinecone search_records response (see https://docs.pinecone.io/reference/api/2025-04/data-plane/search_records#response-result)
//       // the record id may appear as `hit.id` or `hit.record.id` (or in some SDKs under metadata).
//       // Prefer the official `record.id` when present, then fall back to other common fields.
//       function extractRecordIdFromHit(h: any): string | null {
//         if (!h) return null;
//         // Preferred: record.id (per docs)
//         if (h.record && typeof h.record.id === 'string' && h.record.id) return h.record.id;
//         if (typeof h.id === 'string' && h.id) return h.id;
//         // legacy/alternate metadata placements
//         if (h.metadata && (h.metadata.id || h.metadata.media_id || h.metadata.documentId)) return (h.metadata.id || h.metadata.media_id || h.metadata.documentId);
//         if (h.record && h.record.metadata && (h.record.metadata.id || h.record.metadata.media_id)) return (h.record.metadata.id || h.record.metadata.media_id);
//         return null;
//       }

//       const mediaIds = Array.from(new Set((hits || []).map((h: any) => extractRecordIdFromHit(h)).filter(Boolean))) as string[];

//       console.log('Pinecone search results (summary):', {
//         query: queryText,
//         topK,
//         hitCount: (hits || []).length,
//         mediaIds,
//       });

//       // Query Firestore for documents that have a document ID matching any media ID
//       const firestoreMatches = await queryFirestoreByDocIds(mediaIds);
//       console.log(`Firestore matches found: ${firestoreMatches.length}`);

//       // Return only Firestore matches and the mediaIds (omit raw Pinecone results from client response)
//       return new Response(JSON.stringify({ mediaIds, firestoreMatches }), {
//         status: 200,
//         headers: { 'Content-Type': 'application/json' },
//       });
//     } catch (logErr) {
//       console.error('Failed to extract/ log Pinecone results', logErr);
//       return new Response(JSON.stringify(results), {
//         status: 200,
//         headers: { 'Content-Type': 'application/json' },
//       });
//     }
//   } catch (err: any) {
//     console.error('Search route error', err);
//     return new Response(JSON.stringify({ error: err?.message || String(err) }), { status: 500 });
//   }
// }
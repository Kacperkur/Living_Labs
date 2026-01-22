import { Pinecone } from '@pinecone-database/pinecone';
import { getAdmin } from '../../../firebase-config';
import { NextResponse } from 'next/server';
import { Timestamp, Firestore } from 'firebase-admin/firestore';
import { 
  SearchRequest, 
  SearchResponse, 
  EnrichedMedia, 
  EnrichmentResult,
  PineconeMetadata 
} from '../../../types';

const apiKey = process.env.PINECONE_API_KEY;
if (!apiKey) console.warn("⚠️ Missing PINECONE_API_KEY environment variable");

const pc = new Pinecone({ apiKey: apiKey as string });
const index = pc.index("livinglabsdemo").namespace("media");
let db: Firestore | null = null;

/**
 * Enhanced search route that combines Pinecone semantic search with Firebase enrichment.
 * Only searches the 'media' collection in Firestore.
 * 
 * POST body:
 * {
 *   "query": "search text",
 *   "topK": 5 // optional, defaults to 5
 * }
 * 
 * Returns:
 * {
 *   "results": [
 *     {
 *       "id": "doc1",
 *       "score": 0.95,
 *       "title": "Document Title",
 *       "author": "Author Name", 
 *       "content_url": "https://firebasestorage.googleapis.com/...",
 *       "lab_id": "lab123",
 *       "collection": "media",
 *       "pineconeMetadata": { original pinecone hit metadata }
 *     }
 *   ],
 *   "pineconeResults": { raw pinecone response },
 *   "notFound": ["id2"], // IDs from Pinecone not found in Firebase
 *   "count": 1
 * }
 */

// Helper: search Firebase by document IDs - simplified for media collection only
async function enrichWithFirestore(mediaIds: string[]): Promise<EnrichmentResult> {
  try {
    const ids = Array.from(new Set(mediaIds.filter(Boolean))) as string[];
    if (ids.length === 0) return { enriched: [], notFound: [] };

    const enriched: EnrichedMedia[] = [];
    
    // Only search the 'media' collection
    const mediaCollection = db.collection('media');
    const foundIds = new Set<string>();

    // Chunk IDs for efficient batching
    const chunkArray = <T,>(arr: T[], size = 10) => {
      const chunks: T[][] = [];
      for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
      }
      return chunks;
    };

    for (const idChunk of chunkArray(ids)) {
      try {
        const docPromises = idChunk.map(id => mediaCollection.doc(id).get());
        const snapshots = await Promise.all(docPromises);
        
        snapshots.forEach((snap, index) => {
          if (snap.exists) {
            const docId = idChunk[index];
            const data = snap.data();
            foundIds.add(docId);
            
            enriched.push({
              id: docId,
              title: extractTitle(data),
              author: extractAuthor(data),
              content_url: extractContentUrl(data),
              lab_id: extractLabId(data),
              lab_name: extractLabName(data),
              published: data.published || null
            });
          }
        });
      } catch (error) {
        console.warn(`Error fetching media documents:`, error);
      }
    }

    const notFound = ids.filter(id => !foundIds.has(id));
    return { enriched, notFound };
    
  } catch (error) {
    console.error('Error enriching with Firestore:', error);
    throw error;
  }
}

// Helper: extract title from document data
function extractTitle(data: Record<string, unknown> | undefined): string | null {
  if (!data) return null;
  
  return (
    data.title ||
    data.name ||
    data.Title ||
    data.Name ||
    data.metadata?.title ||
    data.metadata?.name ||
    data.fields?.title ||
    data.fields?.name ||
    data.content?.title ||
    null
  );
}

// Helper: extract author from document data
function extractAuthor(data: Record<string, unknown> | undefined): string | null {
  if (!data) return null;
  
  const author = (
    data.author ||
    data.authors ||
    data.Author ||
    data.Authors ||
    data.creator ||
    data.Creator ||
    data.metadata?.author ||
    data.metadata?.authors ||
    data.metadata?.creator ||
    data.fields?.author ||
    data.fields?.authors ||
    data.content?.author ||
    data.content?.authors ||
    null
  );
  
  if (Array.isArray(author)) {
    return author.join(', ');
  }
  
  return typeof author === 'string' ? author : null;
}

// Helper: extract content_url from document data
function extractContentUrl(data: Record<string, unknown> | undefined): string | null {
  if (!data) return null;
  
  return (
    data.content_url ||
    data.contentUrl ||
    data.content_URL ||
    data.url ||
    data.mediaUrl ||
    data.media_url ||
    data.fileUrl ||
    data.file_url ||
    data.downloadUrl ||
    data.download_url ||
    data.metadata?.content_url ||
    data.metadata?.url ||
    data.fields?.content_url ||
    data.fields?.url ||
    null
  );
}

// Helper: extract lab_id from document data (handles Firestore references)
function extractLabId(data: Record<string, unknown> | undefined): string | null {
  if (!data) return null;
  
  const labRef = (
    data.lab_id ||
    data.labId ||
    data.lab ||
    data.Lab ||
    data.metadata?.lab_id ||
    data.metadata?.labId ||
    data.fields?.lab_id ||
    data.fields?.labId ||
    null
  );
  
  // Handle Firestore reference
  if (labRef && typeof labRef === 'object' && labRef.id) {
    return labRef.id;
  }
  
  // Handle string ID
  return typeof labRef === 'string' ? labRef : null;
}

// Helper: extract lab_name directly from document data
function extractLabName(data: Record<string, unknown> | undefined): string | null {
  if (!data) return null;
  
  return (
    data.lab_name ||
    data.labName ||
    data.name ||
    data.title ||
    data.displayName ||
    data.Name ||
    data.metadata?.lab_name ||
    data.metadata?.labName ||
    data.metadata?.name ||
    data.metadata?.title ||
    data.fields?.lab_name ||
    data.fields?.labName ||
    data.fields?.name ||
    data.fields?.title ||
    null
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as SearchRequest;
    const { query: queryText, topK = 5 } = body;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Server missing Pinecone configuration" },
        { status: 500 }
      );
    }

    if (!queryText || !queryText.trim()) {
      return NextResponse.json(
        { error: "Missing search query" },
        { status: 400 }
      );
    }

    console.log(`🔍 Enhanced search (media only): "${queryText}" (topK: ${topK})`);

    // 1. Pinecone semantic search
    const pineconeRes = await index.searchRecords({
      query: {
        topK,
        inputs: { text: queryText }
      },
      fields: ['title', 'author', 'content_url'] // include metadata fields your index stores
    });

    const hits = pineconeRes?.result?.hits ?? [];

    function extractRecordIdFromHit(h: Record<string, unknown>): string | null {
      if (!h) return null;
      if (h.record && typeof h.record.id === 'string' && h.record.id) return h.record.id;
      if (typeof h.id === 'string' && h.id) return h.id;
      if (typeof h._id === 'string' && h._id) return h._id;
      if (h.metadata && (h.metadata.id || h.metadata.media_id || h.metadata.documentId)) return (h.metadata.id || h.metadata.media_id || h.metadata.documentId);
      if (h.record && h.record.metadata && (h.record.metadata.id || h.record.metadata.media_id)) return (h.record.metadata.id || h.record.metadata.media_id);
      return null;
    }

    const mediaIds = Array.from(new Set(hits.map(extractRecordIdFromHit).filter(Boolean))) as string[];

    console.log(`📍 Pinecone found ${hits.length} hits`);
    console.log('📍 Extracted mediaIds:', mediaIds);

    const hitsMissingId = hits.filter((h: Record<string, unknown>) => !extractRecordIdFromHit(h));
    if (hitsMissingId.length > 0) {
      console.warn('Some Pinecone hits are missing an extractable record ID:', hitsMissingId.slice(0,5));
    }

    // 2. Enrich with Firestore data from media collection only
    if (!db) {
      const admin = await getAdmin();
      db = admin.firestore();
    }
    const { enriched, notFound } = await enrichWithFirestore(mediaIds);

    console.log(`🔥 Firebase enriched ${enriched.length} documents, ${notFound.length} not found`);

    // 3. Combine Pinecone scores/metadata with Firebase document data
    const results = hits.map((hit: Record<string, unknown>) => {
      const hitId = hit._id;
      const firestoreData = enriched.find(doc => doc.id === hitId);
      
      if (firestoreData) {
        return {
          id: hitId,
          score: hit.score || hit._score || null,
          title: firestoreData.title,
          author: firestoreData.author,
          content_url: firestoreData.content_url,
          lab_id: firestoreData.lab_id,
          lab_name: firestoreData.lab_name,
          published: firestoreData.published ? firestoreData.published.toDate().toISOString() : null,
          collection: 'media', // Always media collection
          pineconeMetadata: hit.metadata || hit.record?.metadata || null
        };
      } else {
        // Pinecone hit but no Firestore document found
        return {
          id: hitId,
          score: hit.score || hit._score || null,
          title: hit.metadata?.title || hit.record?.metadata?.title || null,
          author: hit.metadata?.author || hit.record?.metadata?.author || null,
          content_url: hit.metadata?.content_url || hit.record?.metadata?.content_url || null,
          lab_id: hit.metadata?.lab_id || hit.record?.metadata?.lab_id || null,
          lab_name: hit.metadata?.lab_name || hit.record?.metadata?.lab_name || null,
          published: hit.metadata?.published || hit.record?.metadata?.published || null,
          collection: 'media',
          pineconeMetadata: hit.metadata || hit.record?.metadata || null
        };
      }
    });

    const response: SearchResponse = {
      results,
      notFound,
      count: results.length,
      pineconeResults: pineconeRes
    };
    
    return NextResponse.json(response);

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Search failed";
    console.error("❌ Enhanced Search API Error:", error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
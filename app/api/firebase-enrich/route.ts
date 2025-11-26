import admin from '../../../firebase-config';
import { NextResponse } from 'next/server';

const db = admin.firestore();

/**
 * Firebase API route that takes Pinecone search result IDs and enriches them 
 * with Firestore document data, returning title, author, and full document.
 * 
 * Expected POST body:
 * {
 *   "mediaIds": ["doc1", "doc2", "doc3"],
 *   "collections": ["projects", "media"] // optional, defaults to searching all collections
 * }
 * 
 * Returns:
 * {
 *   "results": [
 *     {
 *       "id": "doc1",
 *       "collection": "projects", 
 *       "title": "Document Title",
 *       "author": "Author Name",
 *       "document": { full firestore document data },
 *       "path": "projects/doc1"
 *     }
 *   ],
 *   "notFound": ["doc2"], // IDs that weren't found in any collection
 *   "count": 1
 * }
 */

// Helper: search for documents by IDs across specified collections or all collections
async function queryFirestoreByIds(mediaIds: string[], collectionsToSearch?: string[]) {
  try {
    const ids = Array.from(new Set(mediaIds.filter(Boolean))) as string[];
    if (ids.length === 0) return { results: [], notFound: [] };

    const results: Array<{
      id: string;
      collection: string;
      title: string | null;
      author: string | null;
      document: any;
      path: string;
    }> = [];
    
    let collections;
    if (collectionsToSearch && collectionsToSearch.length > 0) {
      collections = collectionsToSearch.map(name => db.collection(name));
    } else {
      // Search all collections
      collections = await db.listCollections();
    }

    // Track which IDs we found
    const foundIds = new Set<string>();

    // Chunk IDs to avoid huge batch requests
    const chunkArray = <T,>(arr: T[], size = 10) => {
      const chunks: T[][] = [];
      for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
      }
      return chunks;
    };

    for (const collection of collections) {
      try {
        for (const idChunk of chunkArray(ids)) {
          // Fetch documents in parallel for this chunk
          const docPromises = idChunk.map(id => collection.doc(id).get());
          const snapshots = await Promise.all(docPromises);
          
          snapshots.forEach((snap, index) => {
            if (snap.exists) {
              const docId = idChunk[index];
              const data = snap.data();
              foundIds.add(docId);
              
              // Extract title and author from common field patterns
              const title = extractTitle(data);
              const author = extractAuthor(data);
              
              results.push({
                id: docId,
                collection: typeof collection.id === 'string' ? collection.id : collection.path.split('/')[0],
                title,
                author,
                document: data,
                path: snap.ref.path
              });
            }
          });
        }
      } catch (collectionError) {
        console.warn(`Error searching collection ${collection.path}:`, collectionError);
        // Continue with other collections
      }
    }

    // Find IDs that weren't found in any collection
    const notFound = ids.filter(id => !foundIds.has(id));

    return { results, notFound };
    
  } catch (error) {
    console.error('Error querying Firestore by IDs:', error);
    throw error;
  }
}

// Helper: extract title from document data using common patterns
function extractTitle(data: any): string | null {
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

// Helper: extract author from document data using common patterns  
function extractAuthor(data: any): string | null {
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
  
  // Handle arrays by joining with commas
  if (Array.isArray(author)) {
    return author.join(', ');
  }
  
  return typeof author === 'string' ? author : null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { mediaIds, collections } = body;

    // Validation
    if (!mediaIds || !Array.isArray(mediaIds)) {
      return NextResponse.json(
        { error: 'mediaIds must be an array of document IDs' },
        { status: 400 }
      );
    }

    if (mediaIds.length === 0) {
      return NextResponse.json({
        results: [],
        notFound: [],
        count: 0
      });
    }

    // Query Firestore for the documents
    const { results, notFound } = await queryFirestoreByIds(mediaIds, collections);

    console.log(`🔥 Firebase enrichment: ${results.length} found, ${notFound.length} not found`);

    return NextResponse.json({
      results,
      notFound,
      count: results.length
    });

  } catch (error: any) {
    console.error('❌ Firebase enrichment API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
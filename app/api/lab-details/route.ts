import { Pinecone } from '@pinecone-database/pinecone';
import { NextResponse } from 'next/server';
import { Firestore } from 'firebase-admin/firestore';

const apiKey = process.env.PINECONE_API_KEY;
const pc = new Pinecone({ apiKey: apiKey as string });
const labsIndex = pc.index("livinglabsdemo").namespace("labs");
const mediaIndex = pc.index("livinglabsdemo").namespace("media");

// eslint-disable-next-line @typescript-eslint/no-require-imports
const adminModule = require('../../../firebase-config');
const db: Firestore = adminModule.firestore();

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LabDetailsResponse {
  id: string;
  name: string | null;
  location: string | null;   // from Pinecone metadata (city/area)
  building: string | null;   // from Firestore Location field (used for building images)
  start_date: string | null;
  end_date: string | null;
  biography: string | null;
  SDGs: unknown[];
  members: { name: string; profile_picture_url: string | null }[];
}

// ─── Cache ────────────────────────────────────────────────────────────────────
// Lab details don't change often — 5 minutes is a safe TTL.

interface CacheEntry { data: LabDetailsResponse; expiresAt: number; }
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60_000;

function getCached(id: string): LabDetailsResponse | null {
  const entry = cache.get(id);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { cache.delete(id); return null; }
  return entry.data;
}

function setCache(id: string, data: LabDetailsResponse): void {
  if (cache.size >= 500) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(id, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const labId = searchParams.get('id');

    if (!labId) {
      return NextResponse.json({ error: "Missing 'id' query param" }, { status: 400 });
    }

    const cached = getCached(labId);
    if (cached) {
      console.log(`⚡ Cache hit: lab-details ${labId}`);
      return NextResponse.json(cached);
    }

    // Fetch Pinecone metadata and Firestore document in parallel — single round-trip each
    const [pineconeRes, firestoreSnap] = await Promise.all([
      labsIndex.fetch([labId]).catch(() => null),
      db.collection('labs').doc(labId).get().catch(() => null),
    ]);

    // Pinecone: prefer labs namespace, fall back to media namespace
    let pineconeRecord = pineconeRes?.records?.[labId] ?? null;
    if (!pineconeRecord) {
      const fallback = await mediaIndex.fetch([labId]).catch(() => null);
      pineconeRecord = fallback?.records?.[labId] ?? null;
    }

    const pm = (pineconeRecord?.metadata ?? {}) as Record<string, unknown>;
    const fs = firestoreSnap?.exists ? firestoreSnap.data()! : null;

    if (!pineconeRecord && !fs) {
      return NextResponse.json({ error: 'Lab not found', labId }, { status: 404 });
    }

    // Normalize members array from Firestore
    const rawMembers: unknown[] = Array.isArray(fs?.Members) ? fs!.Members : [];
    const members = rawMembers.map((m: unknown) => {
      if (typeof m === 'string') return { name: m, profile_picture_url: null };
      const obj = m as Record<string, unknown>;
      return {
        name: (obj.name ?? obj.display_name ?? obj.email ?? 'Unknown') as string,
        profile_picture_url: (obj.profile_picture_url ?? obj.photoURL ?? obj.photo_url ?? null) as string | null,
      };
    });

    const result: LabDetailsResponse = {
      id: labId,
      // Prefer Pinecone for semantic content, Firestore as fallback
      name: (pm.name ?? fs?.name ?? null) as string | null,
      location: (pm.location ?? fs?.location ?? null) as string | null,
      building: (fs?.Location ?? null) as string | null,  // capital-L field = building name
      start_date: (pm.start_date ?? fs?.start_date ?? null) as string | null,
      end_date: (pm.end_date ?? fs?.end_date ?? null) as string | null,
      biography: (pm.biography ?? fs?.biography ?? null) as string | null,
      SDGs: Array.isArray(pm.SDGs) ? pm.SDGs : (Array.isArray(fs?.SDGs) ? fs!.SDGs : []),
      members,
    };

    setCache(labId, result);
    console.log(`✅ lab-details: ${labId} → name="${result.name}", ${members.length} members`);
    return NextResponse.json(result);

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch lab details';
    console.error('❌ lab-details error:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

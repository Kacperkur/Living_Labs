import { NextResponse } from 'next/server';
import { db } from '../../../lib/firebase-admin';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LabDetailsResponse {
  id: string;
  name: string | null;
  location: string | null;
  building: string | null;
  cover_photo_url: string | null;
  start_date: string | null;
  end_date: string | null;
  biography: string | null;
  SDGs: unknown[];
  members: { name: string; profile_picture_url: string | null }[];
}

// ─── Cache ────────────────────────────────────────────────────────────────────

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

export function clearLabCache(id: string): void {
  cache.delete(id);
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


    const snap = await db.collection('labs').doc(labId).get();

    if (!snap.exists) {
      return NextResponse.json({ error: 'Lab not found', labId }, { status: 404 });
    }

    const fs = snap.data()!;

    const toISO = (ts: any): string | null => {
      if (!ts) return null;
      if (typeof ts.toDate === 'function') return ts.toDate().toISOString();
      if (typeof ts === 'string') return ts;
      return null;
    };

    const rawMembers: unknown[] = Array.isArray(fs.Members) ? fs.Members : [];
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
      name: (fs.lab_name ?? fs.name ?? null) as string | null,
      location: (fs.Location ?? fs.location ?? null) as string | null,
      building: (fs.Location ?? null) as string | null,
      cover_photo_url: (fs.cover_photo_url ?? null) as string | null,
      start_date: toISO(fs.start_date),
      end_date: toISO(fs.end_date),
      biography: (fs.biography ?? null) as string | null,
      SDGs: Array.isArray(fs.SDGs) ? fs.SDGs : [],
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

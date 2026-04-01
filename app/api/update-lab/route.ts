import { NextResponse } from 'next/server';
import { db, storage } from '../../../lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { clearLabCache } from '../lab-details/route';

const ACCEPTED_IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

const MAX_COVER_SIZE = 10 * 1024 * 1024;

export async function PUT(req: Request) {
  try {
    const formData = await req.formData();

    const labId = (formData.get('lab_id') as string)?.trim();
    const labName = (formData.get('lab_name') as string)?.trim();
    const building = (formData.get('building') as string)?.trim();
    const bio = (formData.get('bio') as string)?.trim() || null;
    const startDateStr = formData.get('start_date') as string;
    const endDateStr = formData.get('end_date') as string;
    const sdgsJson = formData.get('sdgs') as string;
    const membersJson = formData.get('members') as string;
    const coverPhoto = formData.get('cover_photo') as File | null;
    const removeCover = formData.get('remove_cover') === 'true';

    if (!labId) return NextResponse.json({ error: 'lab_id is required' }, { status: 400 });
    if (!labName) return NextResponse.json({ error: 'Lab name is required' }, { status: 400 });
    if (!building) return NextResponse.json({ error: 'Building is required' }, { status: 400 });
    if (bio && bio.length > 500) return NextResponse.json({ error: 'Bio must be 500 characters or fewer' }, { status: 400 });

    let sdgs: { name: string }[] = [];
    try { sdgs = JSON.parse(sdgsJson || '[]'); } catch { sdgs = []; }

    let members: { name: string; profile_picture_url: string | null }[] = [];
    try { members = JSON.parse(membersJson || '[]'); } catch { members = []; }

    const toTimestamp = (s: string): Timestamp | null => {
      if (!s) return null;
      const d = new Date(s);
      return isNaN(d.getTime()) ? null : Timestamp.fromDate(d);
    };

    const update: Record<string, unknown> = {
      lab_name: labName,
      Location: building,
      biography: bio,
      start_date: toTimestamp(startDateStr),
      end_date: toTimestamp(endDateStr),
      SDGs: sdgs,
      Members: members,
    };

    // Handle cover photo
    if (coverPhoto && coverPhoto.size > 0) {
      const ext = ACCEPTED_IMAGE_TYPES[coverPhoto.type];
      if (ext && coverPhoto.size <= MAX_COVER_SIZE) {
        try {
          const buffer = Buffer.from(await coverPhoto.arrayBuffer());
          const storagePath = `labs/${labId}/cover.${ext}`;
          const bucket = storage.bucket();
          const file = bucket.file(storagePath);
          await file.save(buffer, {
            contentType: coverPhoto.type,
            metadata: { cacheControl: 'public, max-age=31536000' },
          });
          await file.makePublic();
          update.cover_photo_url = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;
        } catch (err) {
          console.error('⚠️ update-lab: cover photo upload failed:', err);
        }
      }
    } else if (removeCover) {
      update.cover_photo_url = null;
    }

    await db.collection('labs').doc(labId).update(update);
    clearLabCache(labId);
    console.log(`✅ update-lab: ${labId} "${labName}"`);
    return NextResponse.json({ ok: true });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to update lab';
    console.error('❌ update-lab error:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

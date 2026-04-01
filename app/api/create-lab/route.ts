import { NextResponse } from 'next/server';
import { db, storage } from '../../../lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

const ACCEPTED_IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

const MAX_COVER_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(req: Request) {
  let labId: string | null = null;

  try {
    const formData = await req.formData();

    const labName = (formData.get('lab_name') as string)?.trim();
    const building = (formData.get('building') as string)?.trim();
    const bio = (formData.get('bio') as string)?.trim() || null;
    const startDateStr = formData.get('start_date') as string;
    const sdgsJson = formData.get('sdgs') as string;
    const membersJson = formData.get('members') as string;
    const coverPhoto = formData.get('cover_photo') as File | null;

    if (!labName) return NextResponse.json({ error: 'Lab name is required' }, { status: 400 });
    if (!building) return NextResponse.json({ error: 'Building is required' }, { status: 400 });
    if (bio && bio.length > 500) return NextResponse.json({ error: 'Bio must be 500 characters or fewer' }, { status: 400 });

    let sdgs: { name: string }[] = [];
    try { sdgs = JSON.parse(sdgsJson || '[]'); } catch { sdgs = []; }

    let members: { name: string; profile_picture_url: string | null }[] = [];
    try { members = JSON.parse(membersJson || '[]'); } catch { members = []; }
    if (members.length === 0) members = [{ name: 'Unknown', profile_picture_url: null }];

    let startDate: Timestamp | null = null;
    if (startDateStr) {
      const d = new Date(startDateStr);
      if (!isNaN(d.getTime())) startDate = Timestamp.fromDate(d);
    }

    // Create the lab document first to get its ID
    const docRef = await db.collection('labs').add({
      lab_name: labName,
      Location: building,
      biography: bio,
      start_date: startDate,
      end_date: null,
      SDGs: sdgs,
      Members: members,
      cover_photo_url: null,
    });

    labId = docRef.id;

    // Upload cover photo if provided
    let coverPhotoUrl: string | null = null;
    if (coverPhoto && coverPhoto.size > 0) {
      const ext = ACCEPTED_IMAGE_TYPES[coverPhoto.type];
      if (!ext) {
        console.warn(`⚠️ create-lab: unsupported cover photo type ${coverPhoto.type} — skipped`);
      } else if (coverPhoto.size > MAX_COVER_SIZE) {
        console.warn(`⚠️ create-lab: cover photo exceeds 10 MB — skipped`);
      } else {
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
          coverPhotoUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;
          await docRef.update({ cover_photo_url: coverPhotoUrl });
        } catch (storageErr) {
          // Cover photo failed but the lab doc exists — return success with null cover
          console.error('⚠️ create-lab: cover photo upload failed (lab created without cover):', storageErr);
        }
      }
    }

    console.log(`✅ create-lab: created ${labId} "${labName}"`);
    return NextResponse.json({ id: labId, cover_photo_url: coverPhotoUrl });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to create lab';
    console.error('❌ create-lab error:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

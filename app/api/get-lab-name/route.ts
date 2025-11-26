import admin from '../../../firebase-config';
import { NextResponse } from 'next/server';

const db = admin.firestore();

/**
 * API route to get lab name by lab_id reference
 * 
 * POST body:
 * {
 *   "lab_id": "lab_document_id"
 * }
 * 
 * Returns:
 * {
 *   "labName": "Living Lab Name",
 *   "labId": "lab_document_id"
 * }
 */

export async function POST(req: Request) {
  try {
    const { lab_id } = await req.json();

    if (!lab_id || typeof lab_id !== 'string') {
      return NextResponse.json(
        { error: 'lab_id must be a valid string' },
        { status: 400 }
      );
    }

    // Query the labs collection for the document
    const labDoc = await db.collection('labs').doc(lab_id).get();

    if (!labDoc.exists) {
      console.warn(`Lab document not found: ${lab_id}`);
      return NextResponse.json(
        { labName: null, labId: lab_id },
        { status: 200 }
      );
    }

    const labData = labDoc.data();
    
    // Extract lab name from various possible field patterns
    const labName = extractLabName(labData);

    console.log(`🏢 Found lab: ${labName} (ID: ${lab_id})`);

    return NextResponse.json({
      labName,
      labId: lab_id
    });

  } catch (error: any) {
    console.error('❌ Get lab name API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper: extract lab name from document data
function extractLabName(data: any): string | null {
  if (!data) return null;
  
  return (
    data.name ||
    data.lab_name ||
    data.labName ||
    data.title ||
    data.displayName ||
    data.Name ||
    data.metadata?.name ||
    data.metadata?.lab_name ||
    data.metadata?.title ||
    data.fields?.name ||
    data.fields?.lab_name ||
    data.fields?.title ||
    null
  );
}
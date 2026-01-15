import { Pinecone } from '@pinecone-database/pinecone';
import { NextResponse } from 'next/server';

const apiKey = process.env.PINECONE_API_KEY;
if (!apiKey) console.warn("⚠️ Missing PINECONE_API_KEY environment variable");

const pc = new Pinecone({ apiKey: apiKey as string });
const labsIndex = pc.index("livinglabsdemo").namespace("labs");
const mediaIndex = pc.index("livinglabsdemo").namespace("media");

/**
 * Fetch lab information by ID from Pinecone for displaying on lab cards
 * 
 * GET query params:
 * - id: The lab ID to fetch
 * 
 * Returns:
 * {
 *   "id": "lab123",
 *   "name": "Lab Name",
 *   "location": "City, Country",
 *   "start_date": "2020-01-01T00:00:00.000Z",
 *   "end_date": "2025-12-31T00:00:00.000Z",
 *   "biography": "Lab description...",
 *   "SDGs": ["SDG 1", "SDG 3", "SDG 11"]
 * }
 */

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const labId = searchParams.get('id');
    
    if (!labId || !labId.trim()) {
      return NextResponse.json(
        { error: "Missing lab ID parameter" },
        { status: 400 }
      );
    }
    
    if (!apiKey) {
      return NextResponse.json(
        { error: "Server missing Pinecone configuration" },
        { status: 500 }
      );
    }
    
    console.log(`🔍 Fetching lab info for ID: ${labId}`);
    
    // Try labs namespace first
    let response = await labsIndex.fetch([labId]);
    
    // If not found in labs namespace, try media namespace
    if (!response || !response.records || !response.records[labId]) {
      console.log(`📍 Not found in labs namespace, trying media namespace...`);
      response = await mediaIndex.fetch([labId]);
    }
    
    if (!response || !response.records || !response.records[labId]) {
      console.log(`❌ Lab ID ${labId} not found in either namespace`);
      return NextResponse.json(
        { error: "Lab not found", labId },
        { status: 404 }
      );
    }
    
    const record = response.records[labId];
    const metadata = record.metadata || {};
    
    // Extract lab information from Pinecone metadata
    const labInfo = {
      id: labId,
      name: metadata.name || null,
      location: metadata.location || null,
      start_date: metadata.start_date || null,
      end_date: metadata.end_date || null,
      biography: metadata.biography || null,
      SDGs: Array.isArray(metadata.SDGs) ? metadata.SDGs : []
    };
    
    console.log(`✅ Lab info fetched successfully from Pinecone:`, labInfo);
    
    return NextResponse.json(labInfo);
    
  } catch (error: any) {
    console.error("❌ Fetch Lab Info API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch lab info" },
      { status: 500 }
    );
  }
}

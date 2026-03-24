/**
 * Domain Models for Living Labs Application
 * 
 * These types provide compile-time safety and documentation for data structures
 * used throughout the application. They replace generic 'any' types with
 * explicit domain models.
 */

import { Timestamp } from 'firebase-admin/firestore';

// ============================================================================
// Core Domain Models
// ============================================================================

/**
 * Represents a media item (paper, article, presentation, etc.) from a Living Lab
 */
export interface Media {
  id: string;
  title: string;
  author: string | null;
  authors?: string[] | string; // Legacy: some data has authors array
  content_url: string | null;
  lab_id: string | null;
  lab_name: string | null;
  published: Date | Timestamp | string | null;
  collection?: 'media'; // Collection name for routing
  score?: number; // Relevance score from search
}

/**
 * Represents a Living Lab organization
 */
export interface Lab {
  id: string;
  name: string | null;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  biography: string | null;
  SDGs: SDG[];
}

/**
 * Sustainable Development Goal
 */
export interface SDG {
  content_url?: string;
  name?: string;
}

/**
 * Search result that combines Media data with search metadata
 */
export interface SearchResult extends Media {
  score: number; // Relevance score (required for search results)
  pineconeMetadata?: PineconeMetadata; // Original metadata from vector search
  previewUrl?: string | null; // For UI display
  
  // Legacy fields for backwards compatibility
  metadata?: Partial<Media> & Partial<Lab>; // Support both Media and Lab metadata
  fields?: Partial<Media>;
}

/**
 * Metadata from Pinecone vector database
 */
export interface PineconeMetadata {
  title?: string;
  author?: string;
  content_url?: string;
  lab_id?: string;
  lab_name?: string;
  published?: string;
  [key: string]: unknown; // Allow additional fields
}

// ============================================================================
// API Request/Response Types
// ============================================================================

/**
 * Request body for search API
 */
export interface SearchRequest {
  query: string;
  topK?: number;      // Page size — number of results per page (default: 20)
  minScore?: number;  // Similarity threshold — results below this score are dropped (default: 0.65)
  offset?: number;    // Pagination offset (default: 0)
}

/**
 * Response from search-enhanced API
 */
export interface SearchResponse {
  results: SearchResult[];
  count: number;
  hasMore?: boolean;  // True if more results exist beyond this page
  notFound?: string[]; // IDs from Pinecone not found in Firebase
  pineconeResults?: unknown; // Raw Pinecone response for debugging
}

/**
 * Response from fetch-lab-info API
 */
export interface LabInfoResponse extends Lab {
  // Extends Lab with no additional fields
}

/**
 * Generic API error response
 */
export interface ApiErrorResponse {
  error: string;
  details?: string;
  [key: string]: unknown;
}

// ============================================================================
// Component Props Types
// ============================================================================

/**
 * Props for SearchBar component
 */
export interface SearchBarProps {
  onResults?: (matches: SearchResult[], query: string, hasMore: boolean) => void;
  onLoadingChange?: (loading: boolean) => void;
}

/**
 * Ref handle exposed by SearchBar
 */
export interface SearchBarHandle {
  triggerSearch: (query: string) => void;
}

/**
 * Props for ResultPanel component
 */
export interface ResultPanelProps {
  result: SearchResult;
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
}

/**
 * Props for MediaDetailPanel component
 */
export interface MediaDetailPanelProps {
  selectedMedia: SearchResult | null;
  onClose: () => void;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Enriched media document from Firebase
 */
export interface EnrichedMedia {
  id: string;
  title: string | null;
  author: string | null;
  content_url: string | null;
  lab_id: string | null;
  lab_name: string | null;
  published: Timestamp | null;
}

/**
 * Result of Firebase enrichment operation
 */
export interface EnrichmentResult {
  enriched: EnrichedMedia[];
  notFound: string[];
}

/**
 * Pinecone query match
 */
export interface PineconeMatch {
  id: string;
  score: number;
  metadata?: PineconeMetadata;
}

/**
 * Pinecone query response
 */
export interface PineconeQueryResponse {
  matches: PineconeMatch[];
  namespace?: string;
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if a value is a valid Media object
 */
export function isMedia(value: unknown): value is Media {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof (value as Media).id === 'string'
  );
}

/**
 * Type guard to check if a value is a valid SearchResult
 */
export function isSearchResult(value: unknown): value is SearchResult {
  return (
    isMedia(value) &&
    'score' in value &&
    typeof (value as SearchResult).score === 'number'
  );
}

/**
 * Type guard to check if a value is a valid Lab
 */
export function isLab(value: unknown): value is Lab {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof (value as Lab).id === 'string' &&
    'SDGs' in value &&
    Array.isArray((value as Lab).SDGs)
  );
}

// ============================================================================
// Type Conversion Utilities
// ============================================================================

/**
 * Convert unknown API response to typed SearchResponse
 * Validates structure and provides defaults for missing fields
 */
export function toSearchResponse(data: unknown): SearchResponse {
  if (typeof data !== 'object' || data === null) {
    throw new Error('Invalid search response: not an object');
  }

  const response = data as Record<string, unknown>;

  if (!Array.isArray(response.results)) {
    throw new Error('Invalid search response: results must be an array');
  }

  return {
    results: response.results.filter(isSearchResult),
    count: typeof response.count === 'number' ? response.count : response.results.length,
    hasMore: typeof response.hasMore === 'boolean' ? response.hasMore : false,
    notFound: Array.isArray(response.notFound) ? response.notFound : [],
    pineconeResults: response.pineconeResults,
  };
}

/**
 * Convert unknown API response to typed Lab
 */
export function toLabInfo(data: unknown): Lab {
  if (!isLab(data)) {
    throw new Error('Invalid lab info response');
  }
  return data;
}

/**
 * Safely extract date from various date formats
 */
export function extractDate(value: unknown): Date | null {
  if (!value) return null;
  
  if (value instanceof Date) return value;
  
  if (typeof value === 'string') {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }
  
  // Handle Firebase Timestamp
  if (typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    return value.toDate() as Date;
  }
  
  return null;
}

/**
 * Format date as "Month Day, Year"
 */
export function formatDate(date: Date | Timestamp | string | null): string | null {
  const dateObj = extractDate(date);
  if (!dateObj) return null;
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const month = monthNames[dateObj.getMonth()];
  const day = dateObj.getDate();
  const year = dateObj.getFullYear();
  
  return `${month} ${day}, ${year}`;
}

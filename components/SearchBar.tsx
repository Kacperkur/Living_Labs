"use client";

import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { SearchBarProps, SearchBarHandle, SearchResult, SearchResponse, toSearchResponse } from '../types';

const SearchBar = forwardRef<SearchBarHandle, SearchBarProps>(({ onResults, onLoadingChange }, ref) => {
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateLoading(val: boolean) {
    setLoading(val);
    onLoadingChange?.(val);
  }

  async function doSearch(q: string): Promise<void> {
  updateLoading(true);
  setError(null);
    try {
      // Use the enhanced search route that combines Pinecone + Firebase
      const res = await fetch('/api/search-enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(payload?.error || `Server returned ${res.status}`);
      }

      const rawData = await res.json();
      const data: SearchResponse = toSearchResponse(rawData);

      // Helper function to deeply clean any object of Firestore references
      function cleanFirestoreRefs(obj: unknown): unknown {
        if (obj === null || obj === undefined) return obj;
        if (typeof obj !== 'object') return obj;
        if (Array.isArray(obj)) return obj.map(cleanFirestoreRefs);
        
        // If this looks like a Firestore reference, return null
        const objRecord = obj as Record<string, unknown>;
        if (objRecord._firestore || objRecord._path || objRecord._converter) {
          console.warn('Removed Firestore reference:', obj);
          return null;
        }
        
        // Clean all properties recursively
        const cleaned: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(objRecord)) {
          cleaned[key] = cleanFirestoreRefs(value);
        }
        return cleaned;
      }

      // The enhanced route returns simplified results with title, author, content_url, and lab_id
      let matches: SearchResult[] = [];
      if (Array.isArray(data.results)) {
        // Transform enhanced results to match ResultPanel expectations
        matches = data.results.map((result: SearchResult): SearchResult => {
          const cleanResult: SearchResult = {
            id: result.id,
            title: result.title,
            author: result.author,
            content_url: result.content_url,
            lab_id: result.lab_id,
            lab_name: result.lab_name,
            published: result.published,
            collection: result.collection || 'media',
            score: result.score,
            // For ResultPanel compatibility
            metadata: {
              title: result.title,
              author: result.author,
              content_url: result.content_url,
              lab_id: result.lab_id,
              lab_name: result.lab_name,
              published: result.published
            },
            fields: {
              title: result.title,
              author: result.author,
              content_url: result.content_url,
              lab_id: result.lab_id,
              lab_name: result.lab_name,
              published: result.published
            },
            previewUrl: result.content_url, // Use content_url as preview URL
            pineconeMetadata: result.pineconeMetadata
          };
          
          // Final clean pass to remove any remaining Firestore references
          return cleanFirestoreRefs(cleanResult) as SearchResult;
        });
      } else {
        // Fallback for other response formats
        matches = Array.isArray(rawData) 
          ? (rawData as SearchResult[]).map(item => cleanFirestoreRefs(item) as SearchResult)
          : [cleanFirestoreRefs(rawData) as SearchResult];
      }

      console.log(`🔍 Search completed: ${matches.length} results for "${q}"`, matches);

      // Filter out any invalid results before passing to UI
      const validMatches = matches.filter((match): match is SearchResult =>
        match !== null &&
        typeof match === 'object' &&
        !Array.isArray(match) &&
        'id' in match &&
        typeof match.id === 'string' &&
        match.id.length > 0
      );

      if (validMatches.length !== matches.length) {
        console.warn(`⚠️ Filtered out ${matches.length - validMatches.length} invalid results`);
      }

      if (onResults) onResults(validMatches, q, data.hasMore ?? false);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
    } finally {
      updateLoading(false);
    }
  }

  // Expose triggerSearch method via ref
  useImperativeHandle(ref, () => ({
    triggerSearch: (query: string) => {
      setValue(query);
      doSearch(query);
    }
  }));

  return (
    <div className="search-bar-container">
      <div className="search-bar-input-group">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const q = value.trim();
              if (!q) return;
              doSearch(q);
            }
          }}
          placeholder="Search..."
          className="search-bar-input"
        />
        <button
          type="button"
          disabled={loading}
          onClick={() => {
            const q = value.trim();
            if (!q) return;
            doSearch(q);
          }}
          className="search-bar-icon"
          style={{ background: 'none', border: 'none', padding: 0, cursor: loading ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          aria-label="Search"
        >
          {loading ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.75s linear infinite' }}>
              <circle cx="12" cy="12" r="10" stroke="#75B2DD" strokeWidth="3" strokeDasharray="31.4 31.4" strokeLinecap="round" />
            </svg>
          ) : (
            <img src="/loupe.png" alt="Search" style={{ width: '100%', height: '100%', display: 'block' }} />
          )}
        </button>
      </div>

      {error && <div className="mt-2 text-red-600">Error: {error}</div>}
    </div>
  );
});

SearchBar.displayName = 'SearchBar';

export default SearchBar;
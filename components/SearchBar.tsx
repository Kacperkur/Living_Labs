"use client";

import React, { useState } from 'react';

export default function SearchBar({ onResults }: { onResults?: (matches: any[]) => void }) {
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function doSearch(q: string) {
  setLoading(true);
  setError(null);
    try {
      // Use the enhanced search route that combines Pinecone + Firebase
      const res = await fetch('/api/search-enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, topK: 5 }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.error || `Server returned ${res.status}`);
      }

      const data = await res.json();

      // Helper function to deeply clean any object of Firestore references
      function cleanFirestoreRefs(obj: any): any {
        if (obj === null || obj === undefined) return obj;
        if (typeof obj !== 'object') return obj;
        if (Array.isArray(obj)) return obj.map(cleanFirestoreRefs);
        
        // If this looks like a Firestore reference, return null
        if (obj._firestore || obj._path || obj._converter) {
          console.warn('Removed Firestore reference:', obj);
          return null;
        }
        
        // Clean all properties recursively
        const cleaned: any = {};
        for (const [key, value] of Object.entries(obj)) {
          cleaned[key] = cleanFirestoreRefs(value);
        }
        return cleaned;
      }

      // The enhanced route returns simplified results with title, author, content_url, and lab_id
      let matches: any[] = [];
      if (Array.isArray(data.results)) {
        // Transform enhanced results to match ResultPanel expectations
        matches = data.results.map((result: any) => {
          const cleanResult = {
            id: result.id,
            title: result.title,
            author: result.author,
            content_url: result.content_url,
            lab_id: result.lab_id,
            lab_name: result.lab_name,
            labName: result.lab_name,
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
          return cleanFirestoreRefs(cleanResult);
        });
      } else {
        // Fallback for other response formats
        matches = Array.isArray(data) ? data.map(cleanFirestoreRefs) : [cleanFirestoreRefs(data)];
      }

      console.log(`🔍 Search completed: ${matches.length} results for "${q}"`, matches);
      
      // Filter out any invalid results before passing to UI
      const validMatches = matches.filter(match => 
        match && 
        typeof match === 'object' && 
        !Array.isArray(match) &&
        (match.id || match.title) // Must have at least an ID or title
      );
      
      if (validMatches.length !== matches.length) {
        console.warn(`⚠️ Filtered out ${matches.length - validMatches.length} invalid results`);
      }
      
      if (onResults) onResults(validMatches);
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ width: '100%' }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px',
        backgroundColor: 'white',
        borderRadius: 16,
        boxShadow: '0 4px 6px 2px #0021474D',
        paddingRight: '12px'
      }}>
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
          style={{
            flex: 1,
            height: '4vh',
            fontFamily: 'Onest, serif',
            fontSize: 16,
            padding: '0 0 0 16px',
            border: 'none',
            outline: 'none',
            backgroundColor: 'transparent',
          }}
        />
        <img 
          src="/loupe.png" 
          alt="Search" 
          onClick={() => {
            const q = value.trim();
            if (!q) return;
            doSearch(q);
          }}
          style={{
            height: '32px',
            width: '20px',
            objectFit: 'contain',
            flexShrink: 0,
            cursor: 'pointer',
            opacity: 0.7,
            transition: 'all 0.2s',
            filter: 'none'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1';
            e.currentTarget.style.filter = 'brightness(0) saturate(100%) invert(76%) sepia(52%) saturate(452%) hue-rotate(357deg) brightness(98%) contrast(92%)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0.7';
            e.currentTarget.style.filter = 'none';
          }}
        />
      </div>

      <div style={{ marginTop: 8 }}>
        {loading && <div>Searching...</div>}
        {error && <div style={{ color: 'crimson' }}>Error: {error}</div>}
      </div>
    </div>
  );
}

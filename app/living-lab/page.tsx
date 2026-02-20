"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SearchBar from '@/components/SearchBar';
import ResultPanel from '@/components/ResultPanel';
import { SearchResult } from '@/types';

export default function LivingLabPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [labInfo, setLabInfo] = useState<any>(null);
  const [selectedLabId, setSelectedLabId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const transformLabToSearchResult = useCallback((lab: any): SearchResult => ({
    id: lab.id || '',
    title: lab.name || 'Unnamed Lab',
    author: lab.location || null,
    content_url: null,
    lab_id: lab.id || '',
    lab_name: lab.name || 'Unnamed Lab',
    published: lab.start_date || null,
    score: 1.0,
    authors: lab.location ? [lab.location] : [],
    collection: 'labs',
    metadata: {
      biography: lab.biography || '',
      end_date: lab.end_date || null,
      start_date: lab.start_date || null,
      SDGs: lab.SDGs || [],
      location: lab.location || ''
    }
  }), []);

  const transformMediaToSearchResult = useCallback((media: any, labId: string): SearchResult => ({
    id: media.id || '',
    title: media.title || 'Untitled Media',
    author: media.author || null,
    content_url: media.content_url || null,
    lab_id: labId,
    lab_name: media.lab_name || '',
    published: media.published || null,
    score: media.score || 1.0,
    authors: media.authors || [],
    collection: 'media',
    metadata: media.metadata || {}
  }), []);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchLabAndMedia = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const labId = searchParams.get('id');
        
        if (!labId) {
          setError('No lab ID provided');
          setResults([]);
          return;
        }

        // Fetch lab info
        const labResponse = await fetch(`/api/fetch-lab-info?id=${encodeURIComponent(labId)}`, {
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json' },
        });

        if (!labResponse.ok) {
          throw new Error('Failed to fetch lab information');
        }

        const labData = await labResponse.json();
        
        if (isMounted) {
          setLabInfo(labData);
        }

        // Fetch related media from media collection
        const mediaResponse = await fetch(`/api/fetch-media-by-lab?labId=${encodeURIComponent(labId)}`, {
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json' },
        });

        if (!mediaResponse.ok) {
          throw new Error('Failed to fetch lab media');
        }

        const mediaData = await mediaResponse.json();
        
        const mediaResults = Array.isArray(mediaData)
          ? mediaData.map((m: any) => transformMediaToSearchResult(m, labId))
          : [];

        if (isMounted) {
          setResults(mediaResults.length > 0 ? mediaResults : []);
          if (mediaResults.length === 0) {
            setError('No media found for this lab');
          }
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.log('Fetch aborted');
          return;
        }
        
        console.error('Failed to fetch lab data:', error);
        
        if (isMounted) {
          setError(error.message || 'An unexpected error occurred');
          setResults([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchLabAndMedia();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [searchParams, transformMediaToSearchResult]);

  const handleSearchResults = useCallback((matches: SearchResult[], query: string) => {
    router.push(`/?q=${encodeURIComponent(query)}`);
  }, [router]);

  const handleMediaSelect = useCallback((id: string | null) => {
    setSelectedLabId(id);
  }, []);

  const filteredResults = useMemo(() => 
    results?.filter((r) => r && typeof r === 'object') || [],
    [results]
  );

  return (
    <div className="h-screen overflow-hidden flex flex-col">
      <header className="header-container">
        {/* ...existing header code... */}
      </header>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          overflowX: 'hidden',
          position: 'relative'
        }}>
          {isLoading ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              fontFamily: 'Onest, sans-serif',
              fontSize: '18px',
              color: '#666'
            }}>
              Loading lab information...
            </div>
          ) : error ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              fontFamily: 'Onest, sans-serif',
              fontSize: '18px',
              color: '#d32f2f',
              gap: '8px'
            }}>
              <div>Error: {error}</div>
              <button 
                onClick={() => window.location.reload()}
                style={{
                  padding: '8px 16px',
                  background: 'var(--primary-clr-100)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Retry
              </button>
            </div>
          ) : (
            <div style={{ 
              width: '100%', 
              boxSizing: 'border-box', 
              padding: '24px',
              backgroundColor: 'var(--background-clr-400)'
            }}>
              {labInfo && (
                <div style={{ marginBottom: '24px' }}>
                  <h2 style={{ 
                    fontFamily: 'Quantico, sans-serif', 
                    color: 'var(--tertiary-clr-100)',
                    marginBottom: '8px'
                  }}>
                    {labInfo.name || 'Unnamed Lab'}
                  </h2>
                  <p style={{ 
                    fontFamily: 'Onest, sans-serif',
                    color: '#666',
                    marginBottom: '8px'
                  }}>
                    {labInfo.biography || ''}
                  </p>
                  <p style={{ 
                    fontFamily: 'Onest, sans-serif',
                    color: '#999',
                    fontSize: '14px'
                  }}>
                    Location: {labInfo.location || 'N/A'} | Start: {labInfo.start_date || 'N/A'}
                  </p>
                </div>
              )}
              
              <h2 style={{ 
                fontFamily: 'Quantico, sans-serif', 
                color: 'var(--tertiary-clr-100)',
                marginBottom: '16px'
              }}>
                Lab Work & Media
              </h2>
              
              {filteredResults.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {filteredResults.map((r, i) => {
                    const key = r.id || `result-${i}`;
                    return <ResultPanel key={key} result={r} selectedId={selectedLabId} onSelect={handleMediaSelect} />;
                  })}
                </div>
              ) : (
                <div style={{
                  fontFamily: 'Onest, sans-serif',
                  color: '#666'
                }}>
                  No media found for this lab
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
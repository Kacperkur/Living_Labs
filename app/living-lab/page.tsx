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
  const [selectedLabId, setSelectedLabId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize the transform function to prevent recreation
  const transformLabToSearchResult = useCallback((lab: any): SearchResult => ({
    id: lab.id || '',
    title: lab.name || 'Unnamed Lab',
    author: lab.location || null,
    content_url: null,
    lab_id: lab.id || '',
    lab_name: lab.name || 'Unnamed Lab',
    start_date: lab.start_date || null,
    end_date: lab.end_date || null,
    score: 1.0,
    authors: lab.location ? [lab.location] : [],
    collection: 'lab',
    metadata: {
      biography: lab.biography || '',
      end_date: lab.end_date || null,
      start_date: lab.start_date || null,
      SDGs: lab.SDGs || [],
      location: lab.location || ''
    }
  }), []);

  useEffect(() => {
    let isMounted = true; // Prevent state updates on unmounted component
    const controller = new AbortController(); // Enable request cancellation

    const fetchLabInfo = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const labId = searchParams.get('id');
        const url = labId 
          ? `/api/fetch-lab-info?id=${encodeURIComponent(labId)}` 
          : '/api/fetch-lab-info';
        
        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${response.status}: Failed to fetch lab info`);
        }

        const data = await response.json();
        
        // Validate data structure
        if (!data || (Array.isArray(data) && data.length === 0)) {
          if (isMounted) {
            setResults([]);
            setError('No lab information available');
          }
          return;
        }

        const resultsData = Array.isArray(data) 
          ? data.map(transformLabToSearchResult)
          : [transformLabToSearchResult(data)];
          
        if (isMounted) {
          setResults(resultsData);
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.log('Fetch aborted');
          return;
        }
        
        console.error('Failed to fetch lab info:', error);
        
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

    fetchLabInfo();

    // Cleanup function
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [searchParams, transformLabToSearchResult]);

  const handleSearchResults = useCallback((matches: SearchResult[], query: string) => {
    router.push(`/?q=${encodeURIComponent(query)}`);
  }, [router]);

  const handleMediaSelect = useCallback((id: string | null) => {
    setSelectedLabId(id);
  }, []);

  // Memoize filtered results to prevent unnecessary recalculations
  const filteredResults = useMemo(() => 
    results?.filter((r) => r && typeof r === 'object') || [],
    [results]
  );

  return (
    <div className="h-screen overflow-hidden flex flex-col">
      <header className="header-container">
        <div className="header-top-row">
          <div className="logo-section">
            <img className="header-logo" src="/logo.jpg" alt="Logo" />
            <h1 className="header-title">Living Labs</h1>
          </div>

          <div className="search-bar-wrapper">
            <SearchBar onResults={handleSearchResults} />
          </div>

          <div className="nav-links">
            <h2>Our Labs</h2>
            <h2>Join</h2>
          </div>
        </div>
      </header>

      <div style={{ 
        flex: 1, 
        display: 'flex',
        overflow: 'hidden'
      }}>
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
          ) : filteredResults.length > 0 ? (
            <div style={{ 
              width: '100%', 
              boxSizing: 'border-box', 
              padding: '24px',
              backgroundColor: 'var(--background-clr-400)'
            }}>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
               {filteredResults.map((r, i) => {
  const key = r.id || `result-${i}`;
  const location = r.metadata?.location;
  const labPhoto = `/lab_images/${location}.jpg`;
  const labName = r.lab_name;
  
  const description = r.metadata?.biography;

   
  return (
    <div
      key={key}
      style={{
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#fff",
        borderRadius: "8px",
        padding: "20px",
        gap: "16px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
      }}
    >
      {/* Top Horizontal Section */}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "top",
          gap: "20px"
        }}
      >
        {/* Lab Photo */}
        <img
          src={labPhoto}
          style={{
            width: '50%',
            height: 'auto',
            objectFit: "cover",
            borderRadius: "8px"
          }}
        />

        {/* Name + Location (Vertical Stack) */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "6px"
          }}
        >
          <h3
            style={{
              fontFamily: "Quantico, sans-serif",
              fontSize: "22px",
              margin: 0,
              color: "var(--tertiary-clr-100)"
            }}
          >
            {labName}
          </h3>

          <p
            style={{
              margin: 0,
              fontSize: "16px",
              color: "#666",
              fontFamily: "Onest, sans-serif"
            }}
          > 
            {location}
            
            
          </p>
        </div>
      </div>

      {/* Description Below */}
      <h1 className="header-title">Mission</h1>
      <div
        style={{
          fontFamily: "Onest, sans-serif",
          fontSize: "15px",
          lineHeight: "1.6",
          color: "#444"
        }}
      >
        {description}
      </div>
      <h2 style={{ 
                fontFamily: 'Quantico, sans-serif', 
                color: 'var(--tertiary-clr-100)',
                marginBottom: '16px'
              }}>
                Lab Work & Media
              </h2>
    </div>
  );
})}


              </div>
            </div>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              fontFamily: 'Onest, sans-serif',
              fontSize: '18px',
              color: '#666'
            }}>
              No results found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import SearchBar from '@/components/SearchBar';
import ResultPanel from '@/components/ResultPanel';
import { SearchResult } from '@/types';

export default function LivingLabPage() {
  const router = useRouter();
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [selectedLabId, setSelectedLabId] = useState<string | null>(null);

  // Handle search results - redirect to homepage with query
  const handleSearchResults = (matches: SearchResult[], query: string) => {
    // Navigate to homepage with search query parameter
    router.push(`/?q=${encodeURIComponent(query)}`);
  };

  // Handle media selection
  const handleMediaSelect = (id: string | null) => {
    setSelectedLabId(id);
  };

  return (
    <div className="h-screen overflow-hidden flex flex-col">
      {/* Header - responsive layout with search bar */}
      <header className="header-container">
        <div className="header-top-row">
          {/* Left side: logo and H1 */}
          <div className="logo-section">
            <img className="header-logo" src="/logo.jpg" alt="Logo" />
            <h1 className="header-title">Living Labs</h1>
          </div>

          {/* Center: Search bar - wraps to next line on smaller screens */}
          <div className="search-bar-wrapper">
            <SearchBar onResults={handleSearchResults} />
          </div>

          {/* Right side: two H2s */}
          <div className="nav-links">
            <h2>Our Labs</h2>
            <h2>Join</h2>
          </div>
        </div>
      </header>

      {/* Content area - Results display */}
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
          {/* Results Panel */}
          {results && results.length > 0 ? (
            <div style={{ 
              width: '100%', 
              boxSizing: 'border-box', 
              padding: '24px',
              backgroundColor: 'var(--background-clr-400)'
            }}>
              <h2 style={{ 
                fontFamily: 'Quantico, sans-serif', 
                color: 'var(--tertiary-clr-100)',
                marginBottom: '16px'
              }}>
                Lab Work & Media
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {results
                  .filter((r) => r && typeof r === 'object')
                  .map((r, i) => {
                    const key = r.id || `result-${i}`;
                    return <ResultPanel key={key} result={r} selectedId={selectedLabId} onSelect={handleMediaSelect} />;
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
              {results === null ? 'Search for lab work and media above' : 'No results found'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

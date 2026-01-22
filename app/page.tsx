/* Hero Page */

"use client";

import Preload from '@/components/Preload';
import Head from 'next/head';
import { Scene } from '@/components/Scene'; 
import SearchBar from '@/components/SearchBar';
import ResultPanel from '@/components/ResultPanel';
import MediaDetailPanel from '@/components/MediaDetailPanel';
import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { SearchResult, SearchBarHandle } from '@/types';

export default function Home() {
  const searchParams = useSearchParams();
  const searchBarRef = useRef<SearchBarHandle | null>(null);
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [selectedLabId, setSelectedLabId] = useState<string | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<SearchResult | null>(null);

  // Handle search from URL query parameter
  useEffect(() => {
    const query = searchParams.get('q');
    if (query && searchBarRef.current) {
      searchBarRef.current.triggerSearch(query);
    }
  }, [searchParams]);

  // Handle media selection
  const handleMediaSelect = (id: string | null) => {
    setSelectedLabId(id);
    if (id && results) {
      const media = results.find(r => r.id === id);
      setSelectedMedia(media || null);
    } else {
      setSelectedMedia(null);
    }
  };

  return (
    <div className="full-height-container">
      {/* Preload model in background */}
      <Preload />

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
            <SearchBar ref={searchBarRef} onResults={(matches, query) => setResults(matches)} />
          </div>

          {/* Right side: two H2s */}
          <div className="nav-links">
            <h2>Our Labs</h2>
            <h2>Join</h2>
          </div>
        </div>
      </header>

      {/* Content area - vertical layout with sticky map */}
      <div style={{ 
        flex: '1 1 0',
        minHeight: 0,
        display: 'flex',
        overflow: 'hidden'
      }}>
        {/* Left side: Map and Results */}
        <div style={{
          flex: selectedMedia ? '0 0 66.67%' : '1',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          transition: 'flex 0.3s ease'
        }}>
          {/* Map - takes remaining space or full space when no results */}
          <div className="map-container">
            <Scene />
          </div>

          {/* Results at bottom - shows all or just selected one */}
          {results && results.length > 0 && (
            <div style={{ 
              width: '100%', 
              boxSizing: 'border-box', 
              padding: selectedLabId ? '0' : '24px',
              backgroundColor: 'var(--background-clr-400)',
              boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.1), 0 -2px 4px -1px rgba(0, 0, 0, 0.06)',
              flex: '0 0 auto',
              overflowY: selectedLabId ? 'hidden' : 'auto',
              maxHeight: selectedLabId ? 'auto' : '60vh',
              transition: 'padding 0.3s ease'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: selectedLabId ? 0 : 8 }}>
                {results
                  .filter((r) => r && typeof r === 'object')
                  .filter((r) => !selectedLabId || r.id === selectedLabId)
                  .map((r, i) => {
                    const key = r.id || `result-${i}`;
                    return <ResultPanel key={key} result={r} selectedId={selectedLabId} onSelect={handleMediaSelect} />;
                  })}
              </div>
            </div>
          )}
        </div>

        {/* Right side: 2-Column Media Detail Panel */}
        {selectedMedia && (
          <MediaDetailPanel 
            selectedMedia={selectedMedia}
            onClose={() => handleMediaSelect(null)}
          />
        )}
      </div>
    </div>
  );
}

/* Hero Page */

"use client";

import Preload from '@/components/Preload';
import Head from 'next/head';
import { Scene } from '@/components/Scene';
import SearchBar from '@/components/SearchBar';
import ResultPanel from '@/components/ResultPanel';
import MediaDetailPanel from '@/components/MediaDetailPanel';
import BuildingPanel from '@/components/BuildingPanel';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { SearchResult, SearchBarHandle } from '@/types';
import { useAuth } from '@/lib/auth-context';

function HomeContent() {
  const searchParams = useSearchParams();
  const searchBarRef = useRef<SearchBarHandle | null>(null);
  const { user, labId } = useAuth();
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentQuery, setCurrentQuery] = useState('');
  const [selectedLabId, setSelectedLabId] = useState<string | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<SearchResult | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);
  const [cameraTargetBuilding, setCameraTargetBuilding] = useState<string | null>("Washburn Hall");

  // Handle search from URL query parameter
  useEffect(() => {
    const query = searchParams.get('q');
    if (query && searchBarRef.current) {
      searchBarRef.current.triggerSearch(query);
    }
  }, [searchParams]);

  // Append next page of search results
  const loadMore = async () => {
    if (!currentQuery || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetch('/api/search-enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: currentQuery, offset: results?.length ?? 0 }),
      });
      if (!res.ok) return;
      const data = await res.json();
      const newResults: SearchResult[] = Array.isArray(data.results) ? data.results : [];
      setResults(prev => [...(prev ?? []), ...newResults]);
      setHasMore(data.hasMore ?? false);
    } catch {
      // non-fatal — button stays visible so user can retry
    } finally {
      setLoadingMore(false);
    }
  };

  // Handle media selection
  const handleMediaSelect = async (id: string | null) => {
    setSelectedLabId(id);
    if (id && results) {
      const media = results.find(r => r.id === id);
      setSelectedMedia(media || null);
      setSelectedBuilding(null);

      // Center camera on the lab's building
      const labId = media?.lab_id;
      if (labId) {
        try {
          const res = await fetch(`/api/lab-location?id=${encodeURIComponent(labId)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.building) setCameraTargetBuilding(data.building);
          }
        } catch {
          // non-fatal — camera just won't move
        }
      }
    } else {
      setSelectedMedia(null);
    }
  };

  // Handle building click from 3D map
  const handleBuildingClick = (name: string) => {
    setSelectedBuilding(prev => prev === name ? null : name);
    setSelectedMedia(null);
    setSelectedLabId(null);
    setCameraTargetBuilding(name);
  };

  return (
    <div className="full-height-container">
      {/* Preload model in background */}
      <Preload />

      {/* Header - responsive layout with search bar */}
      <header className="header-container">
        <div className="header-top-row">
          {/* Left side: logo and H1 */}
          <a href="/" className="logo-section" style={{ textDecoration: "none", color: "inherit" }}>
            <img className="header-logo" src="https://firebasestorage.googleapis.com/v0/b/livinglabs-1a831.firebasestorage.app/o/logo.jpg?alt=media" alt="Logo" />
            <h1 className="header-title">Living Labs</h1>
          </a>

          {/* Center: Search bar - wraps to next line on smaller screens */}
          <div className="search-bar-wrapper">
            <SearchBar ref={searchBarRef} onLoadingChange={setIsSearching} onResults={(matches, query, more) => {
              setResults(matches);
              setCurrentQuery(query);
              setHasMore(more);
              setSelectedLabId(null);
              setSelectedMedia(null);
            }} />
          </div>

          {/* Right side: two H2s */}
          <div className="nav-links">
            <a href="/our-labs" style={{ textDecoration: 'none' }}><h2>Our Labs</h2></a>
            {user && labId
              ? <a href={`/admin/lab/${labId}`} style={{ textDecoration: 'none' }}><h2>My Lab</h2></a>
              : <a href="/join" style={{ textDecoration: 'none' }}><h2>Join</h2></a>
            }
          </div>
        </div>
      </header>

      {/* Content area - vertical layout with sticky map */}
      <div style={{
        flex: '1 1 0',
        minHeight: 0,
        display: 'flex',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Left side: Map and Results */}
        <div style={{
          width: (selectedMedia || selectedBuilding) ? '66.67%' : '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          transition: 'width 0.3s ease'
        }}>
          {/* Map - takes remaining space or full space when no results */}
          <div className="map-container">
            <Scene onBuildingClick={handleBuildingClick} cameraTargetBuilding={cameraTargetBuilding} />
          </div>

          {/* Results at bottom - shows all or just selected one */}
          {(isSearching || (results && results.length > 0)) && (
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
                {isSearching ? (
                  [0, 1, 2].map(i => (
                    <div key={i} style={{ display: 'flex', gap: 16, padding: 16, background: 'var(--background-clr-400)', borderBottom: '1px solid #eee' }}>
                      <div className="skeleton-shimmer" style={{ width: 160, height: 100, flexShrink: 0, borderRadius: 6 }} />
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div className="skeleton-shimmer" style={{ height: 24, width: '60%' }} />
                        <div className="skeleton-shimmer" style={{ height: 14, width: '40%' }} />
                        <div className="skeleton-shimmer" style={{ height: 14, width: '30%' }} />
                      </div>
                    </div>
                  ))
                ) : (
                  results!
                    .filter((r) => r && typeof r === 'object')
                    .filter((r) => !selectedLabId || r.id === selectedLabId)
                    .map((r, i) => {
                      const key = r.id || `result-${i}`;
                      return <ResultPanel key={key} result={r} selectedId={selectedLabId} onSelect={handleMediaSelect} />;
                    })
                )}
              </div>

              {/* Load more button — only shown when there are more results and no item is selected */}
              {hasMore && !selectedLabId && !isSearching && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0 8px' }}>
                  <button
                    onClick={loadMore}
                    disabled={loadingMore}
                    style={{
                      fontFamily: 'Onest, sans-serif',
                      fontSize: 14,
                      fontWeight: 600,
                      color: loadingMore ? 'var(--tertiary-clr-100)' : 'var(--background-clr-400)',
                      background: loadingMore ? 'transparent' : 'var(--tertiary-clr-100)',
                      border: '2px solid var(--tertiary-clr-100)',
                      borderRadius: 24,
                      padding: '8px 28px',
                      cursor: loadingMore ? 'default' : 'pointer',
                      opacity: loadingMore ? 0.5 : 1,
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={e => { if (!loadingMore) (e.currentTarget.style.background = 'var(--primary-clr-300)', e.currentTarget.style.borderColor = 'var(--primary-clr-300)'); }}
                    onMouseLeave={e => { if (!loadingMore) (e.currentTarget.style.background = 'var(--tertiary-clr-100)', e.currentTarget.style.borderColor = 'var(--tertiary-clr-100)'); }}
                  >
                    {loadingMore ? 'Loading…' : 'Load more'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right side: Media Detail Panel */}
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '33.33%',
          height: '100%',
          transform: selectedMedia ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s ease',
          zIndex: 10
        }}>
          <MediaDetailPanel
            selectedMedia={selectedMedia}
            onClose={() => handleMediaSelect(null)}
          />
        </div>

        {/* Right side: Building Panel */}
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '33.33%',
          height: '100%',
          transform: selectedBuilding ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s ease',
          zIndex: 10
        }}>
          <BuildingPanel
            buildingName={selectedBuilding}
            onClose={() => setSelectedBuilding(null)}
          />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}

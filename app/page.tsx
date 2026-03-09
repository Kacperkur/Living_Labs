/* Hero Page */

"use client";

import Preload from '@/components/Preload';
import Head from 'next/head';
import { Scene } from '@/components/Scene';
import SearchBar from '@/components/SearchBar';
import ResultPanel from '@/components/ResultPanel';
import MediaDetailPanel from '@/components/MediaDetailPanel';
import BuildingPanel from '@/components/BuildingPanel';
import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { SearchResult, SearchBarHandle } from '@/types';

export default function Home() {
  const searchParams = useSearchParams();
  const searchBarRef = useRef<SearchBarHandle | null>(null);
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [selectedLabId, setSelectedLabId] = useState<string | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<SearchResult | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);
  const [cameraTargetBuilding, setCameraTargetBuilding] = useState<string | null>(null);

  // Handle search from URL query parameter
  useEffect(() => {
    const query = searchParams.get('q');
    if (query && searchBarRef.current) {
      searchBarRef.current.triggerSearch(query);
    }
  }, [searchParams]);

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
            <img className="header-logo" src="/logo.jpg" alt="Logo" />
            <h1 className="header-title">Living Labs</h1>
          </a>

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
          transition: 'width 0.3s ease'
        }}>
          {/* Map - takes remaining space or full space when no results */}
          <div className="map-container">
            <Scene onBuildingClick={handleBuildingClick} cameraTargetBuilding={cameraTargetBuilding} />
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

"use client";

import Preload from '@/components/Preload';
import Head from 'next/head';
import { Scene } from '@/components/Scene'; 
import SearchBar from '@/components/SearchBar';
import ResultPanel from '@/components/ResultPanel';
import MediaDetailPanel from '@/components/MediaDetailPanel';
import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';

export default function Home() {
  const searchParams = useSearchParams();
  const searchBarRef = useRef<any>(null);
  const [results, setResults] = useState<any[] | null>(null);
  const [selectedLabId, setSelectedLabId] = useState<string | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<any | null>(null);

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
      const media = results.find(r => (r.id || r._id) === id);
      setSelectedMedia(media);
    } else {
      setSelectedMedia(null);
    }
  };

  return (
    <div style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Preload model in background */}
      <Preload />

      {/* Header - responsive layout with search bar */}
      <header
        style={{
          backgroundColor: '#FFFFFF',
          minHeight: 60,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          padding: '8px 40px 8px 16px',
          boxSizing: 'border-box',
          gap: 16,
          flexShrink: 0,
        }}
      >
        <style dangerouslySetInnerHTML={{__html: `
          @media (max-width: 1200px) {
            .search-bar-wrapper {
              order: 3 !important;
              flex-basis: 100% !important;
              max-width: 100% !important;
              padding: 8px 24px !important;
            }
          }
          
          @media (max-width: 768px) {
            .header-container {
              padding: 8px 16px 8px 8px !important;
              gap: 8px !important;
            }
            .logo-section {
              gap: 12px !important;
            }
            .header-logo {
              height: 40px !important;
              margin-left: 8px !important;
            }
            .header-title {
              font-size: 20px !important;
            }
            .nav-links {
              gap: 16px !important;
            }
            .nav-links h2 {
              font-size: 18px !important;
            }
          }
          
          @media (max-width: 480px) {
            .logo-section {
              gap: 8px !important;
            }
            .header-logo {
              height: 36px !important;
              margin-left: 4px !important;
            }
            .header-title {
              font-size: 16px !important;
            }
            .nav-links {
              gap: 12px !important;
            }
            .nav-links h2 {
              font-size: 16px !important;
            }
          }
        `}} />
        {/* Top row container */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          width: '100%',
          minHeight: 60,
          flexWrap: 'wrap',
          gap: 16
        }}>
          {/* Left side: logo and H1 */}
          <div className="logo-section" style={{ display: 'flex', alignItems: 'center', gap: 24, flexShrink: 0 }}>
            <img className="header-logo" src="/logo.jpg" alt="Logo" style={{ height: 60, marginLeft: 24 }} />
            <h1 className="header-title" style={{ margin: 0, fontFamily: 'Quantico, sans-serif', color: 'var(--tertiary-clr-100)', whiteSpace: 'nowrap' }}>Living Labs</h1>
          </div>

          {/* Center: Search bar - wraps to next line on smaller screens */}
          <div className="search-bar-wrapper" style={{ flex: '1 1 300px', maxWidth: '600px', minWidth: '300px', padding: '0 24px' }}>
            <SearchBar ref={searchBarRef} onResults={(matches, query) => setResults(matches)} />
          </div>

          {/* Right side: two H2s */}
          <div
            className="nav-links"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 24,
              fontFamily: 'Quantico, sans-serif',
              color: 'var(--tertiary-clr-100)',
              flexShrink: 0,
            }}
          >
            <h2 style={{ margin: 0, whiteSpace: 'nowrap' }}>Our Labs</h2>
            <h2 style={{ margin: 0, whiteSpace: 'nowrap' }}>Join</h2>
          </div>
        </div>
      </header>

      {/* Content area - vertical layout with sticky map */}
      <div style={{ 
        flex: 1, 
        display: 'flex',
        overflow: 'hidden'
      }}>
        {/* Left side: Map and Results */}
        <div style={{
          flex: selectedMedia ? '0 0 66.67%' : '1',
          display: 'flex',
          flexDirection: 'column',
          overflowY: results && results.length > 0 ? 'auto' : 'hidden',
          overflowX: 'hidden',
          position: 'relative',
          transition: 'flex 0.3s ease'
        }}>
          {/* Sticky Scene at top */}
          <div style={{ 
            position: 'sticky',
            top: 0,
            height: results && results.length > 0 ? '40vh' : '100%',
            minHeight: results && results.length > 0 ? '40vh' : 'auto',
            zIndex: 1,
            backgroundColor: '#fff'
          }}>
            <Scene />
          </div>

          {/* Scrollable Results below */}
          {results && results.length > 0 && (
            <div style={{ 
              width: '100%', 
              boxSizing: 'border-box', 
              padding: '24px',
              backgroundColor: '#fff',
              boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.1), 0 -2px 4px -1px rgba(0, 0, 0, 0.06)'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {results
                  .filter((r) => r && typeof r === 'object')
                  .map((r, i) => {
                    const key = r.id || r._id || `result-${i}`;
                    return <ResultPanel key={key} result={r} selectedId={selectedLabId} onSelect={handleMediaSelect} />;
                  })}
              </div>
            </div>
          )}
        </div>

        {/* Right side: 2-Column Media Detail Panel */}
        <MediaDetailPanel 
          selectedMedia={selectedMedia}
          onClose={() => handleMediaSelect(null)}
        />
      </div>
    </div>
  );
}

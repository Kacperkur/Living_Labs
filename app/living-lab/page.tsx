"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import SearchBar from '@/components/SearchBar';
import ResultPanel from '@/components/ResultPanel';

export default function LivingLabPage() {
  const router = useRouter();
  const [results, setResults] = useState<any[] | null>(null);
  const [selectedLabId, setSelectedLabId] = useState<string | null>(null);

  // Handle search results - redirect to homepage with query
  const handleSearchResults = (matches: any[], query: string) => {
    // Navigate to homepage with search query parameter
    router.push(`/?q=${encodeURIComponent(query)}`);
  };

  // Handle media selection
  const handleMediaSelect = (id: string | null) => {
    setSelectedLabId(id);
  };

  return (
    <div style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Header - responsive layout with search bar */}
      <header
        style={{
          backgroundColor: 'var(--background-clr-400)',
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
            <img className="header-logo" src="/logo.jpg" alt="Logo" style={{ height: 60, marginLeft: 24, mixBlendMode: 'multiply' }} />
            <h1 className="header-title" style={{ margin: 0, fontFamily: 'Quantico, sans-serif', color: 'var(--tertiary-clr-100)', whiteSpace: 'nowrap' }}>Living Labs</h1>
          </div>

          {/* Center: Search bar - wraps to next line on smaller screens */}
          <div className="search-bar-wrapper" style={{ flex: '1 1 300px', maxWidth: '600px', minWidth: '300px', padding: '0 24px' }}>
            <SearchBar onResults={handleSearchResults} />
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

      {/* Content area - Lab Profile */}
      <div style={{ 
        flex: 1, 
        display: 'flex',
        overflow: 'hidden'
      }}>
        {/* Parent Flexbox Container */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '24px',
          gap: '24px',
          backgroundColor: 'var(--background-clr-400)'
        }}>
          
          {/* Child 1: Header Row - Image + Title/Location/SDG */}
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            gap: '24px',
            backgroundColor: 'var(--background-clr-400)',
            padding: '20px',
            borderRadius: '8px'
          }}>
            {/* Lab Image - 50% width */}
            <div style={{
              flex: '0 0 50%',
              minHeight: '300px',
              backgroundColor: '#ddd',
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              <img 
                src="/placeholder-lab.jpg" 
                alt="Lab Location"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            </div>
            
            {/* Info Section - Vertically aligned */}
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              alignItems: 'flex-start',
              gap: '16px'
            }}>
              {/* Title */}
              <h1 style={{
                fontFamily: 'Quantico, sans-serif',
                fontSize: '32px',
                fontWeight: 700,
                color: 'var(--tertiary-clr-100)',
                margin: 0
              }}>
                Lab Title
              </h1>
              
              {/* Location */}
              <p style={{
                fontFamily: 'Onest, sans-serif',
                fontSize: '18px',
                color: '#666',
                margin: 0
              }}>
                📍 Lab Location
              </p>
              
              {/* SDG Icons */}
              <div style={{
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap'
              }}>
                <div style={{
                  fontFamily: 'Onest, sans-serif',
                  fontSize: '14px',
                  color: 'var(--tertiary-clr-100)',
                  fontWeight: 600
                }}>
                  SDGs:
                </div>
                {/* SDG icons will go here */}
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  backgroundColor: '#ccc', 
                  borderRadius: '4px' 
                }} />
                <div style={{ 
                  width: '48px', 
                  height: '48px', 
                  backgroundColor: '#ccc', 
                  borderRadius: '4px' 
                }} />
              </div>
            </div>
          </div>

          {/* Child 2: Biography */}
          <div style={{
            backgroundColor: 'var(--background-clr-400)',
            padding: '20px',
            borderRadius: '8px'
          }}>
            <h2 style={{
              fontFamily: 'Quantico, sans-serif',
              fontSize: '24px',
              fontWeight: 700,
              color: 'var(--tertiary-clr-100)',
              marginTop: 0,
              marginBottom: '12px'
            }}>
              Biography
            </h2>
            <p style={{
              fontFamily: 'Onest, sans-serif',
              fontSize: '16px',
              lineHeight: 1.6,
              color: '#555',
              margin: 0
            }}>
              Lab biography text will go here. This section will contain detailed information about the lab's mission, goals, and activities.
            </p>
          </div>

          {/* Child 3: Metrics Collected */}
          <div style={{
            backgroundColor: 'var(--background-clr-400)',
            padding: '20px',
            borderRadius: '8px'
          }}>
            <h2 style={{
              fontFamily: 'Quantico, sans-serif',
              fontSize: '24px',
              fontWeight: 700,
              color: 'var(--tertiary-clr-100)',
              marginTop: 0,
              marginBottom: '12px'
            }}>
              Metrics Collected
            </h2>
            <p style={{
              fontFamily: 'Onest, sans-serif',
              fontSize: '16px',
              lineHeight: 1.6,
              color: '#555',
              margin: 0
            }}>
              Metrics data will be displayed here.
            </p>
          </div>

          {/* Child 4: Members */}
          <div style={{
            backgroundColor: 'var(--background-clr-400)',
            padding: '20px',
            borderRadius: '8px'
          }}>
            <h2 style={{
              fontFamily: 'Quantico, sans-serif',
              fontSize: '24px',
              fontWeight: 700,
              color: 'var(--tertiary-clr-100)',
              marginTop: 0,
              marginBottom: '12px'
            }}>
              Members
            </h2>
            <p style={{
              fontFamily: 'Onest, sans-serif',
              fontSize: '16px',
              lineHeight: 1.6,
              color: '#555',
              margin: 0
            }}>
              Lab members will be listed here.
            </p>
          </div>

          {/* Child 5: Lab Media - ResultPanel */}
          <div style={{
            backgroundColor: 'var(--background-clr-400)',
            padding: '20px',
            borderRadius: '8px'
          }}>
            <h2 style={{
              fontFamily: 'Quantico, sans-serif',
              fontSize: '24px',
              fontWeight: 700,
              color: 'var(--tertiary-clr-100)',
              marginTop: 0,
              marginBottom: '16px'
            }}>
              Lab Work & Media
            </h2>
            {results && results.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {results
                  .filter((r) => r && typeof r === 'object')
                  .map((r, i) => {
                    const key = r.id || r._id || `result-${i}`;
                    return <ResultPanel key={key} result={r} selectedId={selectedLabId} onSelect={handleMediaSelect} />;
                  })}
              </div>
            ) : (
              <p style={{
                fontFamily: 'Onest, sans-serif',
                fontSize: '16px',
                color: '#666',
                textAlign: 'center',
                padding: '40px 0'
              }}>
                {results === null ? 'No media available for this lab' : 'No results found'}
              </p>
            )}
          </div>

        </div>
      </div>
    </div>
    
  );
}

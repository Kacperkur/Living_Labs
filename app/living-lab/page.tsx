"use client";

import { useState } from 'react';

export default function LivingLabPage() {
  const [results, setResults] = useState<any[] | null>(null);

  return (
    <div style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
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
            <input 
              type="text" 
              placeholder="Search..." 
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            />
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
    </div>
  );
}

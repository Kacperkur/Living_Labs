"use client";

import Preload from '@/components/Preload';
import Head from 'next/head';
import { Scene } from '@/components/Scene'; 
import SearchBar from '@/components/SearchBar';
import ResultPanel from '@/components/ResultPanel';
import { useState } from 'react';

import { Quantico } from 'next/font/google';
import { Newsreader } from 'next/font/google';

const quantico = Quantico({
  subsets: ['latin'],
  weight: ['400', '700'],
});
const newsreader = Newsreader({
  subsets: ['latin'],
  weight: ['400', '700'],
});

export default function Home() {
  const [results, setResults] = useState<any[] | null>(null);

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Preload model in background */}
      <Preload />

      {/* Header - top area (fixed viewport percentage) */}
      <header
        style={{
          backgroundColor: '#FFFFFF',
          height: '12vh',
          minHeight: 50,
          maxHeight: 75,
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          boxSizing: 'border-box',
          gap: 24,
          justifyContent: 'space-between',
        }}
      >
        {/* Left side: logo and H1 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <img src="/logo.jpg" alt="Logo" style={{ height: 60, marginLeft: 24 }} />
          <h1 style={{ margin: 0, fontFamily: 'Quantico, sans-serif' }}>Living Labs</h1>
        </div>

        {/* Right side: two H2s */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            fontFamily: 'Quantico, sans-serif',
          }}
        >
          <h2 style={{ margin: 0 }}>Our Labs</h2>
          <h2 style={{ margin: 0 }}>Join</h2>
        </div>
      </header>

      {/* Search bar - small fixed area */}
      <div
        style={{
          height: '8vh',
          minHeight: 50,
          maxHeight: 75,
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          boxSizing: 'border-box',
          width: '100%',
          backgroundColor: '#FFFFFF',
        }}
      >
        <SearchBar onResults={(matches) => setResults(matches)} />
      </div>

      {/* Scene viewer - fills remaining viewport space */}
      <section style={{ flex: '0 0 auto', height: '60vh', minHeight: 240 }}>
        <Scene /> {/* ✅ replaces EmbeddedViewer */}
      </section>

      {/* Results appear below the scene */}
      <div style={{ width: '100%', boxSizing: 'border-box' }}>
        {results && results.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {results
              .filter((r) => r && typeof r === 'object') // Filter out invalid results
              .map((r, i) => {
                // Ensure we have a valid key for React
                const key = r.id || r._id || `result-${i}`;
                return <ResultPanel key={key} result={r} />;
              })}
          </div>
        )}
      </div>
    </main>
  );
}

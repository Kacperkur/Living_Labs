import Preload from '@/components/Preload';
import Head from 'next/head';
import { Scene } from '@/components/Scene'; // ✅ now using Scene directly

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
  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Preload model in background */}
      <Preload />

      {/* Header - top 20% */}
      <header
        style={{
          backgroundColor: '#FFFFFF',
          height: '20vh',
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

      {/* Search bar - same height as navigation bar */}
      <div
        style={{
          height: '20vh',
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
        <input
          type="text"
          placeholder="Search..."
          style={{
            width: '100%',
            height: '60%',
            fontFamily: 'Newsreader, serif',
            fontSize: 20,
            padding: '0 16px',
            borderRadius: 8,
            border: '1px solid #ccc',
            outline: 'none',
          }}
        />
      </div>

      {/* Scene viewer - bottom 80% */}
      <section style={{ height: '80vh', flex: '1 1 auto' }}>
        <Scene /> {/* ✅ replaces EmbeddedViewer */}
      </section>
    </main>
  );
}

"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import LabCard, { LabCardData } from '../../components/LabCard';

export default function OurLabsPage() {
  const [labs, setLabs] = useState<LabCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/all-labs')
      .then(res => {
        if (!res.ok) throw new Error(`Failed to load labs (${res.status})`);
        return res.json();
      })
      .then(data => {
        setLabs(Array.isArray(data.labs) ? data.labs : []);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background-clr-400)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header className="header-container">
        <div className="header-top-row">
          <Link href="/" className="logo-section" style={{ textDecoration: 'none', color: 'inherit' }}>
            <img className="header-logo" src="https://firebasestorage.googleapis.com/v0/b/livinglabs-1a831.firebasestorage.app/o/logo.jpg?alt=media" alt="Logo" />
            <h1 className="header-title">Living Labs</h1>
          </Link>
          <div className="nav-links">
            <Link href="/our-labs" style={{ textDecoration: 'none' }}>
              <h2>Our Labs</h2>
            </Link>
            <a href="/join" style={{ textDecoration: 'none' }}><h2>Join</h2></a>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main style={{ flex: 1, padding: '40px 48px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'Quantico, sans-serif', fontSize: 32, marginBottom: 8, color: 'var(--tertiary-clr-100)' }}>
          Our Labs
        </h2>
        <p style={{ fontFamily: 'Onest, sans-serif', fontSize: 15, color: '#6b7e96', marginBottom: 40 }}>
          Hover over a card to learn more. Click <strong>Visit Lab</strong> to explore its research and media.
        </p>

        {loading && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 28, justifyContent: 'center' }}>
            {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
              <div key={i} style={{ width: 280, height: 360, borderRadius: 12, overflow: 'hidden', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
                <div className="skeleton-shimmer" style={{ width: '100%', height: 200, borderRadius: 0 }} />
                <div style={{ flex: 1, padding: '16px 16px 12px', display: 'flex', flexDirection: 'column', gap: 10, background: '#fff' }}>
                  <div className="skeleton-shimmer" style={{ height: 20, width: '75%' }} />
                  <div className="skeleton-shimmer" style={{ height: 14, width: '55%' }} />
                  <div className="skeleton-shimmer" style={{ height: 13, width: '90%' }} />
                  <div className="skeleton-shimmer" style={{ height: 13, width: '70%' }} />
                  <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                    {[0, 1, 2].map(j => <div key={j} className="skeleton-shimmer" style={{ width: 32, height: 32, borderRadius: 4 }} />)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div style={{ fontFamily: 'Onest, sans-serif', fontSize: 15, color: '#c0392b', textAlign: 'center', marginTop: 80 }}>
            {error}
          </div>
        )}

        {!loading && !error && labs.length === 0 && (
          <div style={{ fontFamily: 'Onest, sans-serif', fontSize: 15, color: '#6b7e96', textAlign: 'center', marginTop: 80 }}>
            No labs found.
          </div>
        )}

        {!loading && labs.length > 0 && (
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 28,
            justifyContent: 'center',
          }}>
            {labs.map(lab => (
              <LabCard key={lab.id} lab={lab} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

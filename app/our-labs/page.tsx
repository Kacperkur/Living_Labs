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
            <img className="header-logo" src="/logo.jpg" alt="Logo" />
            <h1 className="header-title">Living Labs</h1>
          </Link>
          <div className="nav-links">
            <Link href="/our-labs" style={{ textDecoration: 'none' }}>
              <h2>Our Labs</h2>
            </Link>
            <h2>Join</h2>
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
          <div style={{ fontFamily: 'Onest, sans-serif', fontSize: 16, color: '#6b7e96', textAlign: 'center', marginTop: 80 }}>
            Loading labs…
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

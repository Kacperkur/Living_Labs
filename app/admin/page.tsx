"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Lab {
  id: string;
  name: string | null;
  location: string | null;
  biography: string | null;
  start_date: string | null;
  end_date: string | null;
  SDGs: { name?: string }[];
}

export default function AdminPage() {
  const router = useRouter();
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/all-labs')
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setLabs(data.labs ?? []);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = labs.filter(lab =>
    !search ||
    lab.name?.toLowerCase().includes(search.toLowerCase()) ||
    lab.location?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--background-clr-400)',
      fontFamily: 'Onest, sans-serif',
    }}>
      {/* Header */}
      <div style={{
        background: 'var(--tertiary-clr-100)',
        padding: '20px 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary-clr-300)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
            Living Labs
          </div>
          <h1 style={{ fontFamily: 'Quantico, sans-serif', fontSize: 24, fontWeight: 700, color: '#fff', margin: 0 }}>
            Admin Portal
          </h1>
        </div>
        <a href="/" style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>
          ← Back to map
        </a>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>

        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontFamily: 'Quantico, sans-serif', fontSize: 20, fontWeight: 700, color: 'var(--tertiary-clr-100)', margin: 0 }}>
              All Labs
            </h2>
            {!loading && (
              <p style={{ fontSize: 13, color: 'var(--tertiary-clr-100)', opacity: 0.5, margin: '4px 0 0' }}>
                {filtered.length} {filtered.length === 1 ? 'lab' : 'labs'}
                {search ? ` matching "${search}"` : ' in database'}
              </p>
            )}
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="Search by name or location…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid #ddd',
              background: '#fff',
              fontSize: 14,
              fontFamily: 'Onest, sans-serif',
              color: 'var(--tertiary-clr-100)',
              outline: 'none',
              width: 260,
            }}
          />
        </div>

        {/* States */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--tertiary-clr-100)', opacity: 0.4, fontSize: 14 }}>
            Loading labs…
          </div>
        )}

        {!loading && error && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#c0392b', fontSize: 14 }}>
            {error}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--tertiary-clr-100)', opacity: 0.4, fontSize: 14 }}>
            No labs found.
          </div>
        )}

        {/* Lab list */}
        {!loading && !error && filtered.map(lab => (
          <div
            key={lab.id}
            style={{
              background: '#fff',
              border: '1px solid #e6e6e6',
              borderRadius: 12,
              padding: '20px 24px',
              marginBottom: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
            }}
          >
            {/* Lab info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--tertiary-clr-100)' }}>
                  {lab.name ?? '(Unnamed lab)'}
                </span>
                {lab.location && (
                  <span style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--primary-clr-300)',
                    background: 'rgba(117,178,221,0.12)',
                    borderRadius: 4,
                    padding: '2px 8px',
                    whiteSpace: 'nowrap',
                  }}>
                    {lab.location}
                  </span>
                )}
              </div>

              {lab.biography && (
                <p style={{
                  fontSize: 13,
                  color: 'var(--tertiary-clr-100)',
                  opacity: 0.6,
                  margin: 0,
                  lineHeight: 1.5,
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}>
                  {lab.biography}
                </p>
              )}

              {lab.SDGs.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                  {lab.SDGs.slice(0, 4).map((sdg, i) => (
                    <span key={i} style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: 'var(--tertiary-clr-100)',
                      opacity: 0.5,
                      background: '#f0f0f0',
                      borderRadius: 4,
                      padding: '2px 6px',
                    }}>
                      {sdg.name}
                    </span>
                  ))}
                  {lab.SDGs.length > 4 && (
                    <span style={{ fontSize: 10, color: 'var(--tertiary-clr-100)', opacity: 0.4, padding: '2px 4px' }}>
                      +{lab.SDGs.length - 4} more
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Action */}
            <button
              onClick={() => router.push(`/admin/lab/${lab.id}`)}
              style={{
                flexShrink: 0,
                background: 'var(--tertiary-clr-100)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '10px 20px',
                fontSize: 13,
                fontWeight: 600,
                fontFamily: 'Onest, sans-serif',
                cursor: 'pointer',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--primary-clr-300)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--tertiary-clr-100)')}
            >
              Manage Lab →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

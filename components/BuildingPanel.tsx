"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lab } from '../types';

interface BuildingPanelProps {
  buildingName: string | null;
  onClose: () => void;
}

export default function BuildingPanel({ buildingName, onClose }: BuildingPanelProps) {
  const router = useRouter();
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);

  useEffect(() => {
    if (!buildingName) {
      setLabs([]);
      return;
    }

    setLoading(true);
    setError(null);

    fetch(`/api/labs-by-building?building=${encodeURIComponent(buildingName)}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setLabs(data.labs ?? []);
      })
      .catch(err => {
        console.error('BuildingPanel fetch error:', err);
        setError('Failed to load labs.');
      })
      .finally(() => setLoading(false));
  }, [buildingName]);

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: 'var(--background-clr-400)',
      display: 'flex',
      flexDirection: 'column',
      borderLeft: '1px solid #ddd',
      boxShadow: '-4px 0 12px rgba(0,0,0,0.08)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 20px 16px',
        borderBottom: '1px solid #e0e0e0',
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 12,
        }}>
          <div>
            <div style={{
              fontFamily: 'Onest, sans-serif',
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--primary-clr-300)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 4,
            }}>
              Building
            </div>
            <h2 style={{
              fontFamily: 'Onest, sans-serif',
              fontSize: 22,
              fontWeight: 700,
              color: 'var(--tertiary-clr-100)',
              margin: 0,
              lineHeight: 1.2,
            }}>
              {buildingName}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--tertiary-clr-100)',
              fontSize: 22,
              lineHeight: 1,
              padding: 4,
              flexShrink: 0,
              opacity: 0.6,
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '0.6')}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Building image */}
        {buildingName && (
          <div key={buildingName} style={{ width: '100%', borderRadius: 8, overflow: 'hidden' }}>
            <img
              src={`https://firebasestorage.googleapis.com/v0/b/livinglabs-1a831.firebasestorage.app/o/${encodeURIComponent(buildingName)}.jpg?alt=media`}
              alt={buildingName}
              style={{
                width: '100%',
                height: 'auto',
                objectFit: 'contain',
                display: 'block',
              }}
              onError={(e) => {
                const container = (e.target as HTMLImageElement).parentElement;
                if (container) container.style.display = 'none';
              }}
            />
          </div>
        )}
      </div>

      {/* Labs section header */}
      <div style={{
        padding: '14px 20px 8px',
        flexShrink: 0,
      }}>
        <div style={{
          fontFamily: 'Onest, sans-serif',
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--tertiary-clr-100)',
          opacity: 0.6,
        }}>
          Labs in this building
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 20px' }}>
        {loading && (
          [0, 1, 2].map(i => (
            <div key={i} style={{ background: '#fff', border: '1px solid #e6e6e6', borderRadius: 8, padding: '14px 16px', marginBottom: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="skeleton-shimmer" style={{ height: 18, width: '70%' }} />
              <div className="skeleton-shimmer" style={{ height: 13, width: '90%' }} />
              <div className="skeleton-shimmer" style={{ height: 13, width: '75%' }} />
            </div>
          ))
        )}

        {!loading && error && (
          <div style={{
            fontFamily: 'Onest, sans-serif',
            fontSize: 14,
            color: '#c0392b',
            padding: '24px 8px',
            textAlign: 'center',
          }}>
            {error}
          </div>
        )}

        {!loading && !error && labs.length === 0 && (
          <div style={{
            fontFamily: 'Onest, sans-serif',
            fontSize: 14,
            color: 'var(--tertiary-clr-100)',
            opacity: 0.45,
            padding: '24px 8px',
            textAlign: 'center',
          }}>
            No labs found in this building.
          </div>
        )}

        {!loading && labs.map(lab => {
          const isNavigating = navigatingTo === lab.id;
          const isBlocked = navigatingTo !== null && !isNavigating;
          return (
            <div
              key={lab.id}
              onClick={() => {
                if (navigatingTo !== null) return;
                setNavigatingTo(lab.id);
                router.push(`/living-lab?id=${encodeURIComponent(lab.id)}`);
              }}
              style={{
                position: 'relative',
                background: '#fff',
                border: '1px solid #e6e6e6',
                borderRadius: 8,
                padding: '14px 16px',
                marginBottom: 10,
                cursor: isBlocked ? 'default' : 'pointer',
                opacity: isBlocked ? 0.5 : 1,
                transition: 'box-shadow 0.15s ease, opacity 0.15s ease',
              }}
              onMouseEnter={e => {
                if (navigatingTo !== null) return;
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                (e.currentTarget.children[0] as HTMLElement).style.color = 'var(--primary-clr-300)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = 'none';
                (e.currentTarget.children[0] as HTMLElement).style.color = 'var(--tertiary-clr-100)';
              }}
            >
              {/* Loading overlay for the card being navigated to */}
              {isNavigating && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1,
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.75s linear infinite' }}>
                    <circle cx="12" cy="12" r="10" stroke="var(--primary-clr-300)" strokeWidth="3" strokeDasharray="31.4 31.4" strokeLinecap="round" />
                  </svg>
                </div>
              )}

              <div style={{
                fontFamily: 'Onest, sans-serif',
                fontSize: 16,
                fontWeight: 700,
                color: 'var(--tertiary-clr-100)',
                marginBottom: lab.biography ? 6 : 0,
                transition: 'color 0.15s ease',
              }}>
                {lab.name ?? lab.id}
              </div>

              {lab.biography && (
                <div style={{
                  fontFamily: 'Onest, sans-serif',
                  fontSize: 13,
                  color: 'var(--tertiary-clr-100)',
                  opacity: 0.7,
                  lineHeight: 1.5,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}>
                  {lab.biography}
                </div>
              )}

              {(lab.start_date || lab.end_date) && (
                <div style={{
                  fontFamily: 'Onest, sans-serif',
                  fontSize: 11,
                  color: 'var(--primary-clr-300)',
                  marginTop: 8,
                }}>
                  {lab.start_date?.slice(0, 4)}
                  {lab.start_date && lab.end_date ? ' – ' : ''}
                  {lab.end_date?.slice(0, 4)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

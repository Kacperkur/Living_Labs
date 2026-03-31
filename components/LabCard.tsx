"use client";

import React, { useState } from 'react';
import Link from 'next/link';

const SDG_NAME_TO_NUMBER: Record<string, number> = {
  "No Poverty": 1,
  "Zero Hunger": 2,
  "Good Health and Well-being": 3,
  "Quality Education": 4,
  "Gender Equality": 5,
  "Clean Water and Sanitation": 6,
  "Affordable and Clean Energy": 7,
  "Decent Work and Economic Growth": 8,
  "Industry, Innovation and Infrastructure": 9,
  "Reduced Inequalities": 10,
  "Sustainable Cities and Communities": 11,
  "Responsible Consumption and Production": 12,
  "Climate Action": 13,
  "Life Below Water": 14,
  "Life on Land": 15,
  "Peace, Justice and Strong Institutions": 16,
  "Partnerships for the Goals": 17,
};

function formatDateRange(start: string | null, end: string | null): string {
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  if (!start) return '';
  const startStr = fmt(start);
  if (!end || end === start) return `${startStr} – Present`;
  return `${startStr} – ${fmt(end)}`;
}

export interface LabCardData {
  id: string;
  name: string | null;
  building: string | null;
  biography: string | null;
  start_date: string | null;
  end_date: string | null;
  SDGs: unknown[];
  media_count: number;
}

export default function LabCard({ lab }: { lab: LabCardData }) {
  const [flipped, setFlipped] = useState(false);

  const dateRange = formatDateRange(lab.start_date, lab.end_date);

  // Truncate biography for the back face
  const bio = lab.biography ?? '';
  const bioTruncated = bio.length > 200 ? bio.slice(0, 200).trimEnd() + '…' : bio;

  const sdgNums = lab.SDGs.map(sdg => {
    const name = typeof sdg === 'string' ? sdg : ((sdg as any)?.name || (sdg as any)?.content_url || '');
    return SDG_NAME_TO_NUMBER[name] ?? null;
  }).filter((n): n is number => n !== null);

  return (
    <div
      style={{ perspective: '1000px', width: 280, height: 360, cursor: 'pointer', flexShrink: 0 }}
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
    >
      {/* Inner — flips in 3D */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* ── FRONT ── */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            borderRadius: 16,
            overflow: 'hidden',
            boxShadow: '0 4px 24px rgba(0,33,71,0.13)',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--background-clr-400)',
            border: '1px solid #dde3eb',
          }}
        >
          {/* Building image */}
          <div style={{ flex: '0 0 180px', overflow: 'hidden', background: '#c8d6e5', position: 'relative' }}>
            {lab.building ? (
              <img
                src={`/lab_images/${lab.building}.jpg`}
                alt={lab.building}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div style={{
                width: '100%', height: '100%',
                background: 'linear-gradient(135deg, var(--primary-clr-300), var(--tertiary-clr-100))',
              }} />
            )}
          </div>

          {/* Text */}
          <div style={{ flex: 1, padding: '16px 18px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{
              fontFamily: 'Onest, sans-serif',
              fontSize: 17,
              fontWeight: 700,
              color: 'var(--tertiary-clr-100)',
              lineHeight: 1.3,
              marginBottom: 8,
            }}>
              {lab.name ?? 'Unnamed Lab'}
            </div>
            {dateRange && (
              <div style={{
                fontFamily: 'Onest, sans-serif',
                fontSize: 12,
                color: '#6b7e96',
              }}>
                {dateRange}
              </div>
            )}
          </div>
        </div>

        {/* ── BACK ── */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            borderRadius: 16,
            overflow: 'hidden',
            boxShadow: '0 4px 24px rgba(0,33,71,0.18)',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--tertiary-clr-100)',
            padding: '20px 18px 16px',
            boxSizing: 'border-box',
          }}
        >
          {/* Lab name on back */}
          <div style={{
            fontFamily: 'Onest, sans-serif',
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--primary-clr-300)',
            marginBottom: 10,
            lineHeight: 1.2,
          }}>
            {lab.name ?? 'Unnamed Lab'}
          </div>

          {/* Biography */}
          {bioTruncated && (
            <div style={{
              fontFamily: 'Onest, sans-serif',
              fontSize: 12,
              color: 'rgba(255,255,255,0.85)',
              lineHeight: 1.5,
              flex: 1,
              overflow: 'hidden',
            }}>
              {bioTruncated}
            </div>
          )}

          {/* SDG icons */}
          {sdgNums.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, margin: '10px 0 8px' }}>
              {sdgNums.map(num => (
                <img
                  key={num}
                  src={`https://firebasestorage.googleapis.com/v0/b/livinglabs-1a831.firebasestorage.app/o/E-WEB-Goal-${String(num).padStart(2, '0')}.png?alt=media`}
                  alt={`SDG ${num}`}
                  title={`SDG ${num}`}
                  style={{ width: 32, height: 32, objectFit: 'contain', borderRadius: 3 }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ))}
            </div>
          )}

          {/* Footer: media count + visit button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
            <div style={{ fontFamily: 'Onest, sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
              {lab.media_count} {lab.media_count === 1 ? 'media item' : 'media items'}
            </div>
            <Link href={`/living-lab?id=${encodeURIComponent(lab.id)}`} style={{ textDecoration: 'none' }}>
              <button
                style={{
                  fontFamily: 'Onest, sans-serif',
                  fontSize: 12,
                  fontWeight: 600,
                  background: 'var(--primary-clr-300)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 20,
                  padding: '6px 16px',
                  cursor: 'pointer',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                Visit Lab
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

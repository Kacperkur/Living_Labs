"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { MediaDetailPanelProps, Lab, formatDate } from '../types';
import type { LabDetailsResponse } from '../app/api/lab-details/route';

// Client-side in-memory cache — avoids re-fetching the same lab when the user
// closes the panel and opens the same result again.
const labCache = new Map<string, LabDetailsResponse>();

export default function MediaDetailPanel({ selectedMedia, onClose }: MediaDetailPanelProps) {
  const [labInfo, setLabInfo] = useState<Lab | null>(null);
  const [building, setBuilding] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchLabInfo = async () => {
      if (!selectedMedia) return;

      const labId = selectedMedia?.lab_id || selectedMedia?.metadata?.lab_id;
      if (!labId) return;

      // Serve from client cache if we already fetched this lab
      const cached = labCache.get(labId);
      if (cached) {
        setLabInfo(cached as unknown as Lab);
        setBuilding(cached.building);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`/api/lab-details?id=${encodeURIComponent(labId)}`);
        if (!res.ok) {
          console.error(`❌ Failed to fetch lab details (${res.status})`);
          return;
        }
        const data: LabDetailsResponse = await res.json();
        labCache.set(labId, data);
        setLabInfo(data as unknown as Lab);
        setBuilding(data.building);
      } catch (error: unknown) {
        console.error('❌ Error fetching lab details:', error instanceof Error ? error.message : error);
      } finally {
        setLoading(false);
      }
    };

    fetchLabInfo();
  }, [selectedMedia]);

  if (!selectedMedia) return null;

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      borderLeft: '2px solid #e0e0e0',
      backgroundColor: 'var(--background-clr-400)',
      overflowY: 'auto',
      position: 'relative'
    }}>
      {/* Close button */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 10,
          background: 'var(--background-clr-400)',
          border: 'none',
          borderRadius: '50%',
          width: 40,
          height: 40,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 24,
          fontWeight: 'bold',
          color: '#333',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 1)';
          e.currentTarget.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        ×
      </button>

      {/* Lab Information & Image */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        paddingBottom: 24,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center'
      }}>
        {/* Location Image */}
        {building && (
          <div style={{
            width: '100%',
            backgroundColor: 'var(--background-clr-400)',
            position: 'relative',
            borderRadius: 8
          }}>
            <img
              src={`https://firebasestorage.googleapis.com/v0/b/livinglabs-1a831.firebasestorage.app/o/${encodeURIComponent(building)}.jpg?alt=media`}
              alt={building}
              style={{
                width: '100%',
                height: 'auto',
                paddingBottom: 16,
                objectFit: 'contain',
                display: 'block'
              }}
              onError={(e) => {
                const container = (e.target as HTMLImageElement).parentElement;
                if (container) container.style.display = 'none';
              }}
            />
          </div>
        )}

        {loading ? (
          <div style={{
            fontFamily: 'Onest, sans-serif',
            fontSize: 16,
            color: '#666',
            textAlign: 'center',
            marginTop: 40
          }}>
            Loading lab information...
          </div>
        ) : labInfo ? (
          <>
            {/* Lab Name */}
            {labInfo.name && (
              <h2 style={{
                fontFamily: 'Onest, sans-serif',
                fontSize: 28,
                fontWeight: 700,
                color: 'var(--tertiary-clr-100)',
                marginTop: 0,
                marginBottom: 16,
                lineHeight: 1.3
              }}>
                {labInfo.name}
              </h2>
            )}

            {/* Location */}
            {labInfo.location && (
              <div style={{
                fontFamily: 'Onest, sans-serif',
                fontSize: 16,
                color: 'var(--tertiary-clr-100)',
                marginBottom: 16
              }}>
                {labInfo.location}
              </div>
            )}

            {/* Start Date - End Date */}
            {labInfo.start_date && (
              <div style={{
                fontFamily: 'Onest, sans-serif',
                fontSize: 14,
                color: 'var(--tertiary-clr-100)',
                marginBottom: 16
              }}>
                {formatDate(labInfo.start_date)} - {labInfo.start_date === labInfo.end_date || !labInfo.end_date ? 'Present' : formatDate(labInfo.end_date)}
              </div>
            )}

            {/* Biography */}
            {labInfo.biography && (
              <div style={{
                fontFamily: 'Onest, sans-serif',
                fontSize: 14,
                color: '#555',
                marginTop: 4,
                marginBottom: 20,
                lineHeight: 1.6,
                padding: 16,
                backgroundColor: 'var(--background-clr-400)',
                borderRadius: 6,
                border: '1px solid #e0e0e0'
              }}>
                {labInfo.biography}
              </div>
            )}

            {/* SDGs Icons */}
            {labInfo.SDGs && labInfo.SDGs.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 8,
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {labInfo.SDGs.map((sdg, index) => {
                    const SDG_NAME_TO_NUMBER: Record<string, number> = {
                      'No Poverty': 1,
                      'Zero Hunger': 2,
                      'Good Health and Well-Being': 3,
                      'Quality Education': 4,
                      'Gender Equality': 5,
                      'Clean Water and Sanitation': 6,
                      'Affordable and Clean Energy': 7,
                      'Decent Work and Economic Growth': 8,
                      'Industry, Innovation, and Infrastructure': 9,
                      'Reduced Inequalities': 10,
                      'Sustainable Cities and Communities': 11,
                      'Responsible Consumption and Production': 12,
                      'Climate Action': 13,
                      'Life Below Water': 14,
                      'Life on Land': 15,
                      'Peace, Justice, and Strong Institutions': 16,
                      'Partnerships for the Goals': 17,
                    };
                    const name = typeof sdg === 'string' ? sdg : (sdg?.name || sdg?.content_url || '');
                    const num = SDG_NAME_TO_NUMBER[name];
                    if (!num) {
                      console.warn('Unknown SDG name:', name);
                      return null;
                    }
                    const imagePath = `https://firebasestorage.googleapis.com/v0/b/livinglabs-1a831.firebasestorage.app/o/E-WEB-Goal-${String(num).padStart(2, '0')}.png?alt=media`;
                    
                    return (
                      <img
                        key={index}
                        src={imagePath}
                        alt={name}
                        title={name}
                        style={{
                          width: 64,
                          height: 64,
                          objectFit: 'contain',
                          display: 'block',
                          borderRadius: 4,
                          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                        }}
                        onLoad={(e) => {
                          const img = e.target as HTMLImageElement;
                          console.log(`✅ SDG Icon loaded successfully: ${imagePath} (${img.naturalWidth}x${img.naturalHeight})`);
                        }}
                        onError={(e) => {
                          console.error(`❌ SDG Icon failed to load: ${imagePath}`);
                          const target = e.target as HTMLImageElement;
                          // Replace with text fallback
                          const div = document.createElement('div');
                          div.style.cssText = 'padding: 8px 12px; background-color: var(--background-clr-400); border-radius: 4px; font-family: Onest, sans-serif; font-size: 12px; color: var(--tertiary-clr-100); border: 1px solid #ddd;';
                          div.textContent = name;
                          target.parentNode?.replaceChild(div, target);
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Visit Lab Button */}
            <Link href={`/living-lab?id=${encodeURIComponent(selectedMedia?.lab_id || selectedMedia?.metadata?.lab_id || '')}`} style={{ textDecoration: 'none' }}>
              <button
                style={{
                  display: 'inline-block',
                  marginTop: 16,
                  padding: '12px 32px',
                  backgroundColor: 'var(--primary-clr-300)',
                  color: '#fff',
                  fontFamily: 'Onest, sans-serif',
                  fontSize: 16,
                  fontWeight: 600,
                  border: 'none',
                  borderRadius: 24,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#0066cc';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--primary-clr-300)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                Visit Lab
              </button>
            </Link>
          </>
        ) : (
          <div style={{
            fontFamily: 'Onest, sans-serif',
            fontSize: 14,
            color: '#666',
            textAlign: 'center',
            marginTop: 40
          }}>
            No lab information available
          </div>
        )}
      </div>
    </div>
  );
}

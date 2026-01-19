"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

type MediaDetailPanelProps = {
  selectedMedia: any;
  onClose: () => void;
};

type LabInfo = {
  id: string;
  name: string | null;
  location: string | null;
  start_date: string | null;
  end_date: string | null;
  biography: string | null;
  SDGs: Array<{ content_url?: string; name?: string }>;
};

export default function MediaDetailPanel({ selectedMedia, onClose }: MediaDetailPanelProps) {
  const [labInfo, setLabInfo] = useState<LabInfo | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchLabInfo = async () => {
      if (!selectedMedia) return;
      
      const labId = selectedMedia?.lab_id || selectedMedia?.labId || selectedMedia?.metadata?.lab_id;
      if (!labId) return;

      setLoading(true);
      try {
        console.log(`🔍 Fetching lab info for lab_id: ${labId}`);
        const response = await fetch(`/api/fetch-lab-info?id=${encodeURIComponent(labId)}`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          console.error(`❌ Failed to fetch lab info (${response.status}):`, errorData);
          return;
        }
        
        const data = await response.json();
        console.log('✅ Lab Info:', data);
        setLabInfo(data);
      } catch (error) {
        console.error('❌ Error fetching lab info:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLabInfo();
  }, [selectedMedia]);

  if (!selectedMedia) return null;

  // Format date as "Month Name Day, Year"
  const formatDate = (dateStr: string | null): string | null => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return null;
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                          'July', 'August', 'September', 'October', 'November', 'December'];
      const month = monthNames[date.getMonth()];
      const day = date.getDate();
      const year = date.getFullYear();
      return `${month} ${day}, ${year}`;
    } catch {
      return null;
    }
  };

  return (
    <div style={{
      flex: '0 0 33.33%',
      display: 'flex',
      flexDirection: 'column',
      borderLeft: '2px solid #e0e0e0',
      backgroundColor: 'var(--background-clr-400)',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Location Image - 1/4 height */}
      {labInfo?.location && (
        <div style={{
          width: '100%',
          height: '25%',
          overflow: 'hidden',
          backgroundColor: 'var(--background-clr-400)',
          position: 'relative'
        }}>
          <img
            src={`/${labInfo.location}.jpg`}
            alt={labInfo.location}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block'
            }}
            onError={(e) => {
              // If image fails to load, try .png extension
              const target = e.target as HTMLImageElement;
              if (target.src.includes('.jpg')) {
                target.src = `/${labInfo.location}.png`;
              } else {
                // If still fails, hide the image container
                const container = target.parentElement;
                if (container) container.style.display = 'none';
              }
            }}
          />
        </div>
      )}

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

      {/* Lab Information */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: 24,
        paddingTop: labInfo?.location ? 24 : 64,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center'
      }}>
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
                    // SDG can be a filename string directly, or we need to extract it
                    let filename = null;
                    if (typeof sdg === 'string') {
                      filename = sdg;
                    } else if (typeof sdg === 'object' && sdg !== null) {
                      // Use the properties that exist on the SDG type
                      filename = sdg.content_url || sdg.name || null;
                    }
                    if (!filename) {
                      console.warn('Unable to extract filename from SDG:', sdg);
                      return null;
                    }
                    
                    // Ensure filename has .png extension if not already present
                    if (!filename.includes('.png') && !filename.includes('.jpg') && !filename.includes('.jpeg')) {
                      filename = `${filename}.png`;
                    }
                    
                    // Construct path to local file in public/SDG_pngs folder
                    const imagePath = `/SDG_pngs/${filename}`;
                    
                    console.log(`🎯 Loading SDG icon from: ${imagePath}`);
                    
                    return (
                      <img
                        key={index}
                        src={imagePath}
                        alt={`SDG ${filename}`}
                        title={`SDG ${filename}`}
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
                          div.textContent = filename;
                          target.parentNode?.replaceChild(div, target);
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Visit Lab Button */}
            <Link href="/living-lab" style={{ textDecoration: 'none' }}>
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

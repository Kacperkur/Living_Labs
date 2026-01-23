"use client";

import React from 'react';
import { ResultPanelProps, SearchResult, formatDate } from '../types';

export default function ResultPanel({ result, selectedId, onSelect }: ResultPanelProps) {

  // Deep serialize to remove any Firestore references that might have slipped through
  const safeResult = React.useMemo(() => {
    try {
      return JSON.parse(JSON.stringify(result));
    } catch (err) {
      console.warn('Failed to serialize result, using fallback:', err);
      return {
        id: result?.id || 'unknown',
        title: typeof result?.title === 'string' ? result.title : 'Untitled',
        author: typeof result?.author === 'string' ? result.author : '',
        content_url: null,
        lab_id: null,
        lab_name: null,
        published: null,
        collection: typeof result?.collection === 'string' ? result.collection as 'media' : 'media',
        score: 0
      };
    }
  }, [result]);

  const recordId = safeResult?.id || safeResult?.metadata?.id || null;
  const isSelected = recordId === selectedId;

  /*
    Resolve title from a number of common shapes returned by Firestore / search
    results. If your Firebase documents use a different shape, add that path
    here. Assumptions: title may live at result.title, result.metadata.title,
    result.record.metadata.title, result.data.title, result.fields.title.stringValue,
    or result.doc.data().title. Falls back to recordId or 'Untitled'.
  */
  function resolveTitle(r: SearchResult): string {
    if (!r) return 'Untitled';
    return (
      r.title ||
      r.metadata?.title ||
      r.fields?.title ||
      recordId ||
      'Untitled'
    );
  }
  const title = resolveTitle(safeResult);
  const authorsRaw = safeResult?.authors || safeResult?.author || safeResult?.metadata?.authors || safeResult?.record?.metadata?.authors || null;
  const authors = Array.isArray(authorsRaw) ? authorsRaw.join(', ') : (typeof authorsRaw === 'string' ? authorsRaw : '');
  
  // Get content_url for media preview
  const contentUrl = safeResult?.content_url || safeResult?.previewUrl || safeResult?.metadata?.content_url || safeResult?.metadata?.previewUrl || null;
  
  // Get lab_id and lab_name (now included from firebase-enrich)
  const labId = safeResult?.lab_id || safeResult?.labId || safeResult?.metadata?.lab_id || safeResult?.fields?.lab_id || null;
  const labName = safeResult?.labName || safeResult?.lab_name || safeResult?.metadata?.labName || safeResult?.metadata?.lab_name || null;
  
  // Get published date
  const publishedRaw = safeResult?.published || safeResult?.metadata?.published || safeResult?.fields?.published || null;
  const published = formatDate(publishedRaw);

  const hasPreview = !!contentUrl;

  if (hasPreview) {
    return (
      <div 
        style={{ 
          width: '100vw', 
          boxSizing: 'border-box', 
          padding: 16, 
          background: isSelected ? 'rgba(117, 178, 221, 0.15)' : 'var(--background-clr-400)', 
          borderBottom: '1px solid #eee', 
          cursor: 'pointer',
          borderLeft: isSelected ? '4px solid var(--primary-clr-300)' : '4px solid transparent',
          boxShadow: isSelected ? 'inset 0 4px 6px rgba(0, 0, 0, 0.1)' : 'none',
          transition: 'all 0.2s ease'
        }}
        onClick={(e) => {
          if (onSelect) {
            onSelect(isSelected ? null : recordId);
          }
        }}
      >
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <div 
            style={{ 
              width: 160, 
              height: 100, 
              background: 'var(--background-clr-400)', 
              border: '1px solid #ddd', 
              borderRadius: 6, 
              overflow: 'hidden', 
              flex: '0 0 160px',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {/* Enhanced media handling: images, videos with thumbnails, and other content */}
            {contentUrl && (contentUrl.includes('.jpg') || contentUrl.includes('.jpeg') || contentUrl.includes('.png') || contentUrl.includes('.gif') || contentUrl.includes('.webp')) ? (
              /* Image files */
              <img 
                src={contentUrl} 
                alt={title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center',
                  display: 'block'
                }}
                onLoad={(e) => {
                  const img = e.target as HTMLImageElement;
                  console.log(`📸 Image loaded: ${img.naturalWidth}x${img.naturalHeight} for "${title}"`);
                }}
                onError={(e) => {
                  console.warn(`❌ Image failed to load: ${contentUrl}`);
                  const target = e.target as HTMLImageElement;
                  const iframe = document.createElement('iframe');
                  iframe.src = contentUrl;
                  iframe.style.cssText = 'width: 100%; height: 100%; border: 0;';
                  iframe.title = title;
                  target.parentNode?.replaceChild(iframe, target);
                }}
              />
            ) : contentUrl && (contentUrl.includes('.mp4') || contentUrl.includes('.webm') || contentUrl.includes('.mov') || contentUrl.includes('.avi')) ? (
              /* Video files - show only thumbnail, no interaction */
              <div style={{ 
                position: 'relative', 
                width: '100%', 
                height: '100%',
                background: 'var(--background-clr-400)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <video
                  src={contentUrl}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center',
                    pointerEvents: 'none' // Disable all video interactions
                  }}
                  preload="metadata" // Loads just enough to get first frame
                  muted
                  playsInline
                  controls={false} // Explicitly disable controls
                  onLoadedMetadata={(e) => {
                    // Seek to 1 second to get a better thumbnail than 0:00
                    const video = e.target as HTMLVideoElement;
                    video.currentTime = 1;
                  }}
                  onPlay={(e) => {
                    // Prevent any accidental playback
                    const video = e.target as HTMLVideoElement;
                    video.pause();
                    video.currentTime = 1;
                  }}
                />
                {/* Optional: Add a subtle indicator that this is a video */}
                <div style={{
                  position: 'absolute',
                  bottom: 8,
                  right: 8,
                  backgroundColor: 'var(--background-clr-400)',
                  color: 'white',
                  padding: '2px 6px',
                  borderRadius: 4,
                  fontFamily: 'Onest, sans-serif',
                  fontSize: 10,
                  fontWeight: 600,
                  pointerEvents: 'none'
                }}>
                  VIDEO
                </div>
              </div>
            ) : (
              /* Other content (PDFs, etc.) */
              <iframe 
                src={contentUrl!} 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  border: 0
                }} 
                title={title}
              />
            )}
          </div>

          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {/* Title in Onest, 24px - links directly to content_url */}
              {contentUrl ? (
                <a 
                  href={contentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ 
                    fontFamily: 'Onest, sans-serif', 
                    fontSize: 24, 
                    fontWeight: 700, 
                    marginBottom: 6, 
                    color: 'var(--tertiary-clr-100)',
                    cursor: 'pointer',
                    textDecoration: 'none',
                    transition: 'color 0.2s'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#0066cc')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--tertiary-clr-100)')}
                  onClick={(e) => e.stopPropagation()} // Prevent div click from triggering
                >
                  {title}
                </a>
              ) : (
                <div 
                  style={{ 
                    fontFamily: 'Onest, sans-serif', 
                    fontSize: 24, 
                    fontWeight: 700, 
                    marginBottom: 6, 
                    color: 'var(--tertiary-clr-100)'
                  }}
                >
                  {title}
                </div>
              )}
              {/* Path badge (removed collection display) */}
              <div style={{ textAlign: 'right' }}>
                {safeResult?.path && typeof safeResult.path === 'string' && (
                  <div style={{ fontFamily: 'Onest, sans-serif', fontSize: 11, color: 'var(--tertiary-clr-100)', maxWidth: 360, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{safeResult.path}</div>
                )}
              </div>
            </div>

            {/* Authors in Onest, 8px */}
            <div style={{ fontFamily: 'Onest, sans-serif', fontSize: 12, color: 'var(--tertiary-clr-100)', marginBottom: 8 }}>{authors}</div>

            {/* Lab Name */}
            <div style={{ fontFamily: 'Onest, sans-serif', fontSize: 12, color: 'var(--tertiary-clr-100)', marginTop: 4 }}>
              {labName ? (
                <span>Lab: {labName}</span>
              ) : labId ? (
                <span>Lab ID: {labId}</span>
              ) : null}
            </div>

            {/* Published Date */}
            {published && (
              <div style={{ fontFamily: 'Onest, sans-serif', fontSize: 12, color: 'var(--tertiary-clr-100)', marginTop: 2 }}>
                Published: {published}
              </div>
            )}

            {/* Fallback snippet or metadata */}
            {(safeResult?.metadata?.snippet || safeResult?.record?.metadata?.snippet) && (
              <div style={{ fontFamily: 'Onest, sans-serif', fontSize: 13, color: 'var(--tertiary-clr-100)' }}>
                {typeof safeResult?.metadata?.snippet === 'string' ? safeResult.metadata.snippet : 
                 typeof safeResult?.record?.metadata?.snippet === 'string' ? safeResult.record.metadata.snippet : ''}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // No-preview variant: centered, narrower card with vertically centered title/authors
  return (
    <div 
      style={{ 
        width: '100vw', 
        boxSizing: 'border-box', 
        padding: 16, 
        background: isSelected ? 'rgba(117, 178, 221, 0.15)' : 'var(--background-clr-400)', 
        borderBottom: '1px solid #eee',
        cursor: 'pointer',
        borderLeft: isSelected ? '4px solid var(--primary-clr-300)' : '4px solid transparent',
        boxShadow: isSelected ? 'inset 0 4px 6px rgba(0, 0, 0, 0.1)' : 'none',
        transition: 'all 0.2s ease'
      }}
      onClick={() => {
        if (onSelect) {
          onSelect(isSelected ? null : recordId);
        }
      }}
    >
      <div style={{ maxWidth: 780, margin: '0 auto', background: 'var(--background-clr-400)', border: '1px solid #e6e6e6', borderRadius: 8, padding: 20, display: 'flex', alignItems: 'center', minHeight: 120 }}>
        <div style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontFamily: 'Onest, sans-serif', fontSize: 24, fontWeight: 700, marginBottom: 8, color: 'var(--tertiary-clr-100)' }}>{title}</div>
            <div style={{ textAlign: 'right' }}>
              {safeResult?.path && typeof safeResult.path === 'string' && (
                <div style={{ fontFamily: 'Onest, sans-serif', fontSize: 11, color: 'var(--tertiary-clr-100)', maxWidth: 360, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{safeResult.path}</div>
              )}
            </div>
          </div>
          <div style={{ fontFamily: 'Onest, sans-serif', fontSize: 8, color: 'var(--tertiary-clr-100)' }}>{authors}</div>
          <div style={{ fontFamily: 'Onest, sans-serif', fontSize: 12, color: 'var(--tertiary-clr-100)', marginTop: 6 }}>
            {labName ? (
              <span>Lab: {labName}</span>
            ) : labId ? (
              <span>Lab ID: {labId}</span>
            ) : null}
          </div>
          {/* Published Date */}
          {published && (
            <div style={{ fontFamily: 'Onest, sans-serif', fontSize: 12, color: 'var(--tertiary-clr-100)', marginTop: 2 }}>
              Published: {published}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

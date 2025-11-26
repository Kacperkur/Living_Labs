"use client";

import React, { useState, useEffect } from 'react';

type Result = {
  id?: string;
  title?: string;
  authors?: string[] | string;
  previewUrl?: string | null;
  [k: string]: any;
};

export default function ResultPanel({ result }: { result: Result }) {
  const [labName, setLabName] = useState<string | null>(null);
  const [loadingLabName, setLoadingLabName] = useState(false);

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
        collection: typeof result?.collection === 'string' ? result.collection : null,
        path: typeof result?.path === 'string' ? result.path : null
      };
    }
  }, [result]);

  const recordId = safeResult?.id || safeResult?.record?.id || safeResult?.record?.metadata?.id || safeResult?.metadata?.id || null;

  /*
    Resolve title from a number of common shapes returned by Firestore / search
    results. If your Firebase documents use a different shape, add that path
    here. Assumptions: title may live at result.title, result.metadata.title,
    result.record.metadata.title, result.data.title, result.fields.title.stringValue,
    or result.doc.data().title. Falls back to recordId or 'Untitled'.
  */
  function resolveTitle(r: any) {
    if (!r) return 'Untitled';
    return (
      r.title ||
      r.metadata?.title ||
      r.record?.metadata?.title ||
      r.data?.title ||
      // Firestore REST / structured fields
      r.fields?.title?.stringValue ||
      r.fields?.title?.value ||
      // some libraries wrap document under `doc` or `record`
      r.doc?.data?.title ||
      (typeof r.data === 'function' ? r.data().title : undefined) ||
      recordId ||
      'Untitled'
    );
  }
  const title = resolveTitle(safeResult);
  const authorsRaw = safeResult?.authors || safeResult?.author || safeResult?.metadata?.authors || safeResult?.record?.metadata?.authors || null;
  const authors = Array.isArray(authorsRaw) ? authorsRaw.join(', ') : (typeof authorsRaw === 'string' ? authorsRaw : '');
  
  // Get content_url for media preview
  const contentUrl = safeResult?.content_url || safeResult?.previewUrl || safeResult?.metadata?.content_url || safeResult?.metadata?.previewUrl || null;
  
  // Get lab_id
  const labId = safeResult?.lab_id || safeResult?.metadata?.lab_id || safeResult?.fields?.lab_id || null;

  // Fetch lab name when lab_id changes
  useEffect(() => {
    async function fetchLabName() {
      if (!labId || typeof labId !== 'string') {
        setLabName(null);
        return;
      }

      setLoadingLabName(true);
      try {
        const response = await fetch('/api/get-lab-name', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lab_id: labId })
        });

        if (response.ok) {
          const data = await response.json();
          setLabName(data.labName || null);
        } else {
          console.warn('Failed to fetch lab name:', response.status);
          setLabName(null);
        }
      } catch (error) {
        console.warn('Error fetching lab name:', error);
        setLabName(null);
      } finally {
        setLoadingLabName(false);
      }
    }

    fetchLabName();
  }, [labId]);

  const hasPreview = !!contentUrl;

  if (hasPreview) {
    return (
      <div style={{ width: '100vw', boxSizing: 'border-box', padding: 16, background: '#f9fafb', borderBottom: '1px solid #eee' }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <div style={{ 
            width: 320, 
            height: 200, 
            background: '#fff', 
            border: '1px solid #ddd', 
            borderRadius: 6, 
            overflow: 'hidden', 
            flex: '0 0 320px',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
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
                background: '#000',
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
                  backgroundColor: 'rgba(0, 0, 0, 0.6)',
                  color: 'white',
                  padding: '2px 6px',
                  borderRadius: 4,
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
              {/* Title in Onest, 24px */}
              <div style={{ fontFamily: 'Onest, sans-serif', fontSize: 24, fontWeight: 700, marginBottom: 6 }}>{title}</div>
              {/* Path badge (removed collection display) */}
              <div style={{ textAlign: 'right' }}>
                {safeResult?.path && typeof safeResult.path === 'string' && (
                  <div style={{ fontSize: 11, color: '#666', maxWidth: 360, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{safeResult.path}</div>
                )}
              </div>
            </div>

            {/* Authors in Onest, 8px */}
            <div style={{ fontFamily: 'Onest, sans-serif', fontSize: 12, color: '#333', marginBottom: 8 }}>{authors}</div>

            {/* Lab Name */}
            <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
              {loadingLabName ? (
                <span>Loading lab...</span>
              ) : labName ? (
                <span>Lab: {labName}</span>
              ) : labId ? (
                <span>Lab ID: {labId}</span>
              ) : null}
            </div>

            {/* Fallback snippet or metadata */}
            {(safeResult?.metadata?.snippet || safeResult?.record?.metadata?.snippet) && (
              <div style={{ fontSize: 13, color: '#444' }}>
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
    <div style={{ width: '100vw', boxSizing: 'border-box', padding: 16, background: '#f9fafb', borderBottom: '1px solid #eee' }}>
      <div style={{ maxWidth: 780, margin: '0 auto', background: '#fff', border: '1px solid #e6e6e6', borderRadius: 8, padding: 20, display: 'flex', alignItems: 'center', minHeight: 120 }}>
        <div style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontFamily: 'Onest, sans-serif', fontSize: 24, fontWeight: 700, marginBottom: 8 }}>{title}</div>
            <div style={{ textAlign: 'right' }}>
              {safeResult?.path && typeof safeResult.path === 'string' && (
                <div style={{ fontSize: 11, color: '#666', maxWidth: 360, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{safeResult.path}</div>
              )}
            </div>
          </div>
          <div style={{ fontFamily: 'Onest, sans-serif', fontSize: 8, color: '#333' }}>{authors}</div>
          <div style={{ fontSize: 12, color: '#666', marginTop: 6 }}>
            {loadingLabName ? (
              <span>Loading lab...</span>
            ) : labName ? (
              <span>Lab: {labName}</span>
            ) : labId ? (
              <span>Lab ID: {labId}</span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

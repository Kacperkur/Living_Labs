"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Lab {
  id: string;
  name: string | null;
  location: string | null;
  biography: string | null;
  start_date: string | null;
  end_date: string | null;
  SDGs: { name?: string }[];
}

interface MediaItem {
  id: string;
  title: string | null;
  author: string | null;
  content_url: string | null;
  published: string | null;
  lab_name: string | null;
}

type ContentMode = 'upload' | 'link';
type Step = 1 | 2;

const ACCEPTED = '.pdf,.jpg,.jpeg,.png,.gif,.webp,.mp4,.mov,.mp3,.m4a,.docx,.doc,.xlsx,.xls';
const ACCEPTED_LABEL = 'PDF, JPG, PNG, MP4, MP3, DOCX, XLSX and more · Max 100 MB';

const INPUT_STYLE: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 8,
  border: '1px solid #ddd',
  background: '#fff',
  fontSize: 14,
  fontFamily: 'Onest, sans-serif',
  color: 'var(--tertiary-clr-100)',
  outline: 'none',
  boxSizing: 'border-box',
};

const LABEL_STYLE: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--tertiary-clr-100)',
  opacity: 0.6,
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
  marginBottom: 6,
};

function fileIcon(type: string) {
  if (type.startsWith('image/')) return '🖼️';
  if (type.startsWith('video/')) return '🎬';
  if (type.startsWith('audio/')) return '🎵';
  if (type.includes('pdf')) return '📄';
  if (type.includes('word') || type.includes('doc')) return '📝';
  if (type.includes('sheet') || type.includes('excel') || type.includes('xls')) return '📊';
  return '📎';
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function LabAdminPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [lab, setLab] = useState<Lab | null>(null);
  const [labLoading, setLabLoading] = useState(true);
  const [labError, setLabError] = useState<string | null>(null);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [mediaLoading, setMediaLoading] = useState(true);

  // Multi-step form state
  const [step, setStep] = useState<Step>(1);
  const [contentMode, setContentMode] = useState<ContentMode>('upload');

  // Step 1 state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedLink, setPastedLink] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 2 state — resolvedUrl is set after step 1 completes
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [resolvedFileName, setResolvedFileName] = useState<string | null>(null);
  // resolvedPath is only set for Storage uploads (not pasted links) — used for cleanup
  const [resolvedPath, setResolvedPath] = useState<string | null>(null);
  // Ref so beforeunload / unmount handlers always see the latest path
  const pendingUploadRef = useRef<string | null>(null);
  const [title, setTitle] = useState('');
  const [authors, setAuthors] = useState<string[]>(['']);
  const [description, setDescription] = useState('');
  const [published, setPublished] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Fetch lab
  useEffect(() => {
    if (!id) return;
    fetch(`/api/all-labs?id=${encodeURIComponent(id)}`)
      .then(r => r.json())
      .then(d => { if (d.error) throw new Error(d.error); setLab(d.lab); })
      .catch(err => setLabError(err.message))
      .finally(() => setLabLoading(false));
  }, [id]);

  // Fetch existing media. Pass bust=true to skip the server cache (used after publishing).
  const fetchMedia = useCallback((bust = false) => {
    if (!id) return;
    setMediaLoading(true);
    const url = `/api/media-by-lab?id=${encodeURIComponent(id)}${bust ? '&nocache=1' : ''}`;
    fetch(url)
      .then(r => r.json())
      .then(d => setMedia(d.media ?? []))
      .catch(() => setMedia([]))
      .finally(() => setMediaLoading(false));
  }, [id]);

  useEffect(() => { fetchMedia(); }, [fetchMedia]);

  // Keep the ref in sync so unload handlers always see the latest path
  useEffect(() => {
    pendingUploadRef.current = resolvedPath;
  }, [resolvedPath]);

  // Delete a storage upload — used when the user abandons step 2
  const cancelUpload = useCallback((path: string) => {
    fetch('/api/delete-upload', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path }),
    }).catch(() => {});
  }, []);

  // Cleanup on page close / browser tab close (sendBeacon survives unload)
  // Cleanup on Next.js navigation away (component unmount)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (pendingUploadRef.current) {
        navigator.sendBeacon(
          '/api/delete-upload',
          new Blob([JSON.stringify({ path: pendingUploadRef.current })], { type: 'application/json' })
        );
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Component unmount = navigated away without publishing
      if (pendingUploadRef.current) {
        navigator.sendBeacon(
          '/api/delete-upload',
          new Blob([JSON.stringify({ path: pendingUploadRef.current })], { type: 'application/json' })
        );
      }
    };
  }, []);

  // File handling
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) { setSelectedFile(file); setUploadError(null); }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setSelectedFile(file); setUploadError(null); }
  };

  // Step 1 → Step 2: upload file or validate link
  const handleStep1Continue = async () => {
    setUploadError(null);

    if (contentMode === 'link') {
      const url = pastedLink.trim();
      if (!url) { setUploadError('Please paste a URL.'); return; }
      try { new URL(url); } catch { setUploadError('Please enter a valid URL.'); return; }
      setResolvedUrl(url);
      setResolvedFileName(null);
      setStep(2);
      return;
    }

    // Upload file
    if (!selectedFile) { setUploadError('Please select a file.'); return; }
    if (!lab) return;

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', selectedFile);
      fd.append('lab_id', lab.id);
      const res = await fetch('/api/upload-media', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setResolvedUrl(data.url);
      setResolvedFileName(data.name);
      setResolvedPath(data.path);
      setStep(2);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // Step 2 → Save to Firestore
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lab || !resolvedUrl) return;
    if (!title.trim()) { setSaveStatus({ type: 'error', message: 'Title is required.' }); return; }

    setSaving(true);
    setSaveStatus(null);

    try {
      const res = await fetch('/api/add-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          authors: authors.map(a => a.trim()).filter(Boolean),
          description: description.trim() || null,
          content_url: resolvedUrl,
          published: published || null,
          lab_id: lab.id,
          lab_name: lab.name,
          location: lab.location,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');

      setSaveStatus({ type: 'success', message: `"${title.trim()}" published successfully.` });
      // File is now saved in Firestore — clear the pending ref so cleanup hooks don't delete it
      setResolvedPath(null);

      // Reset form back to step 1
      setTimeout(() => {
        setStep(1);
        setTitle('');
        setAuthors(['']);
        setDescription('');
        setPublished('');
        setResolvedUrl(null);
        setResolvedFileName(null);
        setResolvedPath(null);
        setSelectedFile(null);
        setPastedLink('');
        setSaveStatus(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        fetchMedia(true);
      }, 1800);

    } catch (err) {
      setSaveStatus({ type: 'error', message: err instanceof Error ? err.message : 'Something went wrong.' });
    } finally {
      setSaving(false);
    }
  };

  // Author helpers
  const updateAuthor = (i: number, v: string) => setAuthors(p => p.map((a, j) => j === i ? v : a));
  const addAuthor = () => setAuthors(p => [...p, '']);
  const removeAuthor = (i: number) => setAuthors(p => p.filter((_, j) => j !== i));

  // ── Loading / error states ──────────────────────────────────────────────────

  if (labLoading) return (
    <div style={{ minHeight: '100vh', background: 'var(--background-clr-400)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Onest, sans-serif', color: 'var(--tertiary-clr-100)', opacity: 0.4 }}>
      Loading lab…
    </div>
  );

  if (labError || !lab) return (
    <div style={{ minHeight: '100vh', background: 'var(--background-clr-400)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, fontFamily: 'Onest, sans-serif' }}>
      <p style={{ color: '#c0392b', fontSize: 14 }}>{labError ?? 'Lab not found.'}</p>
      <button onClick={() => router.push('/admin')} style={{ background: 'none', border: 'none', color: 'var(--primary-clr-300)', fontSize: 14, cursor: 'pointer' }}>← Back to admin</button>
    </div>
  );

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background-clr-400)', fontFamily: 'Onest, sans-serif' }}>

      {/* Header */}
      <div style={{ background: 'var(--tertiary-clr-100)', padding: '20px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary-clr-300)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>Admin Portal</div>
          <h1 style={{ fontFamily: 'Quantico, sans-serif', fontSize: 22, fontWeight: 700, color: '#fff', margin: 0 }}>{lab.name ?? 'Unnamed Lab'}</h1>
        </div>
        <button onClick={() => router.push('/admin')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: 13, cursor: 'pointer', fontFamily: 'Onest, sans-serif' }}>
          ← All labs
        </button>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 24px' }}>

        {/* Lab info card */}
        <div style={{ background: '#fff', border: '1px solid #e6e6e6', borderRadius: 12, padding: '24px', marginBottom: 32 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
            <div style={{ flex: '1 1 180px' }}>
              <div style={LABEL_STYLE}>Location</div>
              <div style={{ fontSize: 14, color: 'var(--tertiary-clr-100)' }}>{lab.location ?? '—'}</div>
            </div>
            <div style={{ flex: '1 1 180px' }}>
              <div style={LABEL_STYLE}>Active Period</div>
              <div style={{ fontSize: 14, color: 'var(--tertiary-clr-100)' }}>
                {lab.start_date ? lab.start_date.slice(0, 10) : '—'} → {lab.end_date ? lab.end_date.slice(0, 10) : 'present'}
              </div>
            </div>
            <div style={{ flex: '1 1 180px' }}>
              <div style={LABEL_STYLE}>Lab ID</div>
              <div style={{ fontSize: 12, color: 'var(--tertiary-clr-100)', opacity: 0.45, fontFamily: 'monospace', wordBreak: 'break-all' }}>{lab.id}</div>
            </div>
            {lab.biography && (
              <div style={{ flex: '1 1 100%' }}>
                <div style={LABEL_STYLE}>About</div>
                <div style={{ fontSize: 14, color: 'var(--tertiary-clr-100)', lineHeight: 1.6 }}>{lab.biography}</div>
              </div>
            )}
            {lab.SDGs.length > 0 && (
              <div style={{ flex: '1 1 100%' }}>
                <div style={LABEL_STYLE}>SDGs</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {lab.SDGs.map((sdg, i) => (
                    <span key={i} style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary-clr-300)', background: 'rgba(117,178,221,0.12)', borderRadius: 6, padding: '4px 10px' }}>{sdg.name}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Add Media card ───────────────────────────────────────────────── */}
        <div style={{ background: '#fff', border: '1px solid #e6e6e6', borderRadius: 12, padding: '28px', marginBottom: 32 }}>

          {/* Step indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 28 }}>
            {[{ n: 1, label: 'Upload Content' }, { n: 2, label: 'Add Details' }].map(({ n, label }, idx) => {
              const active = step === n;
              const done = step > n;
              return (
                <div key={n} style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 700,
                      background: done ? '#27ae60' : active ? 'var(--tertiary-clr-100)' : '#e8e8e8',
                      color: done || active ? '#fff' : '#aaa',
                      transition: 'all 0.2s',
                    }}>
                      {done ? '✓' : n}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: active ? 'var(--tertiary-clr-100)' : '#aaa' }}>{label}</span>
                  </div>
                  {idx < 1 && (
                    <div style={{ width: 40, height: 2, background: done ? '#27ae60' : '#e8e8e8', margin: '0 12px', transition: 'background 0.3s' }} />
                  )}
                </div>
              );
            })}
          </div>

          {/* ── STEP 1: Upload or link ────────────────────────────────────── */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Mode toggle */}
              <div style={{ display: 'flex', background: '#f4f4f4', borderRadius: 8, padding: 3, width: 'fit-content' }}>
                {(['upload', 'link'] as ContentMode[]).map(mode => (
                  <button key={mode} type="button" onClick={() => { setContentMode(mode); setUploadError(null); }}
                    style={{
                      padding: '7px 20px', borderRadius: 6, border: 'none', fontSize: 13, fontWeight: 600,
                      fontFamily: 'Onest, sans-serif', cursor: 'pointer', transition: 'all 0.15s',
                      background: contentMode === mode ? '#fff' : 'transparent',
                      color: contentMode === mode ? 'var(--tertiary-clr-100)' : '#999',
                      boxShadow: contentMode === mode ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    }}>
                    {mode === 'upload' ? '⬆ Upload File' : '🔗 Paste Link'}
                  </button>
                ))}
              </div>

              {/* Upload zone */}
              {contentMode === 'upload' && (
                <div>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    style={{
                      border: `2px dashed ${dragOver ? 'var(--primary-clr-300)' : '#ddd'}`,
                      borderRadius: 10, padding: '40px 24px', textAlign: 'center', cursor: 'pointer',
                      background: dragOver ? 'rgba(117,178,221,0.06)' : '#fafafa',
                      transition: 'all 0.15s',
                    }}
                  >
                    {selectedFile ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                        <span style={{ fontSize: 32 }}>{fileIcon(selectedFile.type)}</span>
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--tertiary-clr-100)' }}>{selectedFile.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--tertiary-clr-100)', opacity: 0.5 }}>{formatBytes(selectedFile.size)}</div>
                        </div>
                        <button type="button"
                          onClick={e => { e.stopPropagation(); setSelectedFile(null); setUploadError(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                          style={{ marginLeft: 8, background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#bbb' }}>
                          ×
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: 36, marginBottom: 10 }}>📁</div>
                        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--tertiary-clr-100)', marginBottom: 6 }}>
                          Drop a file here or <span style={{ color: 'var(--primary-clr-300)' }}>browse</span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--tertiary-clr-100)', opacity: 0.4 }}>{ACCEPTED_LABEL}</div>
                      </div>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept={ACCEPTED} onChange={handleFileChange} style={{ display: 'none' }} />
                </div>
              )}

              {/* Link input */}
              {contentMode === 'link' && (
                <div>
                  <label style={LABEL_STYLE}>Content URL</label>
                  <input type="url" value={pastedLink} onChange={e => { setPastedLink(e.target.value); setUploadError(null); }}
                    placeholder="https://example.com/paper.pdf"
                    style={INPUT_STYLE} />
                </div>
              )}

              {/* Error */}
              {uploadError && (
                <div style={{ fontSize: 13, color: '#c0392b', fontWeight: 600 }}>✕ {uploadError}</div>
              )}

              {/* Continue button */}
              <div>
                <button type="button" onClick={handleStep1Continue} disabled={uploading}
                  style={{
                    background: uploading ? '#ccc' : 'var(--tertiary-clr-100)',
                    color: '#fff', border: 'none', borderRadius: 8, padding: '12px 28px',
                    fontSize: 14, fontWeight: 600, fontFamily: 'Onest, sans-serif',
                    cursor: uploading ? 'default' : 'pointer', transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { if (!uploading) e.currentTarget.style.background = 'var(--primary-clr-300)'; }}
                  onMouseLeave={e => { if (!uploading) e.currentTarget.style.background = 'var(--tertiary-clr-100)'; }}
                >
                  {uploading ? 'Uploading…' : 'Continue →'}
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2: Fill in details ───────────────────────────────────── */}
          {step === 2 && (
            <form onSubmit={handleSave}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Resolved URL confirmation */}
                <div style={{ background: 'rgba(39,174,96,0.07)', border: '1px solid rgba(39,174,96,0.25)', borderRadius: 8, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 20 }}>
                    {resolvedFileName ? fileIcon(resolvedFileName.split('.').pop() ?? '') : '🔗'}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#27ae60', marginBottom: 2 }}>
                      {resolvedFileName ? 'File uploaded successfully' : 'Link confirmed'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--tertiary-clr-100)', opacity: 0.55, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {resolvedUrl}
                    </div>
                  </div>
                  <button type="button" onClick={() => {
                      if (resolvedPath) cancelUpload(resolvedPath);
                      setStep(1); setResolvedUrl(null); setResolvedFileName(null); setResolvedPath(null); setSaveStatus(null);
                    }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--tertiary-clr-100)', opacity: 0.4, fontFamily: 'Onest, sans-serif', flexShrink: 0 }}>
                    Change
                  </button>
                </div>

                {/* Title */}
                <div>
                  <label style={LABEL_STYLE}>Title *</label>
                  <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Path planning algorithms in autonomous driving"
                    style={INPUT_STYLE} required autoFocus />
                </div>

                {/* Description */}
                <div>
                  <label style={LABEL_STYLE}>
                    Description <span style={{ opacity: 0.4, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>— abstract or summary, used for search</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Paste the abstract, summary, or any text you want to be searchable…"
                    rows={5}
                    style={{ ...INPUT_STYLE, resize: 'vertical', lineHeight: 1.6 }}
                  />
                </div>

                {/* Authors */}
                <div>
                  <label style={LABEL_STYLE}>Authors</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {authors.map((author, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8 }}>
                        <input type="text" value={author} onChange={e => updateAuthor(i, e.target.value)}
                          placeholder={`Author ${i + 1}`} style={{ ...INPUT_STYLE, flex: 1 }} />
                        {authors.length > 1 && (
                          <button type="button" onClick={() => removeAuthor(i)}
                            style={{ background: 'none', border: '1px solid #ddd', borderRadius: 8, padding: '0 12px', cursor: 'pointer', color: '#999', fontSize: 18 }}>
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={addAuthor}
                      style={{ alignSelf: 'flex-start', background: 'none', border: '1px dashed #ccc', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 13, color: 'var(--tertiary-clr-100)', opacity: 0.6, fontFamily: 'Onest, sans-serif' }}>
                      + Add author
                    </button>
                  </div>
                </div>

                {/* Published date */}
                <div style={{ maxWidth: 220 }}>
                  <label style={LABEL_STYLE}>Published Date</label>
                  <input type="date" value={published} onChange={e => setPublished(e.target.value)} style={INPUT_STYLE} />
                </div>

                {/* Auto-filled lab fields */}
                <div style={{ background: 'var(--background-clr-400)', borderRadius: 8, padding: '14px 16px', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                  <div>
                    <div style={LABEL_STYLE}>Lab (auto-filled)</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--tertiary-clr-100)' }}>{lab.name}</div>
                  </div>
                  <div>
                    <div style={LABEL_STYLE}>Lab ID (auto-filled)</div>
                    <div style={{ fontSize: 12, color: 'var(--tertiary-clr-100)', opacity: 0.45, fontFamily: 'monospace' }}>{lab.id}</div>
                  </div>
                </div>

                {/* Status */}
                {saveStatus && (
                  <div style={{
                    padding: '12px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                    background: saveStatus.type === 'success' ? 'rgba(39,174,96,0.1)' : 'rgba(192,57,43,0.1)',
                    color: saveStatus.type === 'success' ? '#27ae60' : '#c0392b',
                  }}>
                    {saveStatus.type === 'success' ? '✓ ' : '✕ '}{saveStatus.message}
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <button type="submit" disabled={saving}
                    style={{
                      background: saving ? '#ccc' : 'var(--tertiary-clr-100)',
                      color: '#fff', border: 'none', borderRadius: 8, padding: '12px 28px',
                      fontSize: 14, fontWeight: 600, fontFamily: 'Onest, sans-serif',
                      cursor: saving ? 'default' : 'pointer', transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { if (!saving) e.currentTarget.style.background = 'var(--primary-clr-300)'; }}
                    onMouseLeave={e => { if (!saving) e.currentTarget.style.background = 'var(--tertiary-clr-100)'; }}
                  >
                    {saving ? 'Publishing…' : 'Publish'}
                  </button>
                  <button type="button" onClick={() => {
                      if (resolvedPath) cancelUpload(resolvedPath);
                      setStep(1); setResolvedUrl(null); setResolvedFileName(null); setResolvedPath(null); setSaveStatus(null);
                    }}
                    style={{ background: 'none', border: 'none', fontSize: 13, color: 'var(--tertiary-clr-100)', opacity: 0.45, cursor: 'pointer', fontFamily: 'Onest, sans-serif' }}>
                    ← Back
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Existing media list */}
        <div>
          <h2 style={{ fontFamily: 'Quantico, sans-serif', fontSize: 17, fontWeight: 700, color: 'var(--tertiary-clr-100)', margin: '0 0 16px' }}>
            Published Media
            {!mediaLoading && <span style={{ fontSize: 13, fontWeight: 400, opacity: 0.4, marginLeft: 8 }}>({media.length})</span>}
          </h2>

          {mediaLoading && <div style={{ fontSize: 14, color: 'var(--tertiary-clr-100)', opacity: 0.4, padding: '24px 0' }}>Loading…</div>}
          {!mediaLoading && media.length === 0 && (
            <div style={{ fontSize: 14, color: 'var(--tertiary-clr-100)', opacity: 0.4, padding: '24px 0' }}>Nothing published yet.</div>
          )}
          {!mediaLoading && media.map(item => (
            <div key={item.id} style={{ background: '#fff', border: '1px solid #e6e6e6', borderRadius: 10, padding: '16px 20px', marginBottom: 10, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--tertiary-clr-100)', marginBottom: 4 }}>{item.title ?? '(No title)'}</div>
                {item.author && <div style={{ fontSize: 12, color: 'var(--tertiary-clr-100)', opacity: 0.55, marginBottom: 4 }}>{item.author}</div>}
                {item.published && (
                  <div style={{ fontSize: 11, color: 'var(--primary-clr-300)', fontWeight: 600 }}>
                    {new Date(item.published).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </div>
                )}
              </div>
              {item.content_url && (
                <a href={item.content_url} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 12, color: 'var(--primary-clr-300)', fontWeight: 600, textDecoration: 'none', flexShrink: 0, paddingTop: 2 }}>
                  View ↗
                </a>
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

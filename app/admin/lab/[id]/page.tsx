"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';

const STORAGE = 'https://firebasestorage.googleapis.com/v0/b/livinglabs-1a831.firebasestorage.app/o';

const BUILDINGS = [
  'Avedisian Hall', 'Ballentine Hall', 'Beaupre Center for Chemical and Forensic Sciences',
  'Bliss Hall', 'Carlotti Administration Building', 'Center for Biotechnology and Life Sciences',
  'Chafee Social Science Center', 'Coastal Institute', 'Crawford Hall', 'Davis Hall',
  'East Hall', 'Edwards Auditorium', 'Fascitelli Center For Advanced Engineering',
  'Fine Arts Center', 'Fogarty Hall', 'Green Hall', 'Kirk Applied Engineering Lab',
  'Kirk Center for Advanced Technology', 'Lippitt Hall', 'Memorial Union',
  'Multicultural Center', 'Quinn Hall', 'Robert L Carothers Library & Learning Commons',
  'Rodman Hall', 'Social Sciences Research Center', 'Swan Hall', 'Taft Hall',
  'Tyler Hall', 'Washburn Hall', 'White Hall', 'Woodward Hall',
];

const SDGS = [
  { num: 1,  name: 'No Poverty' },
  { num: 2,  name: 'Zero Hunger' },
  { num: 3,  name: 'Good Health and Well-being' },
  { num: 4,  name: 'Quality Education' },
  { num: 5,  name: 'Gender Equality' },
  { num: 6,  name: 'Clean Water and Sanitation' },
  { num: 7,  name: 'Affordable and Clean Energy' },
  { num: 8,  name: 'Decent Work and Economic Growth' },
  { num: 9,  name: 'Industry, Innovation, and Infrastructure' },
  { num: 10, name: 'Reduced Inequalities' },
  { num: 11, name: 'Sustainable Cities and Communities' },
  { num: 12, name: 'Responsible Consumption and Production' },
  { num: 13, name: 'Climate Action' },
  { num: 14, name: 'Life Below Water' },
  { num: 15, name: 'Life on Land' },
  { num: 16, name: 'Peace, Justice, and Strong Institutions' },
  { num: 17, name: 'Partnerships for the Goals' },
];

interface Member { name: string; photo: string | null; }

interface MediaItem {
  id: string;
  title: string | null;
  author: string | null;
  content_url: string | null;
  published: string | null;
}

type ContentMode = 'upload' | 'link';
type Step = 1 | 2;

const ACCEPTED = '.pdf,.jpg,.jpeg,.png,.gif,.webp,.mp4,.mov,.mp3,.m4a,.docx,.doc,.xlsx,.xls';
const ACCEPTED_LABEL = 'PDF, JPG, PNG, MP4, MP3, DOCX, XLSX and more · Max 100 MB';

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

  // ── Lab edit form state ───────────────────────────────────────────────────
  const [labLoading, setLabLoading] = useState(true);
  const [labError, setLabError] = useState<string | null>(null);

  const [labName, setLabName] = useState('');
  const [building, setBuilding] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [bio, setBio] = useState('');
  const [selectedSDGs, setSelectedSDGs] = useState<Set<string>>(new Set());
  const [members, setMembers] = useState<Member[]>([]);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberPhoto, setNewMemberPhoto] = useState<string | null>(null);
  const newMemberPhotoRef = useRef<HTMLInputElement>(null);
  const [coverPhoto, setCoverPhoto] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [existingCoverUrl, setExistingCoverUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);

  // ── Media upload state ────────────────────────────────────────────────────
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [mediaLoading, setMediaLoading] = useState(true);
  const [step, setStep] = useState<Step>(1);
  const [contentMode, setContentMode] = useState<ContentMode>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedLink, setPastedLink] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const [resolvedFileName, setResolvedFileName] = useState<string | null>(null);
  const [resolvedPath, setResolvedPath] = useState<string | null>(null);
  const pendingUploadRef = useRef<string | null>(null);
  const [mediaTitle, setMediaTitle] = useState('');
  const [mediaAuthors, setMediaAuthors] = useState<string[]>(['']);
  const [mediaDescription, setMediaDescription] = useState('');
  const [mediaPublished, setMediaPublished] = useState('');
  const [mediaSaving, setMediaSaving] = useState(false);
  const [mediaSaveStatus, setMediaSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // ── Load lab ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    fetch(`/api/lab-details?id=${encodeURIComponent(id)}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) throw new Error(d.error);
        setLabName(d.name ?? '');
        setBuilding(d.location ?? '');
        setStartDate(d.start_date ? d.start_date.slice(0, 10) : '');
        setEndDate(d.end_date ? d.end_date.slice(0, 10) : '');
        setBio(d.biography ?? '');
        setSelectedSDGs(new Set((d.SDGs ?? []).map((s: any) => s.name ?? s)));
        setMembers((d.members ?? []).map((m: any) => ({ name: m.name, photo: m.profile_picture_url ?? null })));
        setExistingCoverUrl(d.cover_photo_url ?? null);
      })
      .catch(err => setLabError(err.message))
      .finally(() => setLabLoading(false));
  }, [id]);

  // ── Load media ────────────────────────────────────────────────────────────
  const fetchMedia = useCallback((bust = false) => {
    if (!id) return;
    setMediaLoading(true);
    fetch(`/api/media-by-lab?id=${encodeURIComponent(id)}${bust ? '&nocache=1' : ''}`)
      .then(r => r.json())
      .then(d => setMedia(d.media ?? []))
      .catch(() => setMedia([]))
      .finally(() => setMediaLoading(false));
  }, [id]);

  useEffect(() => { fetchMedia(); }, [fetchMedia]);

  // ── Upload cleanup ────────────────────────────────────────────────────────
  useEffect(() => { pendingUploadRef.current = resolvedPath; }, [resolvedPath]);

  const cancelUpload = useCallback((path: string) => {
    fetch('/api/delete-upload', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path }) }).catch(() => {});
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (pendingUploadRef.current) navigator.sendBeacon('/api/delete-upload', new Blob([JSON.stringify({ path: pendingUploadRef.current })], { type: 'application/json' }));
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (pendingUploadRef.current) navigator.sendBeacon('/api/delete-upload', new Blob([JSON.stringify({ path: pendingUploadRef.current })], { type: 'application/json' }));
    };
  }, []);

  // ── Cover photo ───────────────────────────────────────────────────────────
  const handleCoverChange = (file: File | null) => {
    if (previewUrlRef.current) { URL.revokeObjectURL(previewUrlRef.current); previewUrlRef.current = null; }
    setCoverPhoto(file);
    if (file) { const url = URL.createObjectURL(file); previewUrlRef.current = url; setCoverPreview(url); }
    else setCoverPreview(null);
  };

  useEffect(() => {
    return () => { if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current); };
  }, []);

  // ── SDGs ──────────────────────────────────────────────────────────────────
  const toggleSDG = (name: string) => {
    setSelectedSDGs(prev => { const next = new Set(prev); next.has(name) ? next.delete(name) : next.add(name); return next; });
  };

  // ── Members ───────────────────────────────────────────────────────────────
  const addMember = () => {
    const name = newMemberName.trim();
    if (!name) return;
    setMembers(prev => [...prev, { name, photo: newMemberPhoto }]);
    setNewMemberName('');
    setNewMemberPhoto(null);
    if (newMemberPhotoRef.current) newMemberPhotoRef.current.value = '';
  };

  // ── Save lab ──────────────────────────────────────────────────────────────
  const handleSaveLab = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setSaveSuccess(false);
    if (!labName.trim()) { setSaveError('Lab name is required.'); return; }
    if (!building) { setSaveError('Please select a building.'); return; }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('lab_id', id);
      formData.append('lab_name', labName.trim());
      formData.append('building', building);
      formData.append('bio', bio.trim());
      formData.append('start_date', startDate);
      formData.append('end_date', endDate);
      formData.append('sdgs', JSON.stringify([...selectedSDGs].map(name => ({ name }))));
      formData.append('members', JSON.stringify(members.map(m => ({ name: m.name, profile_picture_url: m.photo }))));
      if (coverPhoto) formData.append('cover_photo', coverPhoto);

      const res = await fetch('/api/update-lab', { method: 'PUT', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');

      if (coverPhoto) setExistingCoverUrl(coverPreview);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  // ── Media upload step 1 ───────────────────────────────────────────────────
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) { setSelectedFile(file); setUploadError(null); }
  }, []);

  const handleStep1Continue = async () => {
    setUploadError(null);
    if (contentMode === 'link') {
      const url = pastedLink.trim();
      if (!url) { setUploadError('Please paste a URL.'); return; }
      try { new URL(url); } catch { setUploadError('Please enter a valid URL.'); return; }
      setResolvedUrl(url); setResolvedFileName(null); setStep(2); return;
    }
    if (!selectedFile) { setUploadError('Please select a file.'); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', selectedFile);
      fd.append('lab_id', id);
      const res = await fetch('/api/upload-media', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setResolvedUrl(data.url); setResolvedFileName(data.name); setResolvedPath(data.path); setStep(2);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // ── Media save step 2 ─────────────────────────────────────────────────────
  const handleMediaSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvedUrl) return;
    if (!mediaTitle.trim()) { setMediaSaveStatus({ type: 'error', message: 'Title is required.' }); return; }
    setMediaSaving(true); setMediaSaveStatus(null);
    try {
      const res = await fetch('/api/add-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: mediaTitle.trim(),
          authors: mediaAuthors.map(a => a.trim()).filter(Boolean),
          description: mediaDescription.trim() || null,
          content_url: resolvedUrl,
          published: mediaPublished || null,
          lab_id: id,
          lab_name: labName,
          location: building,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setMediaSaveStatus({ type: 'success', message: `"${mediaTitle.trim()}" published.` });
      setResolvedPath(null);
      setTimeout(() => {
        setStep(1); setMediaTitle(''); setMediaAuthors(['']); setMediaDescription(''); setMediaPublished('');
        setResolvedUrl(null); setResolvedFileName(null); setResolvedPath(null);
        setSelectedFile(null); setPastedLink(''); setMediaSaveStatus(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        fetchMedia(true);
      }, 1800);
    } catch (err) {
      setMediaSaveStatus({ type: 'error', message: err instanceof Error ? err.message : 'Something went wrong.' });
    } finally {
      setMediaSaving(false);
    }
  };

  const updateMediaAuthor = (i: number, v: string) => setMediaAuthors(p => p.map((a, j) => j === i ? v : a));

  // ── Loading / error ───────────────────────────────────────────────────────
  if (labLoading) return (
    <div style={{ minHeight: '100vh', background: 'var(--background-clr-400)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Onest, sans-serif', color: 'var(--tertiary-clr-100)', opacity: 0.4 }}>
      Loading…
    </div>
  );

  if (labError) return (
    <div style={{ minHeight: '100vh', background: 'var(--background-clr-400)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, fontFamily: 'Onest, sans-serif' }}>
      <p style={{ color: '#c0392b', fontSize: 14 }}>{labError}</p>
      <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', color: 'var(--primary-clr-300)', fontSize: 14, cursor: 'pointer' }}>← Back to home</button>
    </div>
  );

  const bioWarning = bio.length >= 480;
  const displayCover = coverPreview ?? existingCoverUrl;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'var(--background-clr-400)', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <main style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '40px 24px 80px' }}>
        <div style={{ width: '100%', maxWidth: 660, display: 'flex', flexDirection: 'column', gap: 32 }}>

          {/* ── Lab edit form ─────────────────────────────────────────────── */}
          <form onSubmit={handleSaveLab} style={{ background: '#fff', borderRadius: 14, padding: '36px 40px', display: 'flex', flexDirection: 'column', gap: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>

            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <p style={{ fontFamily: 'Onest, sans-serif', fontWeight: 700, fontSize: 22, color: '#002147', margin: 0 }}>
                Edit Lab Profile
              </p>
              <a href={`/living-lab?id=${id}`} style={{ fontFamily: 'Onest, sans-serif', fontSize: 13, color: '#64748b', textDecoration: 'none' }}>
                View public page →
              </a>
            </div>

            {saveError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', fontFamily: 'Onest, sans-serif', fontSize: 13, color: '#b91c1c' }}>
                {saveError}
              </div>
            )}
            {saveSuccess && (
              <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '10px 14px', fontFamily: 'Onest, sans-serif', fontSize: 13, color: '#166534' }}>
                Changes saved.
              </div>
            )}

            <Field label="Lab Name" required>
              <input value={labName} onChange={e => setLabName(e.target.value)} placeholder="e.g. Coastal Resilience Lab" style={inputStyle} />
            </Field>

            <Field label="Building" required>
              <select value={building} onChange={e => setBuilding(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="">Select a building…</option>
                {BUILDINGS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              {building && (
                <img
                  src={`${STORAGE}/${encodeURIComponent(building)}.jpg?alt=media`}
                  alt={building}
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  style={{ marginTop: 8, width: '100%', height: 160, objectFit: 'cover', borderRadius: 8, background: '#c8d8e8' }}
                />
              )}
            </Field>

            <Field label="Start Date">
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
              </div>
              <p style={{ fontFamily: 'Onest, sans-serif', fontSize: 12, color: '#94a3b8', margin: '4px 0 0' }}>Leave end date blank if the lab is still active.</p>
            </Field>

            <Field label="Cover Photo">
              {displayCover && (
                <div style={{ position: 'relative', marginBottom: 8 }}>
                  <img src={displayCover} alt="Cover" style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 8, background: '#c8d8e8' }} />
                  <button type="button" onClick={() => { handleCoverChange(null); if (coverInputRef.current) coverInputRef.current.value = ''; setExistingCoverUrl(null); }}
                    style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '50%', width: 28, height: 28, color: '#fff', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                </div>
              )}
              {!displayCover && (
                <button type="button" onClick={() => coverInputRef.current?.click()}
                  style={{ width: '100%', padding: '14px', background: '#f8fafc', border: '1.5px dashed #c7d3e5', borderRadius: 8, fontFamily: 'Onest, sans-serif', fontSize: 13, color: '#64748b', cursor: 'pointer', textAlign: 'center' }}>
                  Upload cover photo
                </button>
              )}
              <input ref={coverInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" style={{ display: 'none' }}
                onChange={e => handleCoverChange(e.target.files?.[0] ?? null)} />
            </Field>

            <Field label="Biography" hint={<span style={{ color: bioWarning ? '#e53e3e' : undefined }}>{bio.length}/500</span>}>
              <textarea value={bio} onChange={e => { if (e.target.value.length <= 500) setBio(e.target.value); }}
                placeholder="Describe your lab's research focus and goals…" rows={4} style={{ ...inputStyle, resize: 'vertical', minHeight: 90 }} />
            </Field>

            <Field label="Sustainable Development Goals">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8 }}>
                {SDGS.map(sdg => {
                  const checked = selectedSDGs.has(sdg.name);
                  return (
                    <label key={sdg.num} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px', borderRadius: 8, border: `1.5px solid ${checked ? '#002147' : '#e2e8f0'}`, background: checked ? '#eef2f8' : '#fff', cursor: 'pointer', transition: 'all 0.15s' }}>
                      <input type="checkbox" checked={checked} onChange={() => toggleSDG(sdg.name)} style={{ display: 'none' }} />
                      <img src={`${STORAGE}/E-WEB-Goal-${String(sdg.num).padStart(2, '0')}.png?alt=media`} alt={sdg.name} style={{ width: 36, height: 36, flexShrink: 0 }} />
                      <span style={{ fontFamily: 'Onest, sans-serif', fontSize: 12, color: '#002147', lineHeight: 1.3 }}>{sdg.name}</span>
                    </label>
                  );
                })}
              </div>
            </Field>

            <Field label="Members">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: members.length ? 10 : 0 }}>
                {members.map((m, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', border: '1.5px solid #c7d3e5', borderRadius: 20, padding: '4px 10px 4px 4px' }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: '#c8d8e8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {m.photo ? (
                        <img src={m.photo} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      ) : (
                        <svg width={8} height={8} viewBox="0 0 80 80" fill="none">
                          <circle cx={40} cy={28} r={18} fill="#9ab0c4" />
                          <ellipse cx={40} cy={72} rx={30} ry={18} fill="#9ab0c4" />
                        </svg>
                      )}
                    </div>
                    <span style={{ fontFamily: 'Onest, sans-serif', fontSize: 13, color: '#002147', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</span>
                    <button type="button" onClick={() => setMembers(p => p.filter((_, idx) => idx !== i))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1, color: '#94a3b8', fontSize: 16, marginLeft: 2 }} aria-label={`Remove ${m.name}`}>×</button>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input value={newMemberName} onChange={e => setNewMemberName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addMember(); } }}
                  placeholder="Member name (required)" style={{ ...inputStyle, flex: 1 }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button type="button" onClick={() => newMemberPhotoRef.current?.click()}
                    style={{ fontFamily: 'Onest, sans-serif', fontSize: 13, fontWeight: 600, color: '#002147', background: '#f1f5f9', border: '1.5px solid #c7d3e5', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', flexShrink: 0 }}>
                    Add photo (optional)
                  </button>
                  {newMemberPhoto && (
                    <img src={newMemberPhoto} alt="preview" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '2px solid #c7d3e5' }} />
                  )}
                  <button type="button" onClick={addMember}
                    style={{ fontFamily: 'Onest, sans-serif', fontSize: 13, fontWeight: 600, color: '#fff', background: '#002147', border: 'none', borderRadius: 8, padding: '10px 16px', cursor: 'pointer', flexShrink: 0, marginLeft: 'auto' }}>
                    Add
                  </button>
                </div>
                <input ref={newMemberPhotoRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }}
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) setNewMemberPhoto(URL.createObjectURL(file));
                  }} />
              </div>
            </Field>

            <div style={{ display: 'flex', gap: 12 }}>
              <button type="submit" disabled={saving}
                style={{ fontFamily: 'Onest, sans-serif', fontSize: 15, fontWeight: 700, color: '#fff', background: saving ? '#6b7e96' : '#002147', border: 'none', borderRadius: 10, padding: '14px 0', cursor: saving ? 'default' : 'pointer', flex: 1, transition: 'background 0.2s' }}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
              <button type="button" onClick={() => router.push(`/living-lab?id=${id}`)}
                style={{ fontFamily: 'Onest, sans-serif', fontSize: 15, fontWeight: 400, color: '#64748b', background: 'transparent', border: '1.5px solid #c7d3e5', borderRadius: 10, padding: '14px 20px', cursor: 'pointer' }}>
                Exit
              </button>
            </div>
          </form>

          {/* ── Add Media ──────────────────────────────────────────────────── */}
          <div style={{ background: '#fff', borderRadius: 14, padding: '36px 40px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
            <p style={{ fontFamily: 'Onest, sans-serif', fontWeight: 700, fontSize: 22, color: '#002147', margin: '0 0 24px' }}>Add Media</p>

            {/* Step indicator */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 28 }}>
              {[{ n: 1, label: 'Upload Content' }, { n: 2, label: 'Add Details' }].map(({ n, label }, idx) => {
                const active = step === n, done = step > n;
                return (
                  <div key={n} style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, background: done ? '#27ae60' : active ? '#002147' : '#e8e8e8', color: done || active ? '#fff' : '#aaa', transition: 'all 0.2s' }}>
                        {done ? '✓' : n}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: active ? '#002147' : '#aaa' }}>{label}</span>
                    </div>
                    {idx < 1 && <div style={{ width: 40, height: 2, background: done ? '#27ae60' : '#e8e8e8', margin: '0 12px', transition: 'background 0.3s' }} />}
                  </div>
                );
              })}
            </div>

            {step === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'flex', background: '#f4f4f4', borderRadius: 8, padding: 3, width: 'fit-content' }}>
                  {(['upload', 'link'] as ContentMode[]).map(mode => (
                    <button key={mode} type="button" onClick={() => { setContentMode(mode); setUploadError(null); }}
                      style={{ padding: '7px 20px', borderRadius: 6, border: 'none', fontSize: 13, fontWeight: 600, fontFamily: 'Onest, sans-serif', cursor: 'pointer', transition: 'all 0.15s', background: contentMode === mode ? '#fff' : 'transparent', color: contentMode === mode ? '#002147' : '#999', boxShadow: contentMode === mode ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
                      {mode === 'upload' ? '⬆ Upload File' : '🔗 Paste Link'}
                    </button>
                  ))}
                </div>

                {contentMode === 'upload' && (
                  <div>
                    <div onClick={() => fileInputRef.current?.click()} onDrop={handleDrop} onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)}
                      style={{ border: `2px dashed ${dragOver ? '#75b2dd' : '#ddd'}`, borderRadius: 10, padding: '40px 24px', textAlign: 'center', cursor: 'pointer', background: dragOver ? 'rgba(117,178,221,0.06)' : '#fafafa', transition: 'all 0.15s' }}>
                      {selectedFile ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                          <span style={{ fontSize: 32 }}>{fileIcon(selectedFile.type)}</span>
                          <div style={{ textAlign: 'left' }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#002147' }}>{selectedFile.name}</div>
                            <div style={{ fontSize: 12, color: '#002147', opacity: 0.5 }}>{formatBytes(selectedFile.size)}</div>
                          </div>
                          <button type="button" onClick={e => { e.stopPropagation(); setSelectedFile(null); setUploadError(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                            style={{ marginLeft: 8, background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#bbb' }}>×</button>
                        </div>
                      ) : (
                        <div>
                          <div style={{ fontSize: 36, marginBottom: 10 }}>📁</div>
                          <div style={{ fontSize: 15, fontWeight: 600, color: '#002147', marginBottom: 6 }}>Drop a file here or <span style={{ color: '#75b2dd' }}>browse</span></div>
                          <div style={{ fontSize: 12, color: '#002147', opacity: 0.4 }}>{ACCEPTED_LABEL}</div>
                        </div>
                      )}
                    </div>
                    <input ref={fileInputRef} type="file" accept={ACCEPTED} onChange={e => { const f = e.target.files?.[0]; if (f) { setSelectedFile(f); setUploadError(null); } }} style={{ display: 'none' }} />
                  </div>
                )}

                {contentMode === 'link' && (
                  <div>
                    <label style={labelStyle}>Content URL</label>
                    <input type="url" value={pastedLink} onChange={e => { setPastedLink(e.target.value); setUploadError(null); }} placeholder="https://example.com/paper.pdf" style={inputStyle} />
                  </div>
                )}

                {uploadError && <div style={{ fontSize: 13, color: '#c0392b', fontWeight: 600 }}>✕ {uploadError}</div>}

                <button type="button" onClick={handleStep1Continue} disabled={uploading}
                  style={{ alignSelf: 'flex-start', background: uploading ? '#ccc' : '#002147', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 28px', fontSize: 14, fontWeight: 600, fontFamily: 'Onest, sans-serif', cursor: uploading ? 'default' : 'pointer' }}>
                  {uploading ? 'Uploading…' : 'Continue →'}
                </button>
              </div>
            )}

            {step === 2 && (
              <form onSubmit={handleMediaSave}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{ background: 'rgba(39,174,96,0.07)', border: '1px solid rgba(39,174,96,0.25)', borderRadius: 8, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 20 }}>{resolvedFileName ? fileIcon(resolvedFileName.split('.').pop() ?? '') : '🔗'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#27ae60', marginBottom: 2 }}>{resolvedFileName ? 'File uploaded' : 'Link confirmed'}</div>
                      <div style={{ fontSize: 12, color: '#002147', opacity: 0.55, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{resolvedUrl}</div>
                    </div>
                    <button type="button" onClick={() => { if (resolvedPath) cancelUpload(resolvedPath); setStep(1); setResolvedUrl(null); setResolvedFileName(null); setResolvedPath(null); setMediaSaveStatus(null); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#002147', opacity: 0.4, fontFamily: 'Onest, sans-serif', flexShrink: 0 }}>Change</button>
                  </div>

                  <div><label style={labelStyle}>Title *</label><input type="text" value={mediaTitle} onChange={e => setMediaTitle(e.target.value)} placeholder="e.g. Urban Heat Island Study 2024" style={inputStyle} required autoFocus /></div>

                  <div>
                    <label style={labelStyle}>Description <span style={{ opacity: 0.4, fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: 12 }}>— used for search</span></label>
                    <textarea value={mediaDescription} onChange={e => setMediaDescription(e.target.value)} placeholder="Abstract or summary…" rows={4} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} />
                  </div>

                  <div>
                    <label style={labelStyle}>Authors</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {mediaAuthors.map((a, i) => (
                        <div key={i} style={{ display: 'flex', gap: 8 }}>
                          <input type="text" value={a} onChange={e => updateMediaAuthor(i, e.target.value)} placeholder={`Author ${i + 1}`} style={{ ...inputStyle, flex: 1 }} />
                          {mediaAuthors.length > 1 && (
                            <button type="button" onClick={() => setMediaAuthors(p => p.filter((_, j) => j !== i))}
                              style={{ background: 'none', border: '1px solid #ddd', borderRadius: 8, padding: '0 12px', cursor: 'pointer', color: '#999', fontSize: 18 }}>×</button>
                          )}
                        </div>
                      ))}
                      <button type="button" onClick={() => setMediaAuthors(p => [...p, ''])}
                        style={{ alignSelf: 'flex-start', background: 'none', border: '1px dashed #ccc', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 13, color: '#002147', opacity: 0.6, fontFamily: 'Onest, sans-serif' }}>
                        + Add author
                      </button>
                    </div>
                  </div>

                  <div style={{ maxWidth: 220 }}><label style={labelStyle}>Published Date</label><input type="date" value={mediaPublished} onChange={e => setMediaPublished(e.target.value)} style={inputStyle} /></div>

                  {mediaSaveStatus && (
                    <div style={{ padding: '12px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: mediaSaveStatus.type === 'success' ? 'rgba(39,174,96,0.1)' : 'rgba(192,57,43,0.1)', color: mediaSaveStatus.type === 'success' ? '#27ae60' : '#c0392b' }}>
                      {mediaSaveStatus.type === 'success' ? '✓ ' : '✕ '}{mediaSaveStatus.message}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 12 }}>
                    <button type="submit" disabled={mediaSaving}
                      style={{ background: mediaSaving ? '#ccc' : '#002147', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 28px', fontSize: 14, fontWeight: 600, fontFamily: 'Onest, sans-serif', cursor: mediaSaving ? 'default' : 'pointer' }}>
                      {mediaSaving ? 'Publishing…' : 'Publish'}
                    </button>
                    <button type="button" onClick={() => { if (resolvedPath) cancelUpload(resolvedPath); setStep(1); setResolvedUrl(null); setResolvedFileName(null); setResolvedPath(null); setMediaSaveStatus(null); }}
                      style={{ background: 'none', border: 'none', fontSize: 13, color: '#002147', opacity: 0.45, cursor: 'pointer', fontFamily: 'Onest, sans-serif' }}>← Back</button>
                  </div>
                </div>
              </form>
            )}
          </div>

          {/* ── Published Media list ───────────────────────────────────────── */}
          <div style={{ background: '#fff', borderRadius: 14, padding: '36px 40px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
            <p style={{ fontFamily: 'Onest, sans-serif', fontWeight: 700, fontSize: 22, color: '#002147', margin: '0 0 16px' }}>
              Published Media
              {!mediaLoading && <span style={{ fontSize: 14, fontWeight: 400, color: '#94a3b8', marginLeft: 8 }}>({media.length})</span>}
            </p>
            {mediaLoading && <div style={{ fontSize: 14, color: '#002147', opacity: 0.4, padding: '12px 0' }}>Loading…</div>}
            {!mediaLoading && media.length === 0 && <div style={{ fontSize: 14, color: '#002147', opacity: 0.4, padding: '12px 0' }}>Nothing published yet.</div>}
            {!mediaLoading && media.map(item => (
              <div key={item.id} style={{ border: '1px solid #e6e6e6', borderRadius: 10, padding: '16px 20px', marginBottom: 10, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#002147', marginBottom: 4 }}>{item.title ?? '(No title)'}</div>
                  {item.author && <div style={{ fontSize: 12, color: '#002147', opacity: 0.55, marginBottom: 4 }}>{item.author}</div>}
                  {item.published && (
                    <div style={{ fontSize: 11, color: '#75b2dd', fontWeight: 600 }}>
                      {new Date(item.published).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </div>
                  )}
                </div>
                {item.content_url && (
                  <a href={item.content_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#75b2dd', fontWeight: 600, textDecoration: 'none', flexShrink: 0, paddingTop: 2 }}>View ↗</a>
                )}
              </div>
            ))}
          </div>

        </div>
      </main>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  fontFamily: 'Onest, sans-serif',
  fontSize: 14,
  color: '#002147',
  background: '#f8fafc',
  border: '1.5px solid #c7d3e5',
  borderRadius: 8,
  padding: '10px 12px',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: '#002147',
  opacity: 0.6,
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
  marginBottom: 6,
  fontFamily: 'Onest, sans-serif',
};

function Field({ label, hint, required, children }: { label: string; hint?: React.ReactNode; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <label style={{ fontFamily: 'Onest, sans-serif', fontWeight: 600, fontSize: 14, color: '#002147' }}>
          {label}{required && <span style={{ color: '#e53e3e', marginLeft: 2 }}>*</span>}
        </label>
        {hint && <span style={{ fontFamily: 'Onest, sans-serif', fontSize: 12, color: '#94a3b8' }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

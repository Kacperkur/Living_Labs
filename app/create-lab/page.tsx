"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc, setDoc } from 'firebase/firestore';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/firebase-client';
import Header from '@/components/Header';

const STORAGE = 'https://firebasestorage.googleapis.com/v0/b/livinglabs-1a831.firebasestorage.app/o';

const BUILDINGS = [
  'Avedisian Hall',
  'Ballentine Hall',
  'Beaupre Center for Chemical and Forensic Sciences',
  'Bliss Hall',
  'Carlotti Administration Building',
  'Center for Biotechnology and Life Sciences',
  'Chafee Social Science Center',
  'Coastal Institute',
  'Crawford Hall',
  'Davis Hall',
  'East Hall',
  'Edwards Auditorium',
  'Fascitelli Center For Advanced Engineering',
  'Fine Arts Center',
  'Fogarty Hall',
  'Green Hall',
  'Kirk Applied Engineering Lab',
  'Kirk Center for Advanced Technology',
  'Lippitt Hall',
  'Memorial Union',
  'Multicultural Center',
  'Quinn Hall',
  'Robert L Carothers Library & Learning Commons',
  'Rodman Hall',
  'Social Sciences Research Center',
  'Swan Hall',
  'Taft Hall',
  'Tyler Hall',
  'Washburn Hall',
  'White Hall',
  'Woodward Hall',
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
  { num: 9,  name: 'Industry, Innovation and Infrastructure' },
  { num: 10, name: 'Reduced Inequalities' },
  { num: 11, name: 'Sustainable Cities and Communities' },
  { num: 12, name: 'Responsible Consumption and Production' },
  { num: 13, name: 'Climate Action' },
  { num: 14, name: 'Life Below Water' },
  { num: 15, name: 'Life on Land' },
  { num: 16, name: 'Peace, Justice and Strong Institutions' },
  { num: 17, name: 'Partnerships for the Goals' },
];

interface Member {
  name: string;
  photo: string | null;
  isCreator: boolean;
}

export default function CreateLabPage() {
  const { user, loading, setLabId } = useAuth();
  const router = useRouter();

  const [labName, setLabName]           = useState('');
  const [building, setBuilding]         = useState('');
  const [startDate, setStartDate]       = useState('');
  const [coverPhoto, setCoverPhoto]     = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [bio, setBio]                   = useState('');
  const [selectedSDGs, setSelectedSDGs] = useState<Set<string>>(new Set());
  const [members, setMembers]           = useState<Member[]>([]);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberPhoto, setNewMemberPhoto] = useState<string | null>(null);
  const newMemberPhotoRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting]     = useState(false);
  const [error, setError]               = useState<string | null>(null);

  const fileInputRef  = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);

  // Initialise creator bubble once user is known
  useEffect(() => {
    if (user) {
      setMembers([{
        name: user.displayName || user.email || 'You',
        photo: null,
        isCreator: true,
      }]);
    }
  }, [user]);

  useEffect(() => {
    if (!loading && !user) router.replace('/login?redirect=/create-lab');
  }, [loading, user, router]);

  useEffect(() => {
    return () => { if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current); };
  }, []);

  if (loading || !user) return null;

  // ── Cover photo ──────────────────────────────────────────────────────────────
  const handleCoverChange = (file: File | null) => {
    if (previewUrlRef.current) { URL.revokeObjectURL(previewUrlRef.current); previewUrlRef.current = null; }
    setCoverPhoto(file);
    if (file) { const url = URL.createObjectURL(file); previewUrlRef.current = url; setCoverPreview(url); }
    else setCoverPreview(null);
  };

  // ── SDGs ─────────────────────────────────────────────────────────────────────
  const toggleSDG = (name: string) => {
    setSelectedSDGs(prev => { const next = new Set(prev); next.has(name) ? next.delete(name) : next.add(name); return next; });
  };

  // ── Members ──────────────────────────────────────────────────────────────────
  const addMember = () => {
    const name = newMemberName.trim();
    if (!name) return;
    setMembers(prev => [...prev, { name, photo: newMemberPhoto, isCreator: false }]);
    setNewMemberName('');
    setNewMemberPhoto(null);
    if (newMemberPhotoRef.current) newMemberPhotoRef.current.value = '';
  };

  const removeMember = (index: number) => {
    setMembers(prev => prev.filter((_, i) => i !== index));
  };

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!labName.trim()) { setError('Lab name is required.'); return; }
    if (!building)        { setError('Please select a building.'); return; }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('lab_name', labName.trim());
      formData.append('building', building);
      formData.append('bio', bio.trim());
      formData.append('start_date', startDate);
      formData.append('sdgs', JSON.stringify([...selectedSDGs].map(name => ({ name }))));
      formData.append('members', JSON.stringify(members.map(m => ({ name: m.name, profile_picture_url: m.photo }))));
      if (coverPhoto) formData.append('cover_photo', coverPhoto);

      const res  = await fetch('/api/create-lab', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create lab');

      // Record lab ownership in Firestore so the header can show "My Lab"
      if (user) {
        await setDoc(doc(db, 'users', user.uid), { email: user.email ?? '', lab_id: data.id }, { merge: true });
        setLabId(data.id);
      }

      router.push(`/admin/lab/${data.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setSubmitting(false);
    }
  };

  const bioWarning = bio.length >= 480;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background-clr-400)', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <main style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '40px 24px 80px' }}>
        <form
          onSubmit={handleSubmit}
          style={{
            width: '100%', maxWidth: 660,
            background: '#fff', borderRadius: 14,
            boxShadow: '0 2px 16px rgba(0,33,71,0.08)',
            padding: '44px 48px',
            display: 'flex', flexDirection: 'column', gap: 28,
          }}
        >
          {/* Title */}
          <div>
            <h2 style={{ fontFamily: 'Quantico, sans-serif', fontWeight: 700, fontSize: 30, color: '#002147', margin: '0 0 6px' }}>
              Create Your Lab
            </h2>
            <p style={{ fontFamily: 'Onest, sans-serif', fontSize: 14, color: '#6b7e96', margin: 0 }}>
              Fill in the details below to register your Living Lab.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '12px 16px', fontFamily: 'Onest, sans-serif', fontSize: 14, color: '#dc2626' }}>
              {error}
            </div>
          )}

          {/* Lab Name */}
          <Field label="Lab Name" required>
            <input value={labName} onChange={e => setLabName(e.target.value)} placeholder="e.g. Coastal Sustainability Lab" maxLength={120} style={inputStyle} />
          </Field>

          {/* Building */}
          <Field label="Building" required>
            <select value={building} onChange={e => setBuilding(e.target.value)} style={inputStyle}>
              <option value="">Select a building…</option>
              {BUILDINGS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            {building && (
              <img
                src={`${STORAGE}/${encodeURIComponent(building)}.jpg?alt=media`}
                alt={building}
                style={{ marginTop: 10, width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 8 }}
              />
            )}
          </Field>

          {/* Start Date */}
          <Field label="Start Date">
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
              <button
                type="button"
                onClick={() => setStartDate(new Date().toISOString().slice(0, 10))}
                style={{
                  fontFamily: 'Onest, sans-serif', fontSize: 13, fontWeight: 600,
                  color: '#002147', background: '#eef2f8', border: '1.5px solid #c7d3e5',
                  borderRadius: 8, padding: '10px 14px', cursor: 'pointer',
                  whiteSpace: 'nowrap', flexShrink: 0,
                }}
              >
                I'm a new lab
              </button>
            </div>
          </Field>

          {/* Cover Photo */}
          <Field label="Cover Photo" hint="Optional — uses building photo if not provided">
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed #cbd5e1', borderRadius: 8,
                padding: coverPreview ? 0 : '28px 16px',
                textAlign: 'center', cursor: 'pointer',
                background: '#f8fafc', overflow: 'hidden',
              }}
            >
              {coverPreview
                ? <img src={coverPreview} alt="Cover preview" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', display: 'block' }} />
                : <span style={{ fontFamily: 'Onest, sans-serif', fontSize: 14, color: '#94a3b8' }}>Click to upload a cover photo</span>
              }
            </div>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" style={{ display: 'none' }} onChange={e => handleCoverChange(e.target.files?.[0] ?? null)} />
            {coverPhoto && (
              <button type="button" onClick={() => handleCoverChange(null)} style={{ marginTop: 6, fontFamily: 'Onest, sans-serif', fontSize: 13, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                Remove photo
              </button>
            )}
          </Field>

          {/* Bio */}
          <Field label="Biography" hint={<span style={{ color: bioWarning ? '#dc2626' : '#94a3b8' }}>{bio.length}/500</span>}>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value.slice(0, 500))}
              placeholder="Describe your lab's mission, research focus, and goals…"
              rows={5}
              style={{ ...inputStyle, resize: 'vertical', minHeight: 120 }}
            />
          </Field>

          {/* SDGs */}
          <Field label="Sustainable Development Goals" hint="Select all that apply">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
              {SDGS.map(sdg => {
                const checked = selectedSDGs.has(sdg.name);
                return (
                  <label
                    key={sdg.num}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 10px', borderRadius: 8,
                      border: `1.5px solid ${checked ? '#002147' : '#e2e8f0'}`,
                      background: checked ? '#eef2f8' : '#fafafa',
                      cursor: 'pointer', userSelect: 'none',
                      transition: 'border-color 0.15s, background 0.15s',
                    }}
                  >
                    <input type="checkbox" checked={checked} onChange={() => toggleSDG(sdg.name)} style={{ display: 'none' }} />
                    <img src={`${STORAGE}/E-WEB-Goal-${String(sdg.num).padStart(2, '0')}.png?alt=media`} alt={sdg.name} style={{ width: 36, height: 36, flexShrink: 0 }} />
                    <span style={{ fontFamily: 'Onest, sans-serif', fontSize: 12, color: '#002147', lineHeight: 1.3 }}>{sdg.name}</span>
                  </label>
                );
              })}
            </div>
          </Field>

          {/* Members */}
          <Field label="Members">
            {/* Bubbles */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: members.length ? 10 : 0 }}>
              {members.map((m, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: m.isCreator ? '#eef2f8' : '#f8fafc',
                    border: `1.5px solid ${m.isCreator ? '#002147' : '#c7d3e5'}`,
                    borderRadius: 20, padding: '4px 10px 4px 4px',
                  }}
                >
                  {/* Avatar */}
                  <div style={{ width: 32, height: 32, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: '#c8d8e8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {m.photo ? (
                      <img src={m.photo} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    ) : (
                      <svg width={18} height={18} viewBox="0 0 80 80" fill="none">
                        <circle cx={40} cy={28} r={18} fill="#9ab0c4" />
                        <ellipse cx={40} cy={72} rx={30} ry={18} fill="#9ab0c4" />
                      </svg>
                    )}
                  </div>
                  {/* Name */}
                  <span style={{ fontFamily: 'Onest, sans-serif', fontSize: 13, fontWeight: m.isCreator ? 600 : 400, color: '#002147', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {m.name}{m.isCreator && ' (you)'}
                  </span>
                  {/* Remove button — not shown for creator */}
                  {!m.isCreator && (
                    <button
                      type="button"
                      onClick={() => removeMember(i)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1, color: '#94a3b8', fontSize: 16, marginLeft: 2 }}
                      aria-label={`Remove ${m.name}`}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add member input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input
                value={newMemberName}
                onChange={e => setNewMemberName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addMember(); } }}
                placeholder="Name (required)"
                style={{ ...inputStyle }}
              />
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => newMemberPhotoRef.current?.click()}
                  style={{
                    fontFamily: 'Onest, sans-serif', fontSize: 13, color: '#64748b',
                    background: '#f8fafc', border: '1.5px dashed #c7d3e5',
                    borderRadius: 8, padding: '8px 14px', cursor: 'pointer', flexShrink: 0,
                  }}
                >
                  {newMemberPhoto ? 'Change photo' : 'Add photo (optional)'}
                </button>
                {newMemberPhoto && (
                  <img src={newMemberPhoto} alt="preview" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #c7d3e5' }} />
                )}
                <input
                  ref={newMemberPhotoRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  style={{ display: 'none' }}
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const url = URL.createObjectURL(file);
                    setNewMemberPhoto(url);
                  }}
                />
                <button
                  type="button"
                  onClick={addMember}
                  style={{
                    fontFamily: 'Onest, sans-serif', fontSize: 13, fontWeight: 600,
                    color: '#fff', background: '#002147', border: 'none',
                    borderRadius: 8, padding: '10px 16px', cursor: 'pointer', marginLeft: 'auto',
                  }}
                >
                  Add
                </button>
              </div>
            </div>
          </Field>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            style={{
              fontFamily: 'Onest, sans-serif', fontSize: 15, fontWeight: 700,
              color: '#fff', background: submitting ? '#6b7e96' : '#002147',
              border: 'none', borderRadius: 10, padding: '14px 0',
              cursor: submitting ? 'default' : 'pointer', width: '100%',
              transition: 'background 0.2s',
            }}
          >
            {submitting ? 'Creating your lab…' : 'Create Lab'}
          </button>
        </form>
      </main>
    </div>
  );
}

function Field({ label, hint, required, children }: { label: string; hint?: React.ReactNode; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <label style={{ fontFamily: 'Onest, sans-serif', fontWeight: 600, fontSize: 14, color: '#002147' }}>
          {label}{required && <span style={{ color: '#dc2626' }}> *</span>}
        </label>
        {hint && <span style={{ fontFamily: 'Onest, sans-serif', fontSize: 12 }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  fontFamily: 'Onest, sans-serif', fontSize: 14, color: '#002147',
  background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 8,
  padding: '10px 14px', width: '100%', boxSizing: 'border-box', outline: 'none',
};

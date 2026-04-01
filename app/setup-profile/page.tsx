"use client";

import { useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import { useAuth } from '@/lib/auth-context';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase-client';

function SetupProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const { user, setProfilePicture, setUsername } = useAuth();

  const [username, setUsernameLocal] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(file: File | null) {
    if (!file) return;
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  }

  async function handleSave() {
    if (!user) return;
    const name = username.trim();
    if (!name) { setError('Please enter a display name.'); return; }

    setSaving(true);
    setError(null);
    try {
      let url: string | null = null;
      if (photo) {
        const storageRef = ref(storage, `profile-pictures/${user.uid}`);
        await uploadBytes(storageRef, photo);
        url = await getDownloadURL(storageRef);
      }

      await setDoc(doc(db, 'users', user.uid), {
        username: name,
        ...(url ? { profile_picture_url: url } : {}),
      }, { merge: true });

      setUsername(name);
      if (url) setProfilePicture(url);
      router.push(redirect);
    } catch {
      setError('Something went wrong. Please try again.');
      setSaving(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background-clr-400)', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{
          background: '#fff',
          borderRadius: 14,
          boxShadow: '0 4px 32px rgba(0,0,0,0.08)',
          padding: '40px 44px',
          width: '100%',
          maxWidth: 420,
          textAlign: 'center',
        }}>

          <h2 style={{
            fontFamily: 'Quantico, sans-serif',
            fontSize: 26,
            fontWeight: 700,
            color: 'var(--tertiary-clr-100)',
            margin: '0 0 8px',
          }}>
            Set up your profile
          </h2>
          <p style={{ fontFamily: 'Onest, sans-serif', fontSize: 14, color: '#6b7e96', margin: '0 0 32px' }}>
            This will appear on your lab page.
          </p>

          {/* Avatar picker */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, marginBottom: 28 }}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: 108,
                height: 108,
                borderRadius: '50%',
                border: '2.5px dashed #c7d3e5',
                background: preview ? 'transparent' : '#f8fafc',
                padding: 0,
                cursor: 'pointer',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'border-color 0.2s',
                flexShrink: 0,
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--primary-clr-300)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#c7d3e5')}
            >
              {preview ? (
                <img src={preview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                </svg>
              )}
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                fontFamily: 'Onest, sans-serif',
                fontSize: 13,
                fontWeight: 600,
                color: '#002147',
                background: '#f1f5f9',
                border: '1.5px solid #c7d3e5',
                borderRadius: 8,
                padding: '9px 20px',
                cursor: 'pointer',
              }}
            >
              {preview ? 'Change photo' : 'Add profile photo (optional)'}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={e => handleFileChange(e.target.files?.[0] ?? null)}
            />
          </div>

          {/* Display name */}
          <div style={{ textAlign: 'left', marginBottom: 24 }}>
            <label style={{
              display: 'block',
              fontFamily: 'Onest, sans-serif',
              fontWeight: 600,
              fontSize: 14,
              color: '#002147',
              marginBottom: 6,
            }}>
              Display name <span style={{ color: '#dc2626' }}>*</span>
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsernameLocal(e.target.value)}
              placeholder="e.g. Dr. Jane Smith"
              maxLength={60}
              style={{
                width: '100%',
                fontFamily: 'Onest, sans-serif',
                fontSize: 14,
                color: '#002147',
                background: '#fff',
                border: '1.5px solid #e2e8f0',
                borderRadius: 8,
                padding: '10px 14px',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>

          {error && (
            <div style={{ fontFamily: 'Onest, sans-serif', fontSize: 13, color: '#c0392b', background: '#fdf0ef', border: '1px solid #f5c6c2', borderRadius: 6, padding: '10px 14px', marginBottom: 16, textAlign: 'left' }}>
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{
              width: '100%',
              fontFamily: 'Quantico, sans-serif',
              fontSize: 15,
              fontWeight: 700,
              color: '#fff',
              background: saving ? '#94a3b8' : '#002147',
              border: 'none',
              borderRadius: 8,
              padding: '13px 16px',
              cursor: saving ? 'default' : 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {saving ? 'Saving…' : 'Save & continue'}
          </button>

        </div>
      </main>
    </div>
  );
}

export default function SetupProfilePage() {
  return (
    <Suspense fallback={null}>
      <SetupProfileContent />
    </Suspense>
  );
}

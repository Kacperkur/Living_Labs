"use client";

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import { GoogleAuthProvider, signInWithPopup, getAdditionalUserInfo } from 'firebase/auth';
import { auth } from '@/lib/firebase-client';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogle() {
    setError(null);
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const isNew = getAdditionalUserInfo(result)?.isNewUser ?? false;
      if (isNew) {
        router.push(`/setup-profile?redirect=${encodeURIComponent(redirect)}`);
      } else {
        router.push(redirect);
      }
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in window was closed. Please try again.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Pop-up was blocked by your browser. Please allow pop-ups for this site.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
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
            fontSize: 28,
            fontWeight: 700,
            color: 'var(--tertiary-clr-100)',
            margin: '0 0 8px',
          }}>
            Welcome to Living Labs
          </h2>
          <p style={{ fontFamily: 'Onest, sans-serif', fontSize: 14, color: '#6b7e96', margin: '0 0 32px' }}>
            Sign up below
          </p>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              fontFamily: 'Onest, sans-serif',
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--tertiary-clr-100)',
              background: '#fff',
              border: '1.5px solid #ccd8e4',
              borderRadius: 8,
              padding: '13px 16px',
              cursor: loading ? 'default' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'border-color 0.2s',
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.borderColor = 'var(--primary-clr-300)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#ccd8e4'; }}
          >
            {loading ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.75s linear infinite', flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10" stroke="var(--primary-clr-300)" strokeWidth="3" strokeDasharray="31.4 31.4" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            {loading ? 'Signing in…' : 'Continue with Google'}
          </button>

          {error && (
            <div style={{ fontFamily: 'Onest, sans-serif', fontSize: 13, color: '#c0392b', background: '#fdf0ef', border: '1px solid #f5c6c2', borderRadius: 6, padding: '10px 14px', marginTop: 16, textAlign: 'left' }}>
              {error}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}

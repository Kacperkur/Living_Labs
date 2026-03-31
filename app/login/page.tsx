"use client";

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { auth } from '@/lib/firebase-client';

type Mode = 'signin' | 'signup';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [microsoftLoading, setMicrosoftLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function friendlyError(code: string): string {
    switch (code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Incorrect email or password.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      case 'auth/weak-password':
        return 'Password must be at least 6 characters.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/popup-closed-by-user':
        return 'Sign-in window was closed. Please try again.';
      case 'auth/popup-blocked':
        return 'Pop-up was blocked by your browser. Please allow pop-ups for this site.';
      default:
        return 'Something went wrong. Please try again.';
    }
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (mode === 'signup' && password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signin') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      router.push('/');
    } catch (err: any) {
      setError(friendlyError(err.code));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setMicrosoftLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.push('/');
    } catch (err: any) {
      setError(friendlyError(err.code));
    } finally {
      setMicrosoftLoading(false);
    }
  }

  function switchMode() {
    setMode(m => m === 'signin' ? 'signup' : 'signin');
    setError(null);
    setPassword('');
    setConfirm('');
  }

  const isSignIn = mode === 'signin';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background-clr-400)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header className="header-container">
        <div className="header-top-row">
          <Link href="/" className="logo-section" style={{ textDecoration: 'none', color: 'inherit' }}>
            <img className="header-logo" src="https://firebasestorage.googleapis.com/v0/b/livinglabs-1a831.firebasestorage.app/o/logo.jpg?alt=media" alt="Logo" />
            <h1 className="header-title">Living Labs</h1>
          </Link>
          <div className="nav-links">
            <Link href="/our-labs" style={{ textDecoration: 'none' }}><h2>Our Labs</h2></Link>
            <Link href="/join" style={{ textDecoration: 'none' }}><h2>Join</h2></Link>
          </div>
        </div>
      </header>

      {/* Card */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{
          background: '#fff',
          borderRadius: 14,
          boxShadow: '0 4px 32px rgba(0,0,0,0.08)',
          padding: '40px 44px',
          width: '100%',
          maxWidth: 420,
        }}>

          {/* Title */}
          <h2 style={{
            fontFamily: 'Quantico, sans-serif',
            fontSize: 28,
            fontWeight: 700,
            color: 'var(--tertiary-clr-100)',
            margin: '0 0 6px',
          }}>
            {isSignIn ? 'Welcome back' : 'Create an account'}
          </h2>
          <p style={{ fontFamily: 'Onest, sans-serif', fontSize: 14, color: '#6b7e96', margin: '0 0 28px' }}>
            {isSignIn ? 'Sign in to your Living Labs account.' : 'Join Living Labs to follow research and updates.'}
          </p>

          {/* Microsoft button */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={microsoftLoading || loading}
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
              padding: '11px 16px',
              cursor: microsoftLoading || loading ? 'default' : 'pointer',
              opacity: microsoftLoading || loading ? 0.6 : 1,
              transition: 'border-color 0.2s, background 0.2s',
              marginBottom: 20,
            }}
            onMouseEnter={e => { if (!microsoftLoading && !loading) e.currentTarget.style.borderColor = 'var(--primary-clr-300)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#ccd8e4'; }}
          >
            {microsoftLoading ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.75s linear infinite', flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10" stroke="var(--primary-clr-300)" strokeWidth="3" strokeDasharray="31.4 31.4" strokeLinecap="round" />
              </svg>
            ) : (
              /* Google logo */
              <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            {isSignIn ? 'Sign in with Google' : 'Sign up with Google'}
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: '#e4eaf0' }} />
            <span style={{ fontFamily: 'Onest, sans-serif', fontSize: 12, color: '#9aafbf' }}>or</span>
            <div style={{ flex: 1, height: 1, background: '#e4eaf0' }} />
          </div>

          {/* Email form */}
          <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontFamily: 'Onest, sans-serif', fontSize: 13, fontWeight: 600, color: 'var(--tertiary-clr-100)' }}>
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--primary-clr-300)')}
                onBlur={e => (e.currentTarget.style.borderColor = '#ccd8e4')}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontFamily: 'Onest, sans-serif', fontSize: 13, fontWeight: 600, color: 'var(--tertiary-clr-100)' }}>
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--primary-clr-300)')}
                onBlur={e => (e.currentTarget.style.borderColor = '#ccd8e4')}
              />
            </div>

            {!isSignIn && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontFamily: 'Onest, sans-serif', fontSize: 13, fontWeight: 600, color: 'var(--tertiary-clr-100)' }}>
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--primary-clr-300)')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#ccd8e4')}
                />
              </div>
            )}

            {error && (
              <div style={{ fontFamily: 'Onest, sans-serif', fontSize: 13, color: '#c0392b', background: '#fdf0ef', border: '1px solid #f5c6c2', borderRadius: 6, padding: '10px 14px' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || microsoftLoading}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                fontFamily: 'Quantico, sans-serif',
                fontSize: 15,
                fontWeight: 700,
                color: '#fff',
                background: loading ? 'var(--primary-clr-300)' : 'var(--tertiary-clr-100)',
                border: 'none',
                borderRadius: 8,
                padding: '13px',
                cursor: loading || microsoftLoading ? 'default' : 'pointer',
                opacity: microsoftLoading ? 0.6 : 1,
                transition: 'background 0.2s',
                marginTop: 4,
              }}
              onMouseEnter={e => { if (!loading && !microsoftLoading) e.currentTarget.style.background = 'var(--primary-clr-300)'; }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = 'var(--tertiary-clr-100)'; }}
            >
              {loading && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.75s linear infinite' }}>
                  <circle cx="12" cy="12" r="10" stroke="#fff" strokeWidth="3" strokeDasharray="31.4 31.4" strokeLinecap="round" />
                </svg>
              )}
              {isSignIn ? (loading ? 'Signing in…' : 'Sign In') : (loading ? 'Creating account…' : 'Create Account')}
            </button>
          </form>

          {/* Toggle */}
          <p style={{ fontFamily: 'Onest, sans-serif', fontSize: 13, color: '#6b7e96', textAlign: 'center', margin: '20px 0 0' }}>
            {isSignIn ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={switchMode}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Onest, sans-serif', fontSize: 13, fontWeight: 700, color: 'var(--primary-clr-300)', padding: 0 }}
            >
              {isSignIn ? 'Create one' : 'Sign in'}
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  fontFamily: 'Onest, sans-serif',
  fontSize: 14,
  padding: '11px 14px',
  border: '1.5px solid #ccd8e4',
  borderRadius: 8,
  outline: 'none',
  background: '#fff',
  color: 'var(--tertiary-clr-100)',
  transition: 'border-color 0.2s',
  width: '100%',
  boxSizing: 'border-box',
};

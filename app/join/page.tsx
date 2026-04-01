"use client";

import { useState } from 'react';
import Header from '@/components/Header';

export default function JoinPage() {
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    await fetch('/api/join-waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    setSubmitted(true);
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background-clr-400)', display: 'flex', flexDirection: 'column' }}>
      <Header />

      {/* Hero section */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', textAlign: 'center' }}>

        <div style={{ maxWidth: 640, width: '100%' }}>

          {/* Eyebrow label */}
          <div style={{
            display: 'inline-block',
            fontFamily: 'Onest, sans-serif',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#3d2e00',
            background: 'color-mix(in srgb, var(--secondary-clr-200) 25%, transparent)',
            borderRadius: 999,
            padding: '6px 16px',
            marginBottom: 28,
          }}>
            Early Access
          </div>

          {/* Headline */}
          <h1 style={{
            fontFamily: 'Quantico, sans-serif',
            fontSize: 'clamp(32px, 6vw, 56px)',
            fontWeight: 700,
            color: 'var(--tertiary-clr-100)',
            lineHeight: 1.1,
            margin: '0 0 20px',
          }}>
            Be part of what&rsquo;s<br />coming next.
          </h1>

          {/* Body copy */}
          <p style={{
            fontFamily: 'Onest, sans-serif',
            fontSize: 18,
            color: '#4a5e74',
            lineHeight: 1.7,
            margin: '0 0 12px',
          }}>
            Living Labs is building a platform to <strong style={{ color: 'var(--tertiary-clr-100)' }}>connect URI</strong>&rsquo;s research community &mdash;
            surfacing labs, people, and published work in one place.
          </p>
          <p style={{
            fontFamily: 'Onest, sans-serif',
            fontSize: 18,
            color: '#4a5e74',
            lineHeight: 1.7,
            margin: '0 0 48px',
          }}>
            <strong style={{ color: 'var(--tertiary-clr-100)' }}>If you are interested sign-up below!</strong>{' '}
            We will reach out to confirm your eligibility and get you a link to begin growing.
          </p>

          {/* Form / confirmation */}
          {submitted ? (
            <div style={{
              background: '#fff',
              border: '1px solid #d4eaf7',
              borderRadius: 12,
              padding: '32px 40px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
            }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
              <p style={{
                fontFamily: 'Onest, sans-serif',
                fontSize: 20,
                fontWeight: 700,
                color: 'var(--tertiary-clr-100)',
                margin: '0 0 8px',
              }}>
                You&rsquo;re on the list!
              </p>
              <p style={{
                fontFamily: 'Onest, sans-serif',
                fontSize: 15,
                color: '#6b7e96',
                margin: 0,
              }}>
                We&rsquo;ll be in touch at <strong>{email}</strong> as Living Labs grows.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 12, width: '100%', maxWidth: 480 }}>
                <input
                  type="email"
                  required
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{
                    flex: 1,
                    fontFamily: 'Onest, sans-serif',
                    fontSize: 15,
                    padding: '13px 18px',
                    border: '1.5px solid #ccd8e4',
                    borderRadius: 8,
                    outline: 'none',
                    background: '#fff',
                    color: 'var(--tertiary-clr-100)',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--primary-clr-300)')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#ccd8e4')}
                />
                <button
                  type="submit"
                  style={{
                    fontFamily: 'Quantico, sans-serif',
                    fontSize: 15,
                    fontWeight: 700,
                    padding: '13px 28px',
                    background: 'color-mix(in srgb, var(--secondary-clr-200) 25%, transparent)',
                    color: '#3d2e00',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--secondary-clr-200)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'color-mix(in srgb, var(--secondary-clr-200) 25%, transparent)')}
                >
                  Join Now
                </button>
              </div>

            </form>
          )}

        </div>
      </main>
    </div>
  );
}

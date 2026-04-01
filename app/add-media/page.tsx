"use client";

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import { useAuth } from '@/lib/auth-context';

function AddMediaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const labId = searchParams.get('lab_id') ?? '';
  const labName = searchParams.get('lab_name') ?? '';
  const isNew = searchParams.get('new') === '1';

  const [title, setTitle] = useState('');
  const [authors, setAuthors] = useState<string[]>([]);
  const [newAuthor, setNewAuthor] = useState('');
  const [contentUrl, setContentUrl] = useState('');
  const [description, setDescription] = useState('');
  const [published, setPublished] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addAuthor = () => {
    const trimmed = newAuthor.trim();
    if (!trimmed || authors.includes(trimmed)) return;
    setAuthors(prev => [...prev, trimmed]);
    setNewAuthor('');
  };

  const removeAuthor = (i: number) => setAuthors(prev => prev.filter((_, idx) => idx !== i));

  const handleSkip = () => {
    router.push(labId ? `/living-lab?id=${labId}` : '/our-labs');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim()) { setError('Title is required.'); return; }
    if (!labId) { setError('Lab ID is missing. Please go back and try again.'); return; }

    setSubmitting(true);
    try {
      const res = await fetch('/api/add-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          authors,
          description: description.trim(),
          content_url: contentUrl.trim(),
          published: published || null,
          lab_id: labId,
          lab_name: labName,
          location: null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add media');
      router.push(`/living-lab?id=${labId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background-clr-400)', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <main style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '40px 24px 80px' }}>
        <div style={{ width: '100%', maxWidth: 660 }}>

          {/* Opt-in header */}
          {isNew && (
            <div style={{ marginBottom: 32, textAlign: 'center' }}>
              <p style={{ fontFamily: 'Onest, sans-serif', fontWeight: 700, fontSize: 28, color: '#002147', margin: '0 0 8px 0' }}>
                Your lab is live!
              </p>
              <p style={{ fontFamily: 'Onest, sans-serif', fontWeight: 400, fontSize: 16, color: '#4a5568', margin: 0 }}>
                Would you like to add your first piece of media to <strong>{labName}</strong>?
              </p>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            style={{
              background: '#fff',
              borderRadius: 14,
              padding: '36px 40px',
              display: 'flex',
              flexDirection: 'column',
              gap: 24,
              boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
            }}
          >
            <p style={{ fontFamily: 'Onest, sans-serif', fontWeight: 700, fontSize: 22, color: '#002147', margin: 0 }}>
              {isNew ? 'Add First Media' : 'Add Media'}
            </p>

            {labName && (
              <p style={{ fontFamily: 'Onest, sans-serif', fontSize: 14, color: '#64748b', margin: '-16px 0 0 0' }}>
                For <strong>{labName}</strong>
              </p>
            )}

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', fontFamily: 'Onest, sans-serif', fontSize: 13, color: '#b91c1c' }}>
                {error}
              </div>
            )}

            {/* Title */}
            <Field label="Title" required>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Urban Heat Island Study 2024"
                style={inputStyle}
              />
            </Field>

            {/* Authors */}
            <Field label="Authors">
              {/* Bubbles */}
              {authors.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                  {authors.map((a, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        background: '#f8fafc', border: '1.5px solid #c7d3e5',
                        borderRadius: 20, padding: '4px 10px',
                        fontFamily: 'Onest, sans-serif', fontSize: 13, color: '#002147',
                      }}
                    >
                      {a}
                      <button
                        type="button"
                        onClick={() => removeAuthor(i)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1, color: '#94a3b8', fontSize: 16, marginLeft: 2 }}
                        aria-label={`Remove ${a}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={newAuthor}
                  onChange={e => setNewAuthor(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addAuthor(); } }}
                  placeholder="Add an author…"
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button
                  type="button"
                  onClick={addAuthor}
                  style={{
                    fontFamily: 'Onest, sans-serif', fontSize: 13, fontWeight: 600,
                    color: '#fff', background: '#002147', border: 'none',
                    borderRadius: 8, padding: '10px 16px', cursor: 'pointer', flexShrink: 0,
                  }}
                >
                  Add
                </button>
              </div>
            </Field>

            {/* Content URL */}
            <Field label="Content URL" hint="Link to paper, article, video, etc.">
              <input
                type="url"
                value={contentUrl}
                onChange={e => setContentUrl(e.target.value)}
                placeholder="https://…"
                style={inputStyle}
              />
            </Field>

            {/* Published Date */}
            <Field label="Published Date">
              <input
                type="date"
                value={published}
                onChange={e => setPublished(e.target.value)}
                style={inputStyle}
              />
            </Field>

            {/* Description */}
            <Field label="Description" hint="This text is used for search — describe the content clearly.">
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Briefly describe this media and its findings…"
                rows={5}
                style={{ ...inputStyle, resize: 'vertical', minHeight: 100 }}
              />
            </Field>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  fontFamily: 'Onest, sans-serif', fontSize: 15, fontWeight: 700,
                  color: '#fff', background: submitting ? '#6b7e96' : '#002147',
                  border: 'none', borderRadius: 10, padding: '14px 0',
                  cursor: submitting ? 'default' : 'pointer', flex: 1,
                  transition: 'background 0.2s',
                }}
              >
                {submitting ? 'Saving…' : 'Add Media'}
              </button>
              <button
                type="button"
                onClick={handleSkip}
                disabled={submitting}
                style={{
                  fontFamily: 'Onest, sans-serif', fontSize: 15, fontWeight: 400,
                  color: '#64748b', background: 'transparent',
                  border: '1.5px solid #c7d3e5', borderRadius: 10, padding: '14px 20px',
                  cursor: submitting ? 'default' : 'pointer',
                }}
              >
                {isNew ? 'Skip for now' : 'Cancel'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default function AddMediaPage() {
  return (
    <Suspense fallback={null}>
      <AddMediaContent />
    </Suspense>
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

function Field({ label, hint, required, children }: { label: string; hint?: string; required?: boolean; children: React.ReactNode }) {
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

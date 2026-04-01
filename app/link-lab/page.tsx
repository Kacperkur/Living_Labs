"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc, setDoc } from 'firebase/firestore';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/firebase-client';
import Header from '@/components/Header';

interface Lab {
  id: string;
  name: string | null;
  location: string | null;
}

export default function LinkLabPage() {
  const router = useRouter();
  const { user, loading, setLabId } = useAuth();

  const [labs, setLabs] = useState<Lab[]>([]);
  const [labsLoading, setLabsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [claiming, setClaiming] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  useEffect(() => {
    fetch('/api/all-labs')
      .then(r => r.json())
      .then(d => setLabs(d.labs ?? []))
      .catch(() => setLabs([]))
      .finally(() => setLabsLoading(false));
  }, []);

  if (loading || !user) return null;

  const filtered = labs.filter(lab => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return lab.name?.toLowerCase().includes(q) || lab.location?.toLowerCase().includes(q);
  });

  const handleClaim = async (lab: Lab) => {
    setError(null);
    setClaiming(lab.id);
    try {
      await setDoc(doc(db, 'users', user.uid), { email: user.email ?? '', lab_id: lab.id }, { merge: true });
      setLabId(lab.id);
      router.push(`/admin/lab/${lab.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to link lab. Please try again.');
      setClaiming(null);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background-clr-400)', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <main style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '40px 24px 80px' }}>
        <div style={{ width: '100%', maxWidth: 600 }}>

          <div style={{ marginBottom: 28 }}>
            <p style={{ fontFamily: 'Onest, sans-serif', fontWeight: 700, fontSize: 26, color: '#002147', margin: '0 0 8px' }}>
              Claim Your Lab
            </p>
            <p style={{ fontFamily: 'Onest, sans-serif', fontSize: 15, color: '#4a5568', margin: 0 }}>
              Find your lab below and click <strong>Claim</strong> to link it to your account. You'll be taken to the management page.
            </p>
          </div>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', fontFamily: 'Onest, sans-serif', fontSize: 13, color: '#b91c1c', marginBottom: 16 }}>
              {error}
            </div>
          )}

          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by lab name or building…"
            style={{
              width: '100%', boxSizing: 'border-box',
              fontFamily: 'Onest, sans-serif', fontSize: 14,
              padding: '11px 14px', borderRadius: 8,
              border: '1.5px solid #c7d3e5', background: '#fff',
              color: '#002147', outline: 'none', marginBottom: 16,
            }}
          />

          {labsLoading ? (
            <div style={{ fontFamily: 'Onest, sans-serif', fontSize: 14, color: '#002147', opacity: 0.4, padding: '24px 0', textAlign: 'center' }}>
              Loading labs…
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ fontFamily: 'Onest, sans-serif', fontSize: 14, color: '#002147', opacity: 0.4, padding: '24px 0', textAlign: 'center' }}>
              No labs found{search ? ` for "${search}"` : ''}.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtered.map(lab => (
                <div key={lab.id} style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: 'Onest, sans-serif', fontWeight: 700, fontSize: 15, color: '#002147', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {lab.name ?? '(Unnamed lab)'}
                    </p>
                    {lab.location && (
                      <p style={{ fontFamily: 'Onest, sans-serif', fontSize: 13, color: '#64748b', margin: 0 }}>
                        {lab.location}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleClaim(lab)}
                    disabled={!!claiming}
                    style={{
                      fontFamily: 'Onest, sans-serif', fontSize: 13, fontWeight: 600,
                      color: '#fff', background: claiming === lab.id ? '#6b7e96' : '#002147',
                      border: 'none', borderRadius: 8, padding: '9px 18px',
                      cursor: claiming ? 'default' : 'pointer', flexShrink: 0,
                      transition: 'background 0.15s',
                    }}
                  >
                    {claiming === lab.id ? 'Claiming…' : 'Claim'}
                  </button>
                </div>
              ))}
            </div>
          )}

          <p style={{ fontFamily: 'Onest, sans-serif', fontSize: 13, color: '#94a3b8', textAlign: 'center', marginTop: 24 }}>
            Don't see your lab?{' '}
            <a href="/create-lab" style={{ color: '#002147', fontWeight: 600, textDecoration: 'none' }}>Create a new one</a>
          </p>
        </div>
      </main>
    </div>
  );
}

'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

const LOCATIONS = ['Brookside', 'Rodman', 'Hillside', 'Quad', 'Fascitelli'];

const MESSAGES = [
  'Your quest begins!',
  'First stamp earned!',
  '2 down, 3 to go!',
  'Over halfway there!',
  'Almost a champion!',
  'Quest Complete! 🏆',
];

type LocationState = 'found' | 'animating' | 'empty';

function Sparkles({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className="absolute inset-0 pointer-events-none">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full bg-yellow-300"
          style={{
            top: '50%',
            left: '50%',
            animation: `sparkle-${i} 0.6s ease-out forwards`,
            transform: 'translate(-50%, -50%)',
            animationDelay: `${i * 0.05}s`,
          }}
        />
      ))}
    </div>
  );
}

function LocationBadge({ state, label }: { state: LocationState; label: string }) {
  const [showStar, setShowStar] = useState(state === 'found');
  const [sparkle, setSparkle] = useState(false);

  useEffect(() => {
    if (state === 'animating') {
      const t1 = setTimeout(() => setShowStar(true), 50);
      const t2 = setTimeout(() => setSparkle(true), 300);
      const t3 = setTimeout(() => setSparkle(false), 900);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }
  }, [state]);

  const isFound = state === 'found' || (state === 'animating' && showStar);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', minWidth: 0 }}>
      <div style={{ position: 'relative', width: '60px', height: '60px', flexShrink: 0 }}>
        <Sparkles active={sparkle} />

        {/* Empty slot */}
        {!isFound && (
          <div style={{ width: '100%', height: '100%', borderRadius: '10px', border: '2px dashed rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '24px' }}>?</span>
          </div>
        )}

        {/* Star */}
        {isFound && (
          <div
            style={{
              width: '100%',
              height: '100%',
              opacity: showStar ? 1 : 0,
              transform: showStar ? 'scale(1) rotate(0deg)' : 'scale(0.2) rotate(-30deg)',
              transition: showStar
                ? 'opacity 0.35s ease-out 0.28s, transform 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.28s'
                : 'none',
            }}
          >
            <div style={{ width: '100%', height: '100%', borderRadius: '10px', background: 'linear-gradient(135deg, #fde68a, #f59e0b)', boxShadow: '0 0 16px rgba(251,191,36,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg viewBox="0 0 96 96" style={{ width: '40px', height: '40px' }} fill="none">
                <polygon
                  points="48,6 61,35 93,38 70,60 76,92 48,76 20,92 26,60 3,38 35,35"
                  fill="white"
                  opacity="0.95"
                />
              </svg>
            </div>
          </div>
        )}
      </div>
      <span
        style={{
          fontFamily: 'Quantico, sans-serif',
          fontSize: '10px',
          fontWeight: 'bold',
          letterSpacing: '0.05em',
          textAlign: 'center',
          color: isFound ? '#fde68a' : 'rgba(255,255,255,0.45)',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
    </div>
  );
}

function ProgressBar({ count, total, animate }: { count: number; total: number; animate: boolean }) {
  const pct = (count / total) * 100;
  return (
    <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
      <div
        className="h-full rounded-full"
        style={{
          width: animate ? `${pct}%` : '0%',
          background: 'linear-gradient(90deg, #34d399, #fbbf24)',
          transition: 'width 0.8s cubic-bezier(0.34,1.2,0.64,1) 0.5s',
          boxShadow: '0 0 8px rgba(52,211,153,0.6)',
        }}
      />
    </div>
  );
}

function QuestContent() {
  const params = useSearchParams();
  const v = params.get('v');
  const version = Math.min(Math.max(parseInt(v ?? '1') || 1, 1), 5);

  const initialStates: LocationState[] = LOCATIONS.map((_, i) => {
    if (i < version - 1) return 'found';
    if (i === version - 1) return 'animating';
    return 'empty';
  });

  const [states, setStates] = useState<LocationState[]>(initialStates);
  const [count, setCount] = useState(version - 1);
  const [showCount, setShowCount] = useState(false);
  const [barReady, setBarReady] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => {
      setStates((prev) => {
        const next = [...prev];
        next[version - 1] = 'found';
        return next;
      });
      setCount(version);
      setShowCount(true);
    }, 900);

    const t2 = setTimeout(() => setBarReady(true), 300);

    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [version]);

  const message = MESSAGES[count] ?? MESSAGES[0];

  return (
    <div
      style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'linear-gradient(160deg, #002147 0%, #003d7a 50%, #002147 100%)', overflowY: 'auto' }}
    >
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.6); opacity: 0; }
        }
      `}</style>

      <div style={{ width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Header card */}
        <div
          style={{ borderRadius: '24px', padding: '28px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
        >
          <div
            style={{ position: 'absolute', inset: 0, opacity: 0.1, background: 'radial-gradient(circle at 50% 0%, #75B2DD, transparent 70%)' }}
          />
          <h1 style={{ fontFamily: 'Quantico, sans-serif', fontSize: '2.2rem', fontWeight: 900, color: 'white', lineHeight: 1.15, textAlign: 'center' }}>
            Rhody Rain Quest
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginTop: '6px', textAlign: 'center', letterSpacing: '0.05em' }}>Sustainability Explorer</p>
        </div>

        {/* Score card */}
        <div
          style={{ borderRadius: '24px', padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
        >
          <p style={{ fontFamily: 'Quantico, sans-serif', fontSize: '13px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', textAlign: 'center' }}>
            Features Found
          </p>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', position: 'relative' }}>
            {showCount && (
              <div
                style={{
                  position: 'absolute', inset: 0, borderRadius: '50%',
                  animation: 'pulse-ring 0.8s ease-out forwards',
                  background: 'radial-gradient(circle, rgba(251,191,36,0.3), transparent 70%)',
                  animationDelay: '0.9s',
                }}
              />
            )}
            <span
              style={{
                fontFamily: 'Quantico, sans-serif',
                fontSize: '6rem', fontWeight: 900, lineHeight: 1,
                color: '#EFCB68',
                opacity: showCount ? 1 : 0,
                transform: showCount ? 'scale(1)' : 'scale(0.5)',
                transition: 'opacity 0.4s ease-out 0.9s, transform 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.9s',
                textShadow: '0 0 30px rgba(239,203,104,0.5)',
              }}
            >
              {count}
            </span>
            <span style={{ fontFamily: 'Quantico, sans-serif', fontSize: '2rem', fontWeight: 'bold', color: 'rgba(255,255,255,0.3)', marginBottom: '12px' }}>
              /5
            </span>
          </div>

          <ProgressBar count={count} total={5} animate={barReady} />

          <p
            style={{
              fontFamily: 'Quantico, sans-serif', fontSize: '14px', fontWeight: 'bold', textAlign: 'center',
              color: count === 5 ? '#34d399' : '#75B2DD',
              opacity: showCount ? 1 : 0,
              transition: 'opacity 0.4s ease-out 1.2s',
            }}
          >
            {message}
          </p>
        </div>

        {/* Locations row */}
        <div
          style={{ borderRadius: '24px', padding: '28px 20px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
        >
          <p style={{ fontFamily: 'Quantico, sans-serif', fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.15em', textTransform: 'uppercase', textAlign: 'center', color: 'rgba(255,255,255,0.4)', marginBottom: '20px' }}>
            Locations
          </p>
          <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            {LOCATIONS.map((loc, i) => (
              <LocationBadge key={loc} state={states[i]} label={loc} />
            ))}
          </div>
        </div>

        {version === 5 && (
          <div
            style={{
              borderRadius: '24px',
              padding: '28px 24px',
              textAlign: 'center',
              background: 'linear-gradient(135deg, rgba(52,211,153,0.15), rgba(251,191,36,0.15))',
              border: '1px solid rgba(52,211,153,0.4)',
              opacity: showCount ? 1 : 0,
              transform: showCount ? 'scale(1)' : 'scale(0.95)',
              transition: 'opacity 0.5s ease-out 1.4s, transform 0.5s cubic-bezier(0.34,1.3,0.64,1) 1.4s',
            }}
          >
            <p style={{ fontFamily: 'Quantico, sans-serif', fontSize: '28px', marginBottom: '10px' }}>🏆</p>
            <p style={{ fontFamily: 'Quantico, sans-serif', fontSize: '16px', fontWeight: 900, color: '#34d399', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '8px' }}>
              Quest Complete!
            </p>
            <p style={{ fontFamily: 'Quantico, sans-serif', fontSize: '14px', color: 'white', lineHeight: 1.5 }}>
              Head to the <span style={{ color: '#fde68a', fontWeight: 'bold' }}>Maker Space</span> to claim your prize!
            </p>
          </div>
        )}

        <p style={{ fontFamily: 'Quantico, sans-serif', fontSize: '11px', color: 'rgba(255,255,255,0.2)', textAlign: 'center' }}>
          Scan QR codes across campus to collect all 5
        </p>
      </div>
    </div>
  );
}

export default function QuestPage() {
  return (
    <Suspense>
      <QuestContent />
    </Suspense>
  );
}

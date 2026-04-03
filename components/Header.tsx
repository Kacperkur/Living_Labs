"use client";

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

const STORAGE = 'https://firebasestorage.googleapis.com/v0/b/livinglabs-1a831.firebasestorage.app/o';

export default function Header() {
  const { user, labId, loading } = useAuth();

  const isOwner = !loading && !!user && !!labId;

  return (
    <header className="header-container">
      <div className="header-top-row">
        <Link href="/" className="logo-section" style={{ textDecoration: 'none', color: 'inherit' }}>
          <img className="header-logo" src={`${STORAGE}/logo.jpg?alt=media`} alt="Logo" />
          <h1 className="header-title">Living Labs<span style={{ fontSize: '0.50em', verticalAlign: 'super', marginLeft: '0.4em', letterSpacing: '0.05em', opacity: 0.6 }}>BETA</span></h1>
        </Link>
        <div className="nav-links">
          <Link href="/our-labs" style={{ textDecoration: 'none' }}><h2>Our Labs</h2></Link>
          <Link href="/about" style={{ textDecoration: 'none' }}><h2>About</h2></Link>
          <Link href="/suggestion-box" style={{ textDecoration: 'none' }}><h2>Suggest</h2></Link>
          {isOwner
            ? <Link href={`/admin/lab/${labId}`} style={{ textDecoration: 'none' }}><h2>My Lab</h2></Link>
            : <Link href="/join" style={{ textDecoration: 'none' }}><h2>Join</h2></Link>
          }
        </div>
      </div>
    </header>
  );
}

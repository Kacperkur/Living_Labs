"use client";

import React from 'react';

interface MemberBlockProps {
  name: string;
  profilePictureUrl?: string | null;
}

export default function MemberBlock({ name, profilePictureUrl }: MemberBlockProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 256 }}>
      {/* Profile picture / placeholder */}
      {profilePictureUrl ? (
        <img
          src={profilePictureUrl}
          alt={name}
          style={{ width: 256, height: 256, objectFit: 'cover', display: 'block' }}
          onError={(e) => {
            const img = e.target as HTMLImageElement;
            img.style.display = 'none';
            const placeholder = img.nextSibling as HTMLElement | null;
            if (placeholder) placeholder.style.display = 'flex';
          }}
        />
      ) : null}
      {/* Gray placeholder shown when no image or image fails to load */}
      <div
        style={{
          width: 256,
          height: 256,
          backgroundColor: '#c8d8e8',
          display: profilePictureUrl ? 'none' : 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <svg width={56} height={56} viewBox="0 0 80 80" fill="none">
          <circle cx={40} cy={28} r={18} fill="#9ab0c4" />
          <ellipse cx={40} cy={72} rx={30} ry={18} fill="#9ab0c4" />
        </svg>
      </div>

      {/* Member name */}
      <div
        style={{
          width: 256,
          marginTop: 10,
          fontFamily: 'Onest, sans-serif',
          fontSize: 16,
          fontWeight: 600,
          color: '#002147',
          textAlign: 'center',
          wordBreak: 'normal',
          overflowWrap: 'normal',
          lineHeight: 1.4,
        }}
      >
        {name}
      </div>
    </div>
  );
}

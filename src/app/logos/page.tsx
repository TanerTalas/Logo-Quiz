'use client';

/**
 * Logos Page Component
 * 
 * Renders the complete catalog gallery of all brand logos included in the game,
 * grouped by category for study/reference.
 */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { CATEGORIES, getLogoUrl, handleImageFallback } from '@/lib/gameData';
import { getMuted } from '@/lib/storage';
import { soundFx } from '@/lib/soundEffects';
import { FooterCredit } from '@/components/FooterCredit';

export default function LogosPage() {
  const [isMuted, setIsMuted] = useState<boolean>(false);

  useEffect(() => {
    setIsMuted(getMuted());
  }, []);

  const handleLinkClick = () => {
    soundFx.click(isMuted);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--color-bg)',
        color: 'var(--color-text)',
        fontFamily: 'var(--font-body)',
      }}
    >
      {/* Header bar */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '16px 24px',
          borderBottom: '2px solid var(--color-divider)',
        }}
      >
        <Link
          href="/"
          className="lq-nav-link"
          onClick={handleLinkClick}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
          >
            <path d="M19 12H5M11 18l-6-6 6-6" />
          </svg>
          Home
        </Link>
      </header>

      {/* Main catalog layout */}
      <main
        style={{
          width: '100%',
          maxWidth: '1100px',
          margin: '0 auto',
          padding: 'clamp(24px, 5vw, 56px) 24px 64px',
          display: 'flex',
          flexDirection: 'column',
          gap: '40px',
        }}
      >
        <div>
          <h1
            style={{
              margin: '0 0 8px',
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              fontSize: 'clamp(34px, 5vw, 56px)',
              lineHeight: 1,
              letterSpacing: '-0.02em',
              textTransform: 'uppercase',
            }}
          >
            The logos
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: '14px',
              color: 'color-mix(in srgb, var(--color-text) 65%, transparent)',
            }}
          >
            Every logo in the game, by category. Study up, then play.
          </p>
        </div>

        {/* Categories Sections */}
        {CATEGORIES.map((cat) => (
          <section key={cat.id} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: '12px',
                paddingBottom: '10px',
                borderBottom: '2px solid var(--color-divider)',
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 800,
                  fontSize: '22px',
                  textTransform: 'uppercase',
                }}
              >
                {cat.name}
              </h2>
              <span
                style={{
                  fontSize: '11px',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--color-accent)',
                }}
              >
                {cat.logos.length} logos
              </span>
            </div>

            {/* Logo items grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 150px), 1fr))',
                gap: '10px',
              }}
            >
              {cat.logos.map((logo) => (
                <div
                  key={logo.slug}
                  className="lq-logo-card"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getLogoUrl(logo.slug)}
                    alt={logo.name}
                    onError={handleImageFallback}
                    style={{ width: '44px', height: '44px', objectFit: 'contain' }}
                  />
                  <span
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontWeight: 800,
                      fontSize: '12px',
                      letterSpacing: '0.02em',
                      textTransform: 'uppercase',
                      textAlign: 'center',
                    }}
                  >
                    {logo.name}
                  </span>
                </div>
              ))}
            </div>
          </section>
        ))}
      </main>

      {/* Creator footer credit */}
      <FooterCredit />
    </div>
  );
}

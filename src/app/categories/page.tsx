'use client';

/**
 * Categories Page Component
 * 
 * Displays the category selection grid allowing players to start a quiz round
 * for a specific brand topic or a mixed random challenge.
 */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { CATEGORIES, ALL_LOGOS, getLogoUrl, handleImageFallback } from '@/lib/gameData';
import { getMuted } from '@/lib/storage';
import { soundFx } from '@/lib/soundEffects';
import { FooterCredit } from '@/components/FooterCredit';

export default function CategoriesPage() {
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
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--color-bg)',
        color: 'var(--color-text)',
        fontFamily: 'var(--font-body)',
      }}
    >
      {/* Header with back to Home navigation */}
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

      {/* Main section */}
      <main
        style={{
          flex: 1,
          width: '100%',
          maxWidth: '1100px',
          margin: '0 auto',
          padding: 'clamp(24px, 5vw, 56px) 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '28px',
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
            Pick a category
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: '14px',
              color: 'color-mix(in srgb, var(--color-text) 65%, transparent)',
            }}
          >
            Every logo in the category, one round each · 3 lives · guess early for more points.
          </p>
        </div>

        {/* Category Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 240px), 1fr))',
            gap: '12px',
          }}
        >
          {/* Mixed / All Logos Hero Card */}
          <Link
            href="/game"
            className="lq-cat-card-mixed"
            onClick={handleLinkClick}
          >
            <span
              style={{
                fontSize: '10px',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--color-bg)',
              }}
            >
              {ALL_LOGOS.length} logos
            </span>
            <span
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 800,
                fontSize: '24px',
                lineHeight: 1.05,
                textTransform: 'uppercase',
                flex: 1,
              }}
            >
              Mixed — everything
            </span>
            <span style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {ALL_LOGOS.slice(0, 4).map((l) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={l.slug}
                  src={getLogoUrl(l.slug)}
                  alt=""
                  onError={handleImageFallback}
                  style={{
                    width: '22px',
                    height: '22px',
                    objectFit: 'contain',
                    filter: 'blur(2px) grayscale(1) brightness(4)',
                    opacity: 0.75,
                  }}
                />
              ))}
              <svg
                style={{ marginLeft: 'auto' }}
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </span>
          </Link>

          {/* Individual Category Cards */}
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              href={`/game/${cat.id}`}
              className="lq-cat-card"
              onClick={handleLinkClick}
            >
              <span
                style={{
                  fontSize: '10px',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--color-accent)',
                }}
              >
                {cat.logos.length} logos
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 800,
                  fontSize: '24px',
                  lineHeight: 1.05,
                  textTransform: 'uppercase',
                  flex: 1,
                }}
              >
                {cat.name}
              </span>
              <span style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                {cat.logos.slice(0, 4).map((l) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={l.slug}
                    src={getLogoUrl(l.slug)}
                    alt=""
                    onError={handleImageFallback}
                    style={{
                      width: '22px',
                      height: '22px',
                      objectFit: 'contain',
                      filter: 'blur(2px) grayscale(1)',
                      opacity: 0.75,
                    }}
                  />
                ))}
                <svg
                  style={{ marginLeft: 'auto' }}
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                >
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </span>
            </Link>
          ))}
        </div>
      </main>

      {/* Creator footer credit */}
      <FooterCredit />
    </div>
  );
}

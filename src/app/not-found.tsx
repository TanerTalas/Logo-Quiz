/**
 * Not Found Page
 *
 * Shown for any address that does not resolve — a mistyped URL, an old link, or a
 * category slug that is not in the database. Next.js renders this file both for
 * unmatched routes and for any `notFound()` call, such as the one in /game/[category].
 *
 * The background logos come from a fixed list rather than the database. An error
 * page is what gets shown when something has gone wrong — quite possibly the
 * database itself — so it deliberately has no data dependency. This matches how the
 * intro curtain and the home page globe pick their decorative tiles.
 */

import React from 'react';

import { getLogoUrl } from '@/lib/logoImages';
import { SoundLink } from '@/components/SoundLink';
import { FooterCredit } from '@/components/FooterCredit';

// Recognisable, visually distinct marks — they read as brand shapes even blurred
// down to background texture.
const GHOST_SLUGS = [
  'nike', 'ferrari', 'spotify', 'playstation', 'starbucks',
  'tesla', 'netflix', 'visa', 'mcdonalds',
];

// Fixed scatter positions, as percentages of the viewport. Hand-placed rather than
// randomised so the logos never bunch up or crowd the headline.
const GHOST_SPOTS: [number, number][] = [
  [6, 12], [26, 68], [44, 20], [62, 78], [78, 34],
  [88, 66], [16, 44], [52, 52], [72, 8],
];

export default function NotFound() {
  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: 'var(--color-bg)',
        color: 'var(--color-text)',
        fontFamily: 'var(--font-body)',
      }}
    >
      {/* Blurred brand logos drifting behind everything else */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', opacity: 0.5 }}>
        {GHOST_SLUGS.map((slug, i) => {
          const [left, top] = GHOST_SPOTS[i];
          // Varying size and timing per tile keeps the drift from looking synchronised.
          const size = 54 + ((i * 37) % 46);
          const delay = (i * 0.7).toFixed(2);
          const duration = (9 + (i % 4) * 1.6).toFixed(1);

          return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={slug}
              className="lq-nf-ghost"
              src={getLogoUrl(slug)}
              alt=""
              style={{
                left: `${left}%`,
                top: `${top}%`,
                width: `${size}px`,
                height: `${size}px`,
                filter: 'grayscale(1) blur(3px)',
                animation: `lq-nf-drift ${duration}s ${delay}s ease-in-out infinite`,
              }}
            />
          );
        })}
      </div>

      {/* Header bar */}
      <header
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '16px 24px',
          borderBottom: '2px solid var(--color-divider)',
        }}
      >
        <SoundLink href="/" className="lq-nav-link">
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
        </SoundLink>

        <span
          style={{
            marginLeft: 'auto',
            fontSize: '10px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'color-mix(in srgb, var(--color-text) 55%, transparent)',
          }}
        >
          Error 404
        </span>
      </header>

      {/* Main section */}
      <main
        style={{
          position: 'relative',
          zIndex: 2,
          flex: 1,
          width: '100%',
          maxWidth: '1100px',
          margin: '0 auto',
          padding: 'clamp(28px, 6vw, 72px) 24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 'clamp(18px, 3vw, 30px)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(10px, 2vw, 18px)' }}>
          <span
            style={{
              fontSize: '11px',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--color-accent-700)',
              animation: 'lq-nf-rise 0.5s cubic-bezier(.2,.9,.2,1) both',
            }}
          >
            Unrecognised
          </span>

          {/* The three digits rise one after another, middle one in accent */}
          <h1
            style={{
              margin: 0,
              display: 'flex',
              alignItems: 'baseline',
              gap: 'clamp(6px, 1.4vw, 16px)',
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              fontSize: 'clamp(84px, 22vw, 240px)',
              lineHeight: 0.78,
              letterSpacing: '-0.04em',
            }}
          >
            <span style={{ animation: 'lq-nf-rise 0.5s 0.06s cubic-bezier(.2,.9,.2,1) both' }}>4</span>
            <span
              style={{
                color: 'var(--color-accent)',
                animation: 'lq-nf-rise 0.5s 0.14s cubic-bezier(.2,.9,.2,1) both',
              }}
            >
              0
            </span>
            <span style={{ animation: 'lq-nf-rise 0.5s 0.22s cubic-bezier(.2,.9,.2,1) both' }}>4</span>
          </h1>

          <div
            style={{
              width: 'min(520px, 80%)',
              height: '2px',
              background: 'var(--color-text)',
              transformOrigin: '0 50%',
              animation: 'lq-nf-rule 0.6s 0.3s cubic-bezier(.2,.9,.2,1) both',
            }}
          />

          <h2
            style={{
              margin: 0,
              maxWidth: '22ch',
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              fontSize: 'clamp(24px, 4.4vw, 46px)',
              lineHeight: 1.02,
              letterSpacing: '-0.02em',
              textTransform: 'uppercase',
              textWrap: 'pretty',
              animation: 'lq-nf-rise 0.5s 0.36s cubic-bezier(.2,.9,.2,1) both',
            }}
          >
            This logo isn&apos;t in the set
          </h2>

          <p
            style={{
              margin: 0,
              maxWidth: '46ch',
              fontSize: '14px',
              lineHeight: 1.6,
              textWrap: 'pretty',
              color: 'color-mix(in srgb, var(--color-text) 68%, transparent)',
              animation: 'lq-nf-rise 0.5s 0.44s cubic-bezier(.2,.9,.2,1) both',
            }}
          >
            The page you asked for doesn&apos;t exist — wrong address, an old link, or a round that
            has already ended. Pick a category and start a new one.
          </p>
        </div>

        {/* Recovery actions */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '10px',
            paddingBottom: '44px',
            animation: 'lq-nf-rise 0.5s 0.52s cubic-bezier(.2,.9,.2,1) both',
          }}
        >
          <SoundLink href="/categories" className="btn btn-primary" style={{ minHeight: '46px' }}>
            Play a category
            <svg
              style={{ marginLeft: '8px' }}
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </SoundLink>

          <SoundLink href="/" className="btn btn-secondary" style={{ minHeight: '46px' }}>
            Back to home
          </SoundLink>

          <SoundLink href="/logos" className="btn btn-ghost" style={{ minHeight: '46px' }}>
            Browse all logos
          </SoundLink>
        </div>
      </main>

      {/* Creator footer credit */}
      <FooterCredit />
    </div>
  );
}

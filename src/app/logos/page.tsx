/**
 * Logos Page Component
 *
 * Renders the complete catalog gallery of all brand logos included in the game,
 * grouped by category for study/reference.
 *
 * A Server Component — the catalog is read from Postgres and rendered to HTML.
 * Names are deliberately public here: this page exists so players can study the
 * brands before playing. Hiding answers only matters inside a round.
 */

import React from 'react';

import { getCatalog, countLogos } from '@/db/queries';
import { SoundLink } from '@/components/SoundLink';
import { FooterCredit } from '@/components/FooterCredit';

// Rebuilt at most once an hour; the catalog only changes on a re-seed.
export const revalidate = 3600;

export default async function LogosPage() {
  const catalog = await getCatalog();
  const totalLogos = countLogos(catalog);

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
            All {totalLogos} logos in the game, by category. Study up, then play.
          </p>
        </div>

        {/* Categories Sections */}
        {catalog.map((category) => (
          <section key={category.slug} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                {category.name}
              </h2>
              <span
                style={{
                  fontSize: '11px',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--color-accent)',
                }}
              >
                {category.logos.length} logos
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
              {category.logos.map((logo) => (
                <div key={logo.name} className="lq-logo-card">
                  {/* Lazy loaded: the full catalog is several hundred images. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logo.imageUrl}
                    alt={logo.name}
                    loading="lazy"
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

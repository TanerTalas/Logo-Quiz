/**
 * Categories Page Component
 *
 * Displays the category selection grid allowing players to start a quiz round
 * for a specific brand topic or a mixed random challenge.
 *
 * This is a Server Component: the category list is read straight from Postgres and
 * rendered to HTML on the server, so no logo data is shipped as JSON. The only
 * client-side JavaScript on the page is the SoundLink wrapper around each card.
 */

import React from 'react';

import { getCatalog, countLogos } from '@/db/queries';
import { SoundLink } from '@/components/SoundLink';
import { FooterCredit } from '@/components/FooterCredit';

// The catalog changes only when the database is re-seeded, so the rendered page is
// cached and refreshed at most once an hour instead of querying on every visit.
export const revalidate = 3600;

export default async function CategoriesPage() {
  const catalog = await getCatalog();
  const totalLogos = countLogos(catalog);

  // Four thumbnails per card, taken from across the category rather than the first
  // four alphabetically, so the preview looks varied.
  const previewFor = (logos: { imageUrl: string }[]) => {
    const step = Math.max(1, Math.floor(logos.length / 4));
    return [0, 1, 2, 3].map((i) => logos[i * step]).filter(Boolean);
  };

  const mixedPreview = previewFor(catalog.flatMap((c) => c.logos));

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
          <SoundLink href="/game" className="lq-cat-card-mixed">
            <span
              style={{
                fontSize: '10px',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--color-bg)',
              }}
            >
              {totalLogos} logos
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
              {mixedPreview.map((logo) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={logo.imageUrl}
                  src={logo.imageUrl}
                  alt=""
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
          </SoundLink>

          {/* Individual Category Cards */}
          {catalog.map((category) => (
            <SoundLink
              key={category.slug}
              href={`/game/${category.slug}`}
              className="lq-cat-card"
            >
              <span
                style={{
                  fontSize: '10px',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--color-accent)',
                }}
              >
                {category.logos.length} logos
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
                {category.name}
              </span>
              <span style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                {previewFor(category.logos).map((logo) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={logo.imageUrl}
                    src={logo.imageUrl}
                    alt=""
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
            </SoundLink>
          ))}
        </div>
      </main>

      {/* Creator footer credit */}
      <FooterCredit />
    </div>
  );
}

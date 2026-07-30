'use client';

/**
 * Home Page Component
 * 
 * Renders the main landing screen featuring high score readout, sound toggle controls,
 * call-to-action buttons ("Play", "Logos"), responsive 3D LogoGlobe, and IntroOverlay.
 */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getHighScore, getMuted, setMuted } from '@/lib/storage';
import { soundFx } from '@/lib/soundEffects';
import { LogoGlobe } from '@/components/LogoGlobe';
import { IntroOverlay } from '@/components/IntroOverlay';
import { FooterCredit } from '@/components/FooterCredit';

export default function HomePage() {
  const [highScore, setHighScoreState] = useState<number>(0);
  const [isMuted, setIsMutedState] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    setHighScoreState(getHighScore());
    setIsMutedState(getMuted());

    const mq = window.matchMedia('(max-width: 720px)');
    const updateMedia = () => setIsMobile(mq.matches);
    updateMedia();

    mq.addEventListener('change', updateMedia);
    return () => mq.removeEventListener('change', updateMedia);
  }, []);

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setMuted(nextMuted);
    setIsMutedState(nextMuted);
    if (!nextMuted) {
      soundFx.click(false);
    }
  };

  const handleButtonClick = () => {
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
      {/* Header section with high score and sound toggle */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          padding: '16px 24px',
          borderBottom: '2px solid var(--color-divider)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
          <span
            style={{
              fontSize: '10px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'color-mix(in srgb, var(--color-text) 60%, transparent)',
            }}
          >
            Best score
          </span>
          <span
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              fontSize: '22px',
              color: 'var(--color-accent-700)',
            }}
          >
            {highScore}
          </span>
        </div>

        <button
          className="lq-btn-sound"
          onClick={handleToggleMute}
          aria-label="Toggle sound"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
          >
            <path d="M11 5 6 9H2v6h4l5 4V5Z" />
            {isMuted ? (
              <path d="m22 9-6 6M16 9l6 6" />
            ) : (
              <path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a9 9 0 0 1 0 14" />
            )}
          </svg>
          Sound {isMuted ? 'off' : 'on'}
        </button>
      </header>

      {/* Main hero grid with brand messaging and 3D globe panel */}
      <main
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))',
          position: 'relative',
          overflow: 'hidden',
          borderBottom: '2px solid var(--color-divider)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: '24px',
            padding: 'clamp(24px, 6vw, 72px)',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <div
            style={{
              fontSize: '11px',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--color-accent)',
            }}
          >
            The faster you guess, the more you score
          </div>
          <h1
            style={{
              margin: 0,
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              fontSize: 'clamp(52px, 9vw, 120px)',
              lineHeight: 0.95,
              letterSpacing: '-0.02em',
              textTransform: 'uppercase',
            }}
          >
            Logo
            <br />
            Quiz
          </h1>
          <p
            style={{
              margin: 0,
              maxWidth: '44ch',
              fontSize: '15px',
              lineHeight: 1.55,
              color: 'color-mix(in srgb, var(--color-text) 75%, transparent)',
            }}
          >
            A blurred logo sharpens in seconds. Guess it early for more points — you have three lives.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            <Link
              href="/categories"
              className="lq-btn-primary"
              onClick={handleButtonClick}
            >
              Play
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>

            <Link
              href="/logos"
              className="lq-btn-secondary"
              onClick={handleButtonClick}
            >
              Logos
            </Link>
          </div>
        </div>

        {/* Interactive Logo Globe container */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isMobile ? '0' : 'clamp(12px, 2.5vw, 32px)',
            borderLeft: isMobile ? 'none' : '2px solid var(--color-divider)',
            background: isMobile ? 'transparent' : 'var(--color-accent)',
            position: isMobile ? 'absolute' : 'static',
            top: 0,
            bottom: 0,
            right: 0,
            width: isMobile ? '72%' : 'auto',
            opacity: isMobile ? 0.22 : 1,
            pointerEvents: isMobile ? 'none' : 'auto',
            zIndex: 0,
            transition: 'opacity 0.3s',
          }}
        >
          <div style={{ position: 'relative', flex: 1, alignSelf: 'stretch', minHeight: '320px' }}>
            <LogoGlobe
              tone={isMobile ? 'ghost' : 'onAccent'}
              interactive={!isMobile}
              minTile={isMobile ? 34 : 44}
            />
          </div>
        </div>
      </main>

      {/* Intro curtain animation overlay — plays on entry and on refresh, not on back */}
      <IntroOverlay />

      {/* Creator footer credit */}
      <FooterCredit />
    </div>
  );
}

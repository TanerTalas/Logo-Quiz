'use client';

/**
 * Game Over Page Component
 * 
 * Displays the final results summary of a completed quiz round, including score,
 * correct answer ratio, high score NEW badge, and replay options.
 */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getLastGameSummary, getHighScore, GameSummary } from '@/lib/storage';
import { soundFx } from '@/lib/soundEffects';
import { getMuted } from '@/lib/storage';
import { useEphemeralScreen } from '@/lib/useEphemeralScreen';
import { FooterCredit } from '@/components/FooterCredit';

export default function GameOverPage() {
  // The summary belongs to the round that just ended, so a reload (or a direct URL hit)
  // returns the player home instead of showing a stale result screen.
  const isLeaving = useEphemeralScreen('/');

  const [summary, setSummary] = useState<GameSummary | null>(null);
  const [highScore, setHighScoreState] = useState<number>(0);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  useEffect(() => {
    setIsMuted(getMuted());
    const last = getLastGameSummary();
    const high = getHighScore();
    setSummary(last);
    setHighScoreState(high);

    const mq = window.matchMedia('(max-width: 720px)');
    const updateMedia = () => setIsMobile(mq.matches);
    updateMedia();

    mq.addEventListener('change', updateMedia);
    return () => mq.removeEventListener('change', updateMedia);
  }, []);

  const handleLinkClick = () => {
    soundFx.click(isMuted);
  };

  const isComplete = summary?.reason === 'complete';
  const headline = isComplete ? 'Round complete' : 'Game over';
  const subline = summary
    ? isComplete
      ? `${summary.catName || 'Mixed'} — all questions answered`
      : `${summary.catName || 'Mixed'} — out of lives`
    : 'No round played yet';

  const scoreVal = summary ? summary.score : 0;
  const correctVal = summary ? `${summary.correct} / ${summary.total}` : '—';
  const isNewBest = scoreVal > 0 && scoreVal >= highScore;
  const againHref = summary?.cat ? `/game/${summary.cat}` : '/game';

  // Nothing to show while the reload guard hands control back to the home screen.
  if (isLeaving) return null;

  return (
    <div
      data-screen-label="Game over"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--color-accent)',
        color: 'var(--color-bg)',
        fontFamily: 'var(--font-body)',
      }}
    >
      {/* Header bar */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          padding: '16px 24px',
          borderBottom: '2px solid color-mix(in srgb, var(--color-bg) 40%, transparent)',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 800,
            fontSize: '14px',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          Logo Quiz
        </span>
      </header>

      {/* Main section */}
      <main
        style={{
          flex: 1,
          width: '100%',
          maxWidth: '860px',
          margin: '0 auto',
          padding: 'clamp(28px, 6vw, 72px) 24px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 'clamp(24px, 4vw, 40px)',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '11px',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              marginBottom: '12px',
              opacity: 0.85,
            }}
          >
            {subline}
          </div>
          <h1
            style={{
              margin: 0,
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              fontSize: 'clamp(48px, 10vw, 120px)',
              lineHeight: 0.95,
              letterSpacing: '-0.02em',
              textTransform: 'uppercase',
            }}
          >
            {headline}
          </h1>
        </div>

        {/* Score & statistics grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
            gap: '2px',
            background: 'color-mix(in srgb, var(--color-bg) 40%, transparent)',
            border: '2px solid color-mix(in srgb, var(--color-bg) 40%, transparent)',
          }}
        >
          <div style={{ padding: '18px 20px', background: 'var(--color-accent)' }}>
            <div
              style={{
                fontSize: '10px',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                opacity: 0.85,
                marginBottom: '6px',
              }}
            >
              Score
            </div>
            <div
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 800,
                fontSize: 'clamp(34px, 5vw, 52px)',
                lineHeight: 1,
              }}
            >
              {scoreVal}
            </div>
          </div>

          <div style={{ padding: '18px 20px', background: 'var(--color-accent)' }}>
            <div
              style={{
                fontSize: '10px',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                opacity: 0.85,
                marginBottom: '6px',
              }}
            >
              Correct
            </div>
            <div
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 800,
                fontSize: 'clamp(34px, 5vw, 52px)',
                lineHeight: 1,
              }}
            >
              {correctVal}
            </div>
          </div>

          <div style={{ padding: '18px 20px', background: 'var(--color-accent)' }}>
            <div
              style={{
                fontSize: '10px',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                opacity: 0.85,
                marginBottom: '6px',
              }}
            >
              Best score
            </div>
            <div
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 800,
                fontSize: 'clamp(34px, 5vw, 52px)',
                lineHeight: 1,
              }}
            >
              {highScore}
              {isNewBest && (
                <span
                  style={{
                    fontSize: '12px',
                    letterSpacing: '0.08em',
                    verticalAlign: 'super',
                    marginLeft: '8px',
                  }}
                >
                  NEW
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div
          style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: 'stretch',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <Link
            href={againHref}
            className="lq-gameover-btn-play"
            onClick={handleLinkClick}
          >
            Play again
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
            >
              <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </Link>

          <Link
            href="/categories"
            className="lq-gameover-btn-sec"
            onClick={handleLinkClick}
          >
            Categories
          </Link>

          <Link
            href="/"
            className="lq-gameover-btn-link"
            onClick={handleLinkClick}
          >
            Home
          </Link>
        </div>
      </main>

      {/* Creator footer credit */}
      <FooterCredit />
    </div>
  );
}

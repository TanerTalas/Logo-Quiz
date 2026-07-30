'use client';

/**
 * Intro Overlay Component
 * 
 * Renders the introductory animated curtain showcase featuring brand tile shuffling,
 * staggered typography reveals ("LOGO QUIZ"), and a split-curtain exit animation.
 */

import React, { useEffect, useRef, useState } from 'react';
import { getDocumentNavigationType, isDocumentEntry } from '@/lib/navigation';
import { getLogoUrl } from '@/lib/gameData';

export interface IntroOverlayProps {
  cycleMs?: number;
  holdMs?: number;
}

const BRAND_SLUGS = [
  'spotify',
  'bmw',
  'mcdonalds',
  'playstation',
  'netflix',
  'ferrari',
  'starbucks',
  'github',
  'twitch',
  'nike',
  'adidas',
  'apple',
  'android',
  'ubisoft',
  'pepsi',
  'tesla',
  'airbnb',
  'discord',
];

export const IntroOverlay: React.FC<IntroOverlayProps> = ({
  cycleMs = 3600,
  holdMs = 700,
}) => {
  const [active, setActive] = useState<boolean>(false);
  const [currentBrandSlug, setCurrentBrandSlug] = useState<string>(BRAND_SLUGS[0]);

  // DOM element refs for animation manipulation
  const overlayRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const botRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const tileRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const ruleRef = useRef<HTMLDivElement>(null);
  const bylineRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLDivElement>(null);
  const skipRef = useRef<HTMLButtonElement>(null);
  const letterRefs = useRef<(HTMLSpanElement | null)[]>([]);

  // Timer & RAF trackers
  const timersRef = useRef<NodeJS.Timeout[]>([]);
  const rafRef = useRef<number | null>(null);
  const isDoneRef = useRef<boolean>(false);

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const finish = (fast: boolean = false) => {
    if (isDoneRef.current) return;
    isDoneRef.current = true;
    clearTimers();

    const fadeMs = fast ? 140 : 260;
    const splitMs = fast ? 520 : 760;

    if (overlayRef.current) overlayRef.current.style.pointerEvents = 'none';
    if (skipRef.current) skipRef.current.style.opacity = '0';

    if (contentRef.current) {
      contentRef.current.style.transition = `opacity ${fadeMs}ms ease, transform ${fadeMs + 200}ms ease`;
      contentRef.current.style.opacity = '0';
      contentRef.current.style.transform = 'translateY(-8px)';
    }

    const t1 = setTimeout(() => {
      const cubicEase = 'cubic-bezier(.76,0,.24,1)';
      if (topRef.current) {
        topRef.current.style.transition = `transform ${splitMs}ms ${cubicEase}`;
        topRef.current.style.transform = 'translateY(-101%)';
      }
      if (botRef.current) {
        botRef.current.style.transition = `transform ${splitMs}ms ${cubicEase}`;
        botRef.current.style.transform = 'translateY(101%)';
      }
    }, fadeMs);
    timersRef.current.push(t1);

    const t2 = setTimeout(() => {
      if (overlayRef.current) overlayRef.current.style.display = 'none';
      setActive(false);
    }, fadeMs + splitMs + 40);
    timersRef.current.push(t2);
  };

  const resetStyles = () => {
    clearTimers();
    isDoneRef.current = false;

    if (overlayRef.current) {
      overlayRef.current.style.display = 'block';
      overlayRef.current.style.pointerEvents = 'auto';
    }
    if (topRef.current) {
      topRef.current.style.transition = 'none';
      topRef.current.style.transform = 'none';
    }
    if (botRef.current) {
      botRef.current.style.transition = 'none';
      botRef.current.style.transform = 'none';
    }
    if (contentRef.current) {
      contentRef.current.style.transition = 'none';
      contentRef.current.style.opacity = '1';
      contentRef.current.style.transform = 'none';
    }
    if (skipRef.current) {
      skipRef.current.style.transition = 'opacity 0.3s';
      skipRef.current.style.opacity = '1';
    }
    letterRefs.current.forEach((l) => {
      if (l) {
        l.style.display = 'inline-block';
        l.style.transition = 'none';
        l.style.opacity = '0';
        l.style.transform = 'translateY(0.4em)';
      }
    });
    if (ruleRef.current) {
      ruleRef.current.style.transition = 'none';
      ruleRef.current.style.transformOrigin = '0 50%';
      ruleRef.current.style.transform = 'scaleX(0)';
    }
    if (bylineRef.current) {
      bylineRef.current.style.transition = 'none';
      bylineRef.current.style.opacity = '0';
      bylineRef.current.style.transform = 'translateY(10px)';
    }
    if (counterRef.current) {
      counterRef.current.style.transition = 'none';
      counterRef.current.style.opacity = '1';
    }
    if (tileRef.current) {
      tileRef.current.style.transition = 'none';
      tileRef.current.style.transform = 'none';
      tileRef.current.style.borderColor = 'var(--color-text)';
    }
  };

  const playSequence = () => {
    setActive(true);
    resetStyles();

    const duration = Math.max(1200, cycleMs);
    const pA = duration * 0.25;
    const pB = duration * 0.55;
    const t0 = performance.now();
    let accum = 0;
    let lastTime = t0;
    let shownIdx = -1;

    const spin = (now: number) => {
      const elapsed = now - t0;
      const dt = Math.min(60, now - lastTime);
      lastTime = now;

      let speedFactor: number;
      if (elapsed < pA) {
        const u = elapsed / pA;
        speedFactor = 4 + 40 * u * u;
      } else if (elapsed < pB) {
        speedFactor = 44;
      } else {
        const u = Math.min(1, (elapsed - pB) / (duration - pB));
        speedFactor = 44 * Math.pow(1 - u, 2.6);
      }

      accum += (speedFactor * dt) / 1000;
      const idx = Math.floor(accum) % BRAND_SLUGS.length;

      if (idx !== shownIdx) {
        shownIdx = idx;
        setCurrentBrandSlug(BRAND_SLUGS[idx]);
      }

      if (imgRef.current) {
        imgRef.current.style.filter = `blur(${(speedFactor * 0.09).toFixed(2)}px) grayscale(1)`;
      }
      if (tileRef.current) {
        tileRef.current.style.transform = `scale(${(1 + Math.min(0.06, speedFactor * 0.0014)).toFixed(3)})`;
      }

      if (elapsed < duration) {
        rafRef.current = requestAnimationFrame(spin);
      } else {
        if (imgRef.current) {
          imgRef.current.style.filter = 'blur(0px) grayscale(1)';
        }
        if (tileRef.current) {
          tileRef.current.style.transition = 'transform 0.5s cubic-bezier(.2,.9,.2,1), border-color 0.4s ease';
          tileRef.current.style.transform = 'scale(1)';
          tileRef.current.style.borderColor = 'var(--color-accent)';
        }
        revealSequence();
      }
    };

    const revealSequence = () => {
      if (counterRef.current) {
        counterRef.current.style.transition = 'opacity 0.35s ease';
        counterRef.current.style.opacity = '0';
      }

      letterRefs.current.forEach((l, i) => {
        const t = setTimeout(() => {
          if (l) {
            l.style.transition = 'opacity 0.42s ease, transform 0.52s cubic-bezier(.16,.9,.2,1)';
            l.style.opacity = '1';
            l.style.transform = 'translateY(0)';
          }
        }, 60 + i * 58);
        timersRef.current.push(t);
      });

      const tRule = setTimeout(() => {
        if (ruleRef.current) {
          ruleRef.current.style.transition = 'transform 0.7s cubic-bezier(.2,.9,.2,1)';
          ruleRef.current.style.transform = 'scaleX(1)';
        }
      }, 380);
      timersRef.current.push(tRule);

      const tByline = setTimeout(() => {
        if (bylineRef.current) {
          bylineRef.current.style.transition = 'opacity 0.5s ease, transform 0.6s cubic-bezier(.2,.9,.2,1)';
          bylineRef.current.style.opacity = '1';
          bylineRef.current.style.transform = 'translateY(0)';
        }
      }, 620);
      timersRef.current.push(tByline);

      const tFinish = setTimeout(() => {
        finish(false);
      }, 620 + 520 + Math.max(0, holdMs));
      timersRef.current.push(tFinish);
    };

    rafRef.current = requestAnimationFrame(spin);
  };

  useEffect(() => {
    /**
     * The curtain plays whenever the browser hands us a fresh document for this page —
     * a first visit, a pasted URL or a refresh — but stays out of the way when the user
     * steps back into it with the browser back button, or navigates home from inside
     * the app (both of which keep or restore an already visited page).
     */
    const shouldPlay = isDocumentEntry() && getDocumentNavigationType() !== 'back_forward';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        finish(true);
      }
    };

    const handleReplayEvent = () => {
      playSequence();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('intro:replay', handleReplayEvent);

    if (shouldPlay) {
      playSequence();
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('intro:replay', handleReplayEvent);
      clearTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cycleMs, holdMs]);

  if (!active) return null;

  const logoLetters = ['L', 'O', 'G', 'O'];
  const quizLetters = ['Q', 'U', 'I', 'Z'];

  return (
    <div
      ref={overlayRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 900,
        overflow: 'hidden',
      }}
    >
      {/* Top split curtain panel */}
      <div
        ref={topRef}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: '50.5%',
          background: 'var(--color-bg)',
          borderBottom: '2px solid var(--color-divider)',
          willChange: 'transform',
        }}
      />

      {/* Bottom split curtain panel */}
      <div
        ref={botRef}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: '50.5%',
          background: 'var(--color-bg)',
          willChange: 'transform',
        }}
      />

      {/* Intro Overlay Content */}
      <div
        ref={contentRef}
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          gap: 'clamp(20px, 3vw, 34px)',
          padding: 'clamp(24px, 6vw, 72px)',
          fontFamily: 'var(--font-body)',
          color: 'var(--color-text)',
          willChange: 'opacity',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            ref={tileRef}
            style={{
              width: 'clamp(88px, 13vw, 132px)',
              aspectRatio: '1',
              display: 'grid',
              placeItems: 'center',
              border: '2px solid var(--color-text)',
              background: 'var(--color-bg)',
              willChange: 'transform',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={getLogoUrl(currentBrandSlug)}
              alt={currentBrandSlug}
              style={{
                width: '58%',
                height: '58%',
                objectFit: 'contain',
                filter: 'grayscale(1)',
              }}
            />
          </div>
          <div
            ref={counterRef}
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              fontSize: '11px',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--color-accent)',
            }}
          >
            Shuffling brands
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'baseline',
            gap: 'clamp(18px, 3vw, 40px)',
            fontFamily: 'var(--font-heading)',
            fontWeight: 800,
            fontSize: 'clamp(52px, 11vw, 148px)',
            lineHeight: 0.92,
            letterSpacing: '-0.01em',
            textTransform: 'uppercase',
          }}
        >
          <div style={{ display: 'flex' }}>
            {logoLetters.map((char, idx) => (
              <span
                key={`logo-${idx}`}
                ref={(el) => {
                  letterRefs.current[idx] = el;
                }}
              >
                {char}
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', color: 'var(--color-accent)' }}>
            {quizLetters.map((char, idx) => (
              <span
                key={`quiz-${idx}`}
                ref={(el) => {
                  letterRefs.current[4 + idx] = el;
                }}
              >
                {char}
              </span>
            ))}
          </div>
        </div>

        <div
          ref={ruleRef}
          style={{
            width: 'min(460px, 70%)',
            height: '2px',
            background: 'var(--color-text)',
            willChange: 'transform',
          }}
        ></div>

        <div
          ref={bylineRef}
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '8px',
            fontSize: '11px',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'color-mix(in srgb, var(--color-text) 60%, transparent)',
            willChange: 'transform, opacity',
          }}
        >
          Designed &amp; coded by
          <strong
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              fontSize: '13px',
              color: 'var(--color-text)',
            }}
          >
            Taner Talas
          </strong>
        </div>
      </div>

      {/* Skip Button */}
      <button
        ref={skipRef}
        className="lq-btn-skip"
        onClick={() => finish(true)}
      >
        Skip
      </button>
    </div>
  );
};

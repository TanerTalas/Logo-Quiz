'use client';

/**
 * Intro Overlay Component
 *
 * Renders the introductory animated curtain showcase featuring brand tile shuffling,
 * staggered typography reveals ("LOGO QUIZ"), and a split-curtain exit animation.
 *
 * The markup stays mounted and toggled with `display` instead of being conditionally
 * rendered: the whole sequence is driven by direct DOM writes, so every ref has to exist
 * before the first frame runs.
 *
 * It ships *visible* in the server rendered HTML, in its pre animation pose, so the
 * curtain is painted together with the document — revealing it from script left a visible
 * flash of the home page first. See `.lq-intro-root` in globals.css for the escape
 * hatches that keep a non playing curtain from covering the page.
 */

import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { getDocumentNavigationType, isDocumentEntry } from '@/lib/navigation';
import { getLogoUrl } from '@/lib/logoImages';

// A layout effect is what this component needs, but React logs a warning when one is
// reached while rendering on the server, so fall back to the plain effect there.
const useBrowserLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

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

// Pose every headline letter is served in and returned to before each play
const LETTER_START_STYLE: React.CSSProperties = {
  display: 'inline-block',
  opacity: 0,
  transform: 'translateY(0.4em)',
};

export const IntroOverlay: React.FC<IntroOverlayProps> = ({
  cycleMs = 3600,
  holdMs = 700,
}) => {
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

  // Brand logos kept in memory so the shuffle never waits on a network round trip
  const preloadedRef = useRef<HTMLImageElement[]>([]);

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  /**
   * Warms the browser cache for every brand tile shown during the shuffle.
   */
  const preloadBrandLogos = () => {
    if (preloadedRef.current.length > 0) return;

    preloadedRef.current = BRAND_SLUGS.map((slug) => {
      const image = new Image();
      image.src = getLogoUrl(slug);
      return image;
    });
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
    }, fadeMs + splitMs + 40);
    timersRef.current.push(t2);
  };

  /**
   * Reveals the overlay and puts every animated element back to its starting pose:
   * letters hidden below the baseline, rule collapsed, byline down and faded out.
   */
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
    preloadBrandLogos();
    resetStyles();

    const duration = Math.max(1200, cycleMs);
    const pA = duration * 0.25;
    const pB = duration * 0.55;
    const t0 = performance.now();
    let accum = 0;
    let lastTime = t0;
    let shownIdx = -1;

    /**
     * Slot machine style brand shuffle: accelerates, holds at full speed, then eases
     * down to a stop. The tile image is written to directly — going through React state
     * would mean a re-render on every single frame.
     */
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

      if (imgRef.current && idx !== shownIdx) {
        shownIdx = idx;
        imgRef.current.src = getLogoUrl(BRAND_SLUGS[idx]);
        imgRef.current.alt = BRAND_SLUGS[idx];
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

    /**
     * Typography reveal once the shuffle lands: letters rise in one by one, the rule
     * sweeps out, the byline fades up, then the curtain splits open.
     */
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

  /**
   * Takes the curtain off screen without any animation, for the loads where the intro is
   * not supposed to play at all.
   */
  const hideImmediately = () => {
    isDoneRef.current = true;
    if (overlayRef.current) {
      overlayRef.current.style.display = 'none';
      overlayRef.current.style.pointerEvents = 'none';
    }
  };

  /**
   * A layout effect rather than a plain one: on an in-app navigation home this runs
   * before the browser paints, so the curtain that ships visible in the markup is hidden
   * again without ever being seen. (On a document load the HTML is painted before React
   * gets here — that case is handled by the blocking script in the root layout.)
   */
  useBrowserLayoutEffect(() => {
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
    } else {
      hideImmediately();
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('intro:replay', handleReplayEvent);
      clearTimers();
    };
    // The animation reads the timings when it starts; nothing else here belongs in deps.
  }, [cycleMs, holdMs]);

  const logoLetters = ['L', 'O', 'G', 'O'];
  const quizLetters = ['Q', 'U', 'I', 'Z'];

  return (
    <div ref={overlayRef} className="lq-intro-root">
      {/* Without script nothing here can ever animate away, so never show it at all. */}
      <noscript>
        <style>{`.lq-intro-root { display: none; }`}</style>
      </noscript>

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
            {/* Source is swapped frame by frame by the shuffle loop */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={getLogoUrl(BRAND_SLUGS[0])}
              alt={BRAND_SLUGS[0]}
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
          {/* Letters start below the baseline and invisible — the same pose resetStyles
              puts them back into — so the served HTML already looks like frame zero. */}
          <div style={{ display: 'flex' }}>
            {logoLetters.map((char, idx) => (
              <span
                key={`logo-${idx}`}
                ref={(el) => {
                  letterRefs.current[idx] = el;
                }}
                style={LETTER_START_STYLE}
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
                style={LETTER_START_STYLE}
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
            transformOrigin: '0 50%',
            transform: 'scaleX(0)',
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
            opacity: 0,
            transform: 'translateY(10px)',
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

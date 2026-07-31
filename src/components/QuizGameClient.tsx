'use client';

/**
 * Quiz Game Client Component
 *
 * Manages the real-time gameplay loop: a "Ready? / Go" countdown before the first question,
 * timer unblurring animation, points calculation, 3 lives tracking with shake/heart loss
 * animations, option feedback states, audio SFX, and navigation to the Game Over screen.
 *
 * The component never learns the answers. On mount it asks /api/round for a set of
 * questions — four option labels each, with nothing marking the right one — and the
 * mystery logo is loaded by question position from /api/logo-image. Every guess goes
 * to /api/guess, which returns the verdict and the points earned. Everything here is
 * presentation: the clock, the blur and the points badge are how the round *looks*,
 * while what it is worth is decided on the server.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

import { getMuted, setMuted, setHighScore, getHighScore, setLastGameSummary } from '@/lib/storage';
import { soundFx } from '@/lib/soundEffects';
import { useEphemeralScreen } from '@/lib/useEphemeralScreen';
import { REVEAL_MS, TOTAL_MS, STARTING_LIVES, pointsForElapsed } from '@/lib/scoring';
import { FooterCredit } from '@/components/FooterCredit';

/** One question as the browser sees it: four labels, no answer key. */
interface Question {
  options: string[];
}

/** The server's verdict on a submitted guess. */
interface GuessResult {
  correct: boolean;
  correctAnswer: string;
  points: number;
}

export interface QuizGameClientProps {
  /** Category slug to play, or omitted for a mixed round. */
  categorySlug?: string;
  /** Display name for the header and countdown curtain. */
  categoryName?: string;
  maxBlur?: number;
  /** Shows the pre-round "Ready? / Go" countdown; set to false to start instantly. */
  showCountdown?: boolean;
}

export const QuizGameClient: React.FC<QuizGameClientProps> = ({
  categorySlug,
  categoryName = 'Mixed',
  maxBlur = 18,
  showCountdown = true,
}) => {
  const router = useRouter();

  // A round cannot survive a page reload, so refreshing (or opening the URL directly)
  // sends the player back home. Declared first so its effect runs before the round setup.
  const isLeaving = useEphemeralScreen('/');

  // Game state variables
  const [questions, setQuestions] = useState<Question[]>([]);
  // Tags image URLs so they belong to this round and nothing else.
  const [roundId, setRoundId] = useState<string>('');
  const [loadError, setLoadError] = useState<boolean>(false);
  const [qIndex, setQIndex] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [lives, setLives] = useState<number>(STARTING_LIVES);
  // The round opens on the countdown screen and only then moves into the play loop.
  const [phase, setPhase] = useState<'countdown' | 'play' | 'feedback'>('countdown');
  // 2 renders "Ready?", 1 renders "Go".
  const [countStep, setCountStep] = useState<number>(2);
  const [pickedOption, setPickedOption] = useState<string | null>(null);
  // Null while the server is still deciding, which keeps the feedback styling neutral.
  const [result, setResult] = useState<GuessResult | null>(null);
  const [checkFailed, setCheckFailed] = useState<boolean>(false);
  const [blur, setBlur] = useState<number>(maxBlur);
  const [points, setPoints] = useState<number>(100);
  const [timePct, setTimePct] = useState<number>(100);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [quitOpen, setQuitOpen] = useState<boolean>(false);
  const [lostFade, setLostFade] = useState<boolean>(false);
  const [correctCount, setCorrectCount] = useState<number>(0);

  // Timing references
  const t0Ref = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(-1);
  const fbTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fadeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const cdTimerRef = useRef<NodeJS.Timeout | null>(null);
  // Guards against a late timeout firing after the player has already answered.
  const answeredRef = useRef<boolean>(false);

  // Countdown word element, re-triggered on each step to replay its entrance animation
  const countRef = useRef<HTMLDivElement>(null);

  // -------------------------------------------------------------------------
  // Round setup
  // -------------------------------------------------------------------------

  useEffect(() => {
    // Skip building a round we are about to navigate away from.
    if (isLeaving) return;

    setIsMuted(getMuted());

    // Starting the round also sets the httpOnly cookie the image and guess routes
    // read, so this request has to succeed before anything else can happen.
    const controller = new AbortController();

    fetch('/api/round', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: categorySlug ?? null }),
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error(`Round request failed: ${response.status}`);
        return response.json() as Promise<{ questions: Question[]; roundId: string }>;
      })
      .then((data) => {
        setRoundId(data.roundId);
        setQuestions(data.questions);
      })
      .catch((error) => {
        if (error.name === 'AbortError') return;
        setLoadError(true);
      });

    return () => controller.abort();
  }, [categorySlug, isLeaving]);

  /**
   * Pre-round countdown. Runs once the round is ready: holds on "Ready?" for a beat,
   * flashes "Go", then hands over to the play loop by switching the phase — the effect
   * below picks that up and starts the first question with fresh handlers.
   */
  useEffect(() => {
    if (isLeaving || questions.length === 0) return;

    // Countdown turned off: drop straight into the first question.
    if (!showCountdown) {
      setPhase('play');
      return;
    }

    setPhase('countdown');
    setCountStep(2);
    setBlur(maxBlur);
    setTimePct(100);
    soundFx.tick(isMuted);

    cdTimerRef.current = setTimeout(() => {
      setCountStep(1);
      soundFx.click(isMuted);
      cdTimerRef.current = setTimeout(() => setPhase('play'), 620);
    }, 1500);

    return () => {
      if (cdTimerRef.current) clearTimeout(cdTimerRef.current);
    };
    // isMuted is read once on purpose: toggling sound must not restart the countdown.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions, isLeaving, showCountdown, maxBlur]);

  // Replays the entrance animation of the countdown word on every step change
  useEffect(() => {
    if (phase !== 'countdown') return;

    const el = countRef.current;
    if (!el) return;

    el.style.animation = 'none';
    void el.offsetWidth; // Forced reflow so the animation restarts from the beginning
    el.style.animation = 'lq-count 0.55s cubic-bezier(.16,.9,.2,1) both';
  }, [phase, countStep]);

  /** Image URL for a question, tagged so it belongs to this round only. */
  const imageUrlFor = useCallback(
    (index: number) => `/api/logo-image/${index}?r=${encodeURIComponent(roundId)}`,
    [roundId]
  );

  // Fetches the next question's logo ahead of time — during the countdown for the
  // first one, during the feedback pause for the rest — so the mystery box is
  // already filled when the question flips over.
  useEffect(() => {
    if (!roundId || questions.length === 0) return;

    const next = phase === 'countdown' ? 0 : qIndex + 1;
    if (next >= questions.length) return;

    const image = new window.Image();
    image.src = imageUrlFor(next);
  }, [roundId, questions.length, phase, qIndex, imageUrlFor]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (fbTimerRef.current) clearTimeout(fbTimerRef.current);
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
      if (cdTimerRef.current) clearTimeout(cdTimerRef.current);
    };
  }, []);

  // -------------------------------------------------------------------------
  // Round flow
  // -------------------------------------------------------------------------

  const finishGame = useCallback(
    (reason: 'lives' | 'complete', finalScore: number, finalCorrect: number) => {
      const high = Math.max(getHighScore(), finalScore);
      setHighScore(high);

      setLastGameSummary({
        score: finalScore,
        correct: finalCorrect,
        total: questions.length,
        cat: categorySlug || '',
        catName: categoryName,
        reason,
      });

      if (reason === 'complete') {
        soundFx.win(isMuted);
      } else {
        soundFx.gameover(isMuted);
      }

      setTimeout(() => {
        router.push('/gameover');
      }, 600);
    },
    [questions.length, categorySlug, categoryName, isMuted, router]
  );

  /** Moves to the next question, or ends the round when there is none left. */
  const advance = useCallback(
    (nextLives: number, nextScore: number, nextCorrect: number) => {
      if (nextLives <= 0) {
        finishGame('lives', nextScore, nextCorrect);
        return;
      }
      if (qIndex + 1 >= questions.length) {
        finishGame('complete', nextScore, nextCorrect);
        return;
      }
      setQIndex((prev) => prev + 1);
      setPhase('play');
      setPickedOption(null);
      setResult(null);
      setCheckFailed(false);
      // Blur has to go back up in the same batch as the new question index.
      // startQuestion() only runs an effect later, which would leave one painted
      // frame showing the next logo unblurred — and since it is preloaded, that
      // frame renders instantly and the answer flashes on screen. The clock and the
      // points badge are reset here for the same reason.
      setBlur(maxBlur);
      setTimePct(100);
      setPoints(pointsForElapsed(0));
    },
    [qIndex, questions.length, finishGame, maxBlur]
  );

  const handleAnswer = useCallback(
    (name: string | null) => {
      if (answeredRef.current) return;
      answeredRef.current = true;

      if (rafRef.current) cancelAnimationFrame(rafRef.current);

      // Freeze the question immediately so the round feels responsive; the colours
      // and the score follow a moment later, once the server has ruled on it.
      const elapsedMs = performance.now() - t0Ref.current;
      setPhase('feedback');
      setPickedOption(name);
      setBlur(0);
      setTimePct(0);

      const submit = async (): Promise<GuessResult> => {
        const response = await fetch('/api/guess', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ index: qIndex, answer: name, elapsedMs }),
        });
        if (!response.ok) throw new Error(`Guess request failed: ${response.status}`);
        return response.json() as Promise<GuessResult>;
      };

      // One retry covers a dropped packet without stalling the round on a real outage.
      submit()
        .catch(() => submit())
        .then((verdict) => {
          setResult(verdict);

          if (verdict.correct) {
            soundFx.correct(isMuted);
          } else {
            soundFx.wrong(isMuted);
            setLostFade(false);
            if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
            fadeTimerRef.current = setTimeout(() => setLostFade(true), 750);
          }

          const nextScore = score + verdict.points;
          const nextLives = lives - (verdict.correct ? 0 : 1);
          const nextCorrect = correctCount + (verdict.correct ? 1 : 0);

          setScore(nextScore);
          setLives(nextLives);
          setCorrectCount(nextCorrect);

          fbTimerRef.current = setTimeout(() => advance(nextLives, nextScore, nextCorrect), 1500);
        })
        .catch(() => {
          // The verdict never arrived. Skipping the question costs the player nothing
          // rather than charging them a life for a network problem.
          setCheckFailed(true);
          fbTimerRef.current = setTimeout(() => advance(lives, score, correctCount), 1500);
        });
    },
    [qIndex, isMuted, lives, score, correctCount, advance]
  );

  const startQuestion = useCallback(() => {
    t0Ref.current = performance.now();
    lastTickRef.current = -1;
    answeredRef.current = false;
    setPhase('play');
    setPickedOption(null);
    setBlur(maxBlur);
    setPoints(pointsForElapsed(0));
    setTimePct(100);

    const tickLoop = (now: number) => {
      const elapsed = now - t0Ref.current;
      const f = Math.min(1, elapsed / REVEAL_MS);
      const currentBlur = maxBlur * (1 - f);
      const currentTimePct = Math.max(0, 100 * (1 - elapsed / TOTAL_MS));
      const remainSec = Math.ceil((TOTAL_MS - elapsed) / 1000);

      if (remainSec <= 3 && remainSec >= 1 && remainSec !== lastTickRef.current) {
        lastTickRef.current = remainSec;
        soundFx.tick(isMuted);
      }

      if (elapsed >= TOTAL_MS) {
        handleAnswer(null);
        return;
      }

      setBlur(currentBlur);
      // Mirrors the server's formula so the badge never promises the wrong number.
      setPoints(pointsForElapsed(elapsed));
      setTimePct(currentTimePct);
      rafRef.current = requestAnimationFrame(tickLoop);
    };

    rafRef.current = requestAnimationFrame(tickLoop);
  }, [maxBlur, isMuted, handleAnswer]);

  // Starts a question whenever the round enters the play phase: after the countdown for
  // the first one, and after each feedback pause for the ones that follow.
  useEffect(() => {
    if (isLeaving) return;

    if (questions.length > 0 && phase === 'play' && pickedOption === null) {
      startQuestion();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions, qIndex, phase]);

  // -------------------------------------------------------------------------
  // Controls
  // -------------------------------------------------------------------------

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setMuted(nextMuted);
    setIsMuted(nextMuted);
    if (!nextMuted) soundFx.click(false);
  };

  const handleAskQuit = () => {
    soundFx.click(isMuted);
    setQuitOpen(true);
  };

  const handleCancelQuit = () => {
    soundFx.click(isMuted);
    setQuitOpen(false);
  };

  const handleConfirmQuit = () => {
    soundFx.click(isMuted);
    router.push('/categories');
  };

  const currentQ = questions[qIndex];
  const isFeedback = phase === 'feedback';
  const isCountdown = phase === 'countdown';
  // Styling waits for the verdict, so an unresolved guess stays neutral.
  const isCorrectPick = result?.correct === true;
  const isWrongPick = result?.correct === false;

  // Nothing to show while the reload guard hands control back to the home screen.
  if (isLeaving) return null;

  // The round never started — without it there are no questions to show.
  if (loadError) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          gap: '20px',
          padding: 'clamp(24px, 6vw, 72px)',
          background: 'var(--color-bg)',
          color: 'var(--color-text)',
          fontFamily: 'var(--font-body)',
        }}
      >
        <h1
          style={{
            margin: 0,
            fontFamily: 'var(--font-heading)',
            fontWeight: 800,
            fontSize: 'clamp(32px, 7vw, 64px)',
            lineHeight: 0.95,
            textTransform: 'uppercase',
          }}
        >
          Could not start the round
        </h1>
        <p style={{ margin: 0, fontSize: '14px', maxWidth: '40ch', lineHeight: 1.6 }}>
          The server did not answer. Check your connection and try again.
        </p>
        <button className="btn btn-primary" onClick={() => router.push('/categories')}>
          Back to categories
        </button>
      </div>
    );
  }

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
      {/* Header bar */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          padding: '12px 20px',
          borderBottom: '2px solid var(--color-divider)',
        }}
      >
        <button className="lq-nav-link" onClick={handleAskQuit}>
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
          Quit
        </button>

        <span
          style={{
            fontSize: '10px',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'color-mix(in srgb, var(--color-text) 60%, transparent)',
            whiteSpace: 'nowrap',
          }}
        >
          {questions.length ? `${qIndex + 1} / ${questions.length}` : ''}
        </span>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            className="lq-btn-sound"
            onClick={handleToggleMute}
            aria-label="Toggle sound"
            style={{ width: '44px', height: '44px', padding: 0, justifyContent: 'center' }}
          >
            <svg
              width="18"
              height="18"
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
          </button>
        </div>
      </header>

      {/* Top Countdown Timer Bar */}
      <div style={{ height: '4px', background: 'var(--color-neutral-200)' }}>
        <div
          style={{
            height: '100%',
            background: 'var(--color-accent)',
            width: `${timePct}%`,
            transition: phase === 'feedback' ? 'width 0.2s linear' : 'none',
          }}
        />
      </div>

      {/* Main Game Interface */}
      <main
        style={{
          flex: 1,
          width: '100%',
          maxWidth: '760px',
          margin: '0 auto',
          padding: 'clamp(16px, 4vw, 40px) 20px 32px',
          display: 'flex',
          flexDirection: 'column',
          gap: 'clamp(16px, 3vw, 28px)',
        }}
      >
        {/* Lives readout & Score bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            paddingBottom: '12px',
            borderBottom: '2px solid var(--color-divider)',
          }}
        >
          {/* Hearts Lives Display with loss animation */}
          <div
            style={{
              display: 'flex',
              gap: '6px',
              animation: isWrongPick ? 'lq-shake 0.5s ease' : 'none',
            }}
            aria-label="Lives"
          >
            {[0, 1, 2].map((i) => {
              const alive = i < lives;
              const justLost = isWrongPick && i === lives;
              const fill = alive ? 'var(--color-accent)' : 'none';
              const stroke = alive || (justLost && !lostFade) ? 'var(--color-accent)' : 'var(--color-neutral-400)';
              const anim = justLost ? 'lq-lose 0.7s ease' : 'none';

              return (
                <svg
                  key={i}
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill={fill}
                  stroke={stroke}
                  strokeWidth="2"
                  style={{ animation: anim, transition: 'stroke 0.6s ease' }}
                >
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.51 4.04 3 5.5l7 7Z" />
                </svg>
              );
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span
              style={{
                fontSize: '10px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'color-mix(in srgb, var(--color-text) 60%, transparent)',
              }}
            >
              Score
            </span>
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '22px' }}>
              {score}
            </span>
          </div>
        </div>

        {/* Title and Points badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <h1
            style={{
              margin: 0,
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              fontSize: 'clamp(20px, 3.4vw, 30px)',
              lineHeight: 1,
              letterSpacing: '-0.01em',
              textTransform: 'uppercase',
            }}
          >
            Whose logo is this?
          </h1>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '6px 12px',
              background: isCorrectPick
                ? 'oklch(0.62 0.19 150)'
                : isWrongPick || checkFailed
                ? 'var(--color-accent)'
                : 'var(--color-accent-100)',
              color: isCorrectPick || isWrongPick || checkFailed ? 'var(--color-bg)' : 'var(--color-accent-800)',
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              fontSize: '16px',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}
          >
            {checkFailed ? (
              'Skipped'
            ) : result ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px' }}>
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="square"
                >
                  {result.correct ? (
                    <path d="M20 6 9 17l-5-5" />
                  ) : pickedOption === null ? (
                    <g strokeWidth="2.4">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 7v5l3 2" />
                    </g>
                  ) : (
                    <path d="M18 6 6 18M6 6l12 12" />
                  )}
                </svg>
                {result.correct ? `+${result.points}` : result.correctAnswer}
              </span>
            ) : isFeedback ? (
              // Guess is in flight; say so rather than showing a stale points figure.
              'Checking…'
            ) : (
              `+${points} pts`
            )}
          </div>
        </div>

        {/* Mystery Logo Box with unblur filter */}
        <div
          style={{
            alignSelf: 'center',
            width: 'min(320px, 70vw)',
            aspectRatio: '1',
            display: 'grid',
            placeItems: 'center',
            background: '#ffffff',
            border: `2px solid ${
              isCorrectPick
                ? 'oklch(0.62 0.19 150)'
                : isWrongPick
                ? 'var(--color-accent)'
                : 'var(--color-divider)'
            }`,
            boxShadow: isCorrectPick
              ? '0 0 0 4px color-mix(in srgb, oklch(0.62 0.19 150) 35%, transparent), 0 0 28px color-mix(in srgb, oklch(0.62 0.19 150) 60%, transparent)'
              : isWrongPick
              ? '0 0 0 4px color-mix(in srgb, var(--color-accent) 35%, transparent), 0 0 28px color-mix(in srgb, var(--color-accent) 60%, transparent)'
              : 'none',
            transition: 'border-color 0.2s, box-shadow 0.2s',
            overflow: 'hidden',
          }}
        >
          {/* Loaded by question position, not by brand — see /api/logo-image.
              Kept hidden during the countdown so the logo is not revealed early. */}
          {currentQ && !isCountdown && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={qIndex}
              src={imageUrlFor(qIndex)}
              alt="Mystery logo"
              style={{
                width: '62%',
                height: '62%',
                objectFit: 'contain',
                filter: `blur(${Math.round(blur * 10) / 10}px)`,
              }}
            />
          )}
        </div>

        {/* Multiple Choice Option Buttons */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
            gap: '10px',
          }}
        >
          {currentQ?.options.map((optName, i) => {
            const greenColor = 'oklch(0.62 0.19 150)';
            // Which option was right is only known once the server has replied.
            const isOptionCorrect = result != null && optName === result.correctAnswer;
            const isOptionWrongPick =
              result != null && pickedOption === optName && optName !== result.correctAnswer;
            const markColor = isOptionCorrect
              ? result?.correct
                ? greenColor
                : 'var(--color-neutral-900)'
              : isOptionWrongPick
              ? 'var(--color-accent)'
              : null;

            return (
              <button
                key={optName}
                className="lq-option-btn"
                onClick={() => handleAnswer(optName)}
                disabled={isFeedback || isCountdown}
                style={{
                  background: markColor || undefined,
                  color: markColor ? 'var(--color-bg)' : undefined,
                  borderColor: markColor || undefined,
                }}
              >
                <span style={{ fontSize: '11px', color: 'var(--color-accent)', minWidth: '14px' }}>
                  {'ABCD'[i]}
                </span>
                {optName}
              </button>
            );
          })}
        </div>
      </main>

      {/* Pre-round countdown curtain: category, "Ready?" / "Go", rule and hint */}
      {isCountdown && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 60,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'center',
            gap: 'clamp(14px, 2.4vw, 24px)',
            padding: 'clamp(24px, 6vw, 72px)',
            background: 'var(--color-bg)',
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
            {categoryName}
          </div>

          <div
            ref={countRef}
            style={{
              maxWidth: '100%',
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              fontSize: 'clamp(56px, 15vw, 170px)',
              lineHeight: 0.82,
              letterSpacing: '-0.03em',
              textTransform: 'uppercase',
              color: countStep > 1 ? 'var(--color-text)' : 'var(--color-accent)',
            }}
          >
            {countStep > 1 ? 'Ready?' : 'Go'}
          </div>

          <div
            style={{
              width: 'min(420px, 70%)',
              height: '2px',
              background: 'var(--color-text)',
              transformOrigin: '0 50%',
              animation: 'lq-count-rule 0.6s cubic-bezier(.2,.9,.2,1) both',
            }}
          />

          <div
            style={{
              fontSize: '11px',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              maxWidth: '30ch',
              lineHeight: 1.5,
              textWrap: 'pretty',
              color: 'color-mix(in srgb, var(--color-text) 60%, transparent)',
            }}
          >
            Get ready — three lives, faster answers score more
          </div>
        </div>
      )}

      {/* Quit Confirmation Modal */}
      {quitOpen && (
        <div className="dialog-backdrop" style={{ zIndex: 50 }} onClick={handleCancelQuit}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-title">Quit this round?</div>
            <div className="dialog-body">
              The round keeps running in the background — your current score will be lost if you leave.
            </div>
            <div className="dialog-actions">
              <button className="btn btn-secondary" onClick={handleCancelQuit} style={{ minHeight: '44px' }}>
                Keep playing
              </button>
              <button className="btn btn-primary" onClick={handleConfirmQuit} style={{ minHeight: '44px' }}>
                Quit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Creator footer credit */}
      <FooterCredit />
    </div>
  );
};

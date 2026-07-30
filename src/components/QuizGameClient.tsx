'use client';

/**
 * Quiz Game Client Component
 * 
 * Manages the real-time gameplay loop: timer unblurring animation, points calculation,
 * 3 lives tracking with shake/heart loss animations, option feedback states, audio SFX,
 * and navigation to the Game Over screen.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { buildQuizRound, QuestionItem, getCategoryById, getLogoUrl, handleImageFallback } from '@/lib/gameData';
import { getMuted, setMuted, setHighScore, getHighScore, setLastGameSummary } from '@/lib/storage';
import { soundFx } from '@/lib/soundEffects';
import { FooterCredit } from '@/components/FooterCredit';

export interface QuizGameClientProps {
  categoryId?: string;
  revealSeconds?: number;
  graceSeconds?: number;
  maxBlur?: number;
}

export const QuizGameClient: React.FC<QuizGameClientProps> = ({
  categoryId,
  revealSeconds = 8,
  graceSeconds = 4,
  maxBlur = 18,
}) => {
  const router = useRouter();
  const category = getCategoryById(categoryId || null);
  const categoryName = category ? category.name : 'Mixed';

  // Game state variables
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [qIndex, setQIndex] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [lives, setLives] = useState<number>(3);
  const [phase, setPhase] = useState<'play' | 'feedback'>('play');
  const [pickedOption, setPickedOption] = useState<string | null>(null);
  const [blur, setBlur] = useState<number>(maxBlur);
  const [points, setPoints] = useState<number>(100);
  const [timePct, setTimePct] = useState<number>(100);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [quitOpen, setQuitOpen] = useState<boolean>(false);
  const [justLostHeartIndex, setJustLostHeartIndex] = useState<number | null>(null);
  const [lostFade, setLostFade] = useState<boolean>(false);
  const [correctCount, setCorrectCount] = useState<number>(0);

  // Timing references
  const t0Ref = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(-1);
  const fbTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fadeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const revealMs = revealSeconds * 1000;
  const graceMs = graceSeconds * 1000;
  const totalMs = revealMs + graceMs;

  useEffect(() => {
    setIsMuted(getMuted());
    const round = buildQuizRound(categoryId || null, 10);
    setQuestions(round);
  }, [categoryId]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (fbTimerRef.current) clearTimeout(fbTimerRef.current);
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, []);

  const finishGame = useCallback(
    (reason: 'lives' | 'complete') => {
      const high = Math.max(getHighScore(), score);
      setHighScore(high);

      setLastGameSummary({
        score,
        correct: correctCount,
        total: questions.length,
        cat: categoryId || '',
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
    [score, correctCount, questions.length, categoryId, categoryName, isMuted, router]
  );

  const handleAnswer = useCallback(
    (name: string | null) => {
      if (phase !== 'play') return;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);

      const currentQ = questions[qIndex];
      if (!currentQ) return;

      const isCorrect = name === currentQ.name;
      if (isCorrect) {
        soundFx.correct(isMuted);
      } else {
        soundFx.wrong(isMuted);
      }

      const nextLives = lives - (isCorrect ? 0 : 1);
      const nextCorrect = correctCount + (isCorrect ? 1 : 0);

      if (!isCorrect) {
        setJustLostHeartIndex(lives - 1);
        setLostFade(false);
        if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
        fadeTimerRef.current = setTimeout(() => {
          setLostFade(true);
        }, 750);
      }

      setPhase('feedback');
      setPickedOption(name);
      setBlur(0);
      setTimePct(0);
      if (isCorrect) {
        setScore((prev) => prev + points);
        setCorrectCount(nextCorrect);
      }
      setLives(nextLives);

      fbTimerRef.current = setTimeout(() => {
        if (nextLives <= 0) {
          finishGame('lives');
          return;
        }
        if (qIndex + 1 >= questions.length) {
          finishGame('complete');
          return;
        }
        setJustLostHeartIndex(null);
        setQIndex((prev) => prev + 1);
        setPhase('play');
        setPickedOption(null);
      }, 1500);
    },
    [phase, questions, qIndex, isMuted, lives, correctCount, points, finishGame]
  );

  const startQuestion = useCallback(() => {
    t0Ref.current = performance.now();
    lastTickRef.current = -1;
    setPhase('play');
    setPickedOption(null);
    setBlur(maxBlur);
    setPoints(100);
    setTimePct(100);

    const tickLoop = (now: number) => {
      const elapsed = now - t0Ref.current;
      const f = Math.min(1, elapsed / revealMs);
      const currentBlur = maxBlur * (1 - f);
      const currentPoints = Math.max(20, Math.round(100 - 80 * f));
      const currentTimePct = Math.max(0, 100 * (1 - elapsed / totalMs));
      const remainSec = Math.ceil((totalMs - elapsed) / 1000);

      if (remainSec <= 3 && remainSec >= 1 && remainSec !== lastTickRef.current) {
        lastTickRef.current = remainSec;
        soundFx.tick(isMuted);
      }

      if (elapsed >= totalMs) {
        handleAnswer(null);
        return;
      }

      setBlur(currentBlur);
      setPoints(currentPoints);
      setTimePct(currentTimePct);
      rafRef.current = requestAnimationFrame(tickLoop);
    };

    rafRef.current = requestAnimationFrame(tickLoop);
  }, [maxBlur, revealMs, totalMs, isMuted, handleAnswer]);

  useEffect(() => {
    if (questions.length > 0 && phase === 'play' && pickedOption === null) {
      startQuestion();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions, qIndex]);

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
  const isCorrectPick = isFeedback && pickedOption === currentQ?.name;

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
        <button
          onClick={handleAskQuit}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            minHeight: '44px',
            padding: '0 6px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--color-text)',
            fontFamily: 'var(--font-heading)',
            fontWeight: 800,
            fontSize: '13px',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            transition: 'color 0.15s ease',
          }}
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
            onClick={handleToggleMute}
            aria-label="Toggle sound"
            style={{
              display: 'grid',
              placeItems: 'center',
              width: '44px',
              height: '44px',
              padding: 0,
              background: 'transparent',
              border: '2px solid var(--color-divider)',
              cursor: 'pointer',
              color: 'var(--color-text)',
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              fontSize: '10px',
              letterSpacing: '0.06em',
              transition: 'background 0.15s ease, border-color 0.15s ease',
            }}
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
              animation: isFeedback && !isCorrectPick ? 'lq-shake 0.5s ease' : 'none',
            }}
            aria-label="Lives"
          >
            {[0, 1, 2].map((i) => {
              const alive = i < lives;
              const justLost = isFeedback && !isCorrectPick && i === lives;
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
              background: isFeedback
                ? isCorrectPick
                  ? 'oklch(0.62 0.19 150)'
                  : 'var(--color-accent)'
                : 'var(--color-accent-100)',
              color: isFeedback ? 'var(--color-bg)' : 'var(--color-accent-800)',
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              fontSize: '16px',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}
          >
            {isFeedback ? (
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
                  {isCorrectPick ? (
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
                {isCorrectPick ? `+${points}` : currentQ?.name}
              </span>
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
              isFeedback
                ? isCorrectPick
                  ? 'oklch(0.62 0.19 150)'
                  : 'var(--color-accent)'
                : 'var(--color-divider)'
            }`,
            boxShadow: isFeedback
              ? isCorrectPick
                ? '0 0 0 4px color-mix(in srgb, oklch(0.62 0.19 150) 35%, transparent), 0 0 28px color-mix(in srgb, oklch(0.62 0.19 150) 60%, transparent)'
                : '0 0 0 4px color-mix(in srgb, var(--color-accent) 35%, transparent), 0 0 28px color-mix(in srgb, var(--color-accent) 60%, transparent)'
              : 'none',
            transition: 'border-color 0.2s, box-shadow 0.2s',
            overflow: 'hidden',
          }}
        >
          {currentQ?.slug && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={currentQ.slug}
              src={getLogoUrl(currentQ.slug)}
              alt="Mystery logo"
              onError={handleImageFallback}
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
            const isOptionCorrect = isFeedback && optName === currentQ.name;
            const isOptionWrongPick = isFeedback && pickedOption === optName && optName !== currentQ.name;
            const markColor = isOptionCorrect
              ? pickedOption === currentQ.name
                ? greenColor
                : 'var(--color-neutral-900)'
              : isOptionWrongPick
              ? 'var(--color-accent)'
              : null;

            return (
              <button
                key={optName}
                onClick={() => handleAnswer(optName)}
                disabled={isFeedback}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  gap: '12px',
                  minHeight: '56px',
                  padding: '12px 18px',
                  cursor: isFeedback ? 'default' : 'pointer',
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 800,
                  fontSize: '16px',
                  letterSpacing: '0.02em',
                  textAlign: 'left',
                  textTransform: 'uppercase',
                  background: markColor || 'transparent',
                  color: markColor ? 'var(--color-bg)' : 'var(--color-text)',
                  border: `2px solid ${markColor || 'var(--color-divider)'}`,
                  transition: 'background 0.12s ease, border-color 0.12s ease, transform 0.1s ease',
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

/**
 * POST /api/guess
 *
 * Checks one answer. The browser sends the question's position in the round and
 * the option the player picked; the server looks up what that position actually
 * was, decides, and returns the verdict. The correct answer is only ever revealed
 * after a guess has been committed.
 *
 * Request:  { index: number, answer: string | null, elapsedMs: number }
 * Response: { correct: boolean, correctAnswer: string, points: number }
 */

import { NextResponse } from 'next/server';

import { getLogoAnswer } from '@/db/queries';
import { readRoundSession, logoIdAt } from '@/lib/roundSession';
import { pointsForElapsed } from '@/lib/scoring';

/** Loose comparison so casing, spacing and punctuation do not fail a right answer. */
function normalise(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export async function POST(request: Request) {
  const session = await readRoundSession();
  if (!session) {
    return NextResponse.json({ error: 'No active round' }, { status: 409 });
  }

  let body: { index?: number; answer?: string | null; elapsedMs?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Malformed request' }, { status: 400 });
  }

  const logoId = logoIdAt(session, Number(body.index));
  if (logoId === null) {
    return NextResponse.json({ error: 'Question out of range' }, { status: 400 });
  }

  const logo = await getLogoAnswer(logoId);
  if (!logo) {
    return NextResponse.json({ error: 'Question no longer exists' }, { status: 410 });
  }

  // A null answer means the clock ran out — always wrong, always zero.
  const guess = typeof body.answer === 'string' ? body.answer : null;
  const accepted = [logo.name, ...logo.acceptedAnswers].map(normalise);
  const correct = guess !== null && accepted.includes(normalise(guess));

  return NextResponse.json(
    {
      correct,
      correctAnswer: logo.name,
      points: correct ? pointsForElapsed(Number(body.elapsedMs)) : 0,
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

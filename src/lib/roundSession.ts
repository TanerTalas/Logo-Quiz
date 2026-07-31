/**
 * Round Session
 *
 * Holds the secret half of an in-progress round. When a round starts the server
 * picks the logos and stores their IDs in an httpOnly cookie; the browser receives
 * only the multiple-choice options. Nothing the client holds says which option is
 * right, and the image is fetched by position rather than by brand.
 *
 * The cookie is signed with ROUND_SECRET so a hand-edited value is rejected rather
 * than trusted. It is not encrypted — there is no need, because the payload is just
 * row IDs, which mean nothing without database access.
 */

import 'server-only';

import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

export const ROUND_COOKIE = 'lq_round';

/** Rounds are abandoned rather than resumed, so the cookie is short-lived. */
const MAX_AGE_SECONDS = 60 * 30;

export interface RoundSession {
  /** Category slug the round was started for, or null for a mixed round. */
  category: string | null;
  /** Database IDs of the logos being asked, in question order. */
  logoIds: number[];
  /** Issue time in epoch milliseconds. */
  issuedAt: number;
  /**
   * Random per-round tag, handed to the browser and echoed back on image requests.
   *
   * "/api/logo-image/3" means a different brand in every round, so without this the
   * response could never be cached and the mystery box would blank out between
   * questions. Tagging the URL makes it unique to one round, which lets the browser
   * cache it and lets the game preload the next question — while a URL left over
   * from an earlier round is rejected rather than answered with the wrong logo.
   */
  nonce: string;
}

/** Creates the per-round tag used to scope image URLs. */
export function createRoundNonce(): string {
  return randomBytes(9).toString('base64url');
}

// ---------------------------------------------------------------------------
// Signing
// ---------------------------------------------------------------------------

function getSecret(): string {
  const secret = process.env.ROUND_SECRET;
  if (!secret) {
    throw new Error('ROUND_SECRET is not set. Add it to .env.local (see .env.example).');
  }
  return secret;
}

function sign(payload: string): string {
  return createHmac('sha256', getSecret()).update(payload).digest('base64url');
}

/** Constant-time signature comparison, so a wrong guess leaks no timing hints. */
function signatureMatches(payload: string, signature: string): boolean {
  const expected = Buffer.from(sign(payload));
  const received = Buffer.from(signature);
  if (expected.length !== received.length) return false;
  return timingSafeEqual(expected, received);
}

// ---------------------------------------------------------------------------
// Cookie read / write
// ---------------------------------------------------------------------------

/** Serialises the round and stores it as a signed, httpOnly cookie. */
export async function saveRoundSession(session: RoundSession): Promise<void> {
  const payload = Buffer.from(JSON.stringify(session)).toString('base64url');
  const cookieStore = await cookies();

  cookieStore.set(ROUND_COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  });
}

/**
 * Reads the current round, or null when there is none, the signature does not
 * match, or it has expired.
 */
export async function readRoundSession(): Promise<RoundSession | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(ROUND_COOKIE)?.value;
  if (!raw) return null;

  const separator = raw.lastIndexOf('.');
  if (separator === -1) return null;

  const payload = raw.slice(0, separator);
  const signature = raw.slice(separator + 1);
  if (!signatureMatches(payload, signature)) return null;

  try {
    const session = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf8')
    ) as RoundSession;

    if (!Array.isArray(session.logoIds) || session.logoIds.length === 0) return null;
    if (Date.now() - session.issuedAt > MAX_AGE_SECONDS * 1000) return null;

    return session;
  } catch {
    return null;
  }
}

/** Resolves the logo ID for a question position, or null if out of range. */
export function logoIdAt(session: RoundSession, index: number): number | null {
  if (!Number.isInteger(index) || index < 0 || index >= session.logoIds.length) {
    return null;
  }
  return session.logoIds[index];
}

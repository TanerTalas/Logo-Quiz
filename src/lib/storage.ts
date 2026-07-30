/**
 * Storage Utility Service
 * 
 * Provides safe client-side persistence wrappers for high scores, sound preferences,
 * and game state data with SSR guard checks.
 */

export interface GameSummary {
  score: number;
  correct: number;
  total: number;
  cat?: string;
  catName?: string;
  reason: 'lives' | 'complete';
}

const KEYS = {
  HIGH_SCORE: 'lq_high_score',
  MUTED: 'lq_muted',
  LAST_ROUND: 'lq_last_round',
  INTRO_SEEN: 'lq_intro_seen',
};

/**
 * Retrieves the stored high score or returns 0 if uninitialized.
 */
export function getHighScore(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const val = localStorage.getItem(KEYS.HIGH_SCORE);
    return val ? parseInt(val, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

/**
 * Updates the stored high score if the new score exceeds the current best.
 */
export function setHighScore(score: number): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getHighScore();
    if (score > current) {
      localStorage.setItem(KEYS.HIGH_SCORE, String(score));
    }
  } catch {
    // Ignore storage write failures
  }
}

/**
 * Retrieves the current sound muted preference (defaults to false/unmuted).
 */
export function getMuted(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(KEYS.MUTED) === '1';
  } catch {
    return false;
  }
}

/**
 * Persists the user sound muted preference.
 */
export function setMuted(muted: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEYS.MUTED, muted ? '1' : '0');
  } catch {
    // Ignore storage write failures
  }
}

/**
 * Saves the completed game round details to session storage.
 */
export function setLastGameSummary(summary: GameSummary): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(KEYS.LAST_ROUND, JSON.stringify(summary));
  } catch {
    // Ignore storage write failures
  }
}

/**
 * Retrieves the last completed game round summary details.
 */
export function getLastGameSummary(): GameSummary | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(KEYS.LAST_ROUND);
    return raw ? (JSON.parse(raw) as GameSummary) : null;
  } catch {
    return null;
  }
}

/**
 * Checks whether the intro overlay has already been displayed during the session.
 */
export function getIntroSeen(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem(KEYS.INTRO_SEEN) === '1';
  } catch {
    return false;
  }
}

/**
 * Marks the intro overlay as seen for the active session.
 */
export function setIntroSeen(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(KEYS.INTRO_SEEN, '1');
  } catch {
    // Ignore storage write failures
  }
}

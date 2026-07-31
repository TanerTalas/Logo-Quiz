/**
 * Scoring Rules
 *
 * Shared by the game screen (which counts the points badge down as the logo
 * unblurs) and by /api/guess (which decides what a correct answer is actually
 * worth). Keeping the numbers in one place stops the two from drifting apart.
 *
 * There are no secrets here, so this module is safe on both sides of the wire.
 */

/** How long the logo takes to come fully into focus. */
export const REVEAL_MS = 8_000;

/** Extra time to answer after the logo is clear, scoring the minimum. */
export const GRACE_MS = 4_000;

/** Total time allowed per question. */
export const TOTAL_MS = REVEAL_MS + GRACE_MS;

/** Lives a player starts with. A round ends when these run out. */
export const STARTING_LIVES = 3;

const MAX_POINTS = 100;
const MIN_POINTS = 20;

/**
 * Points a correct answer earns, given how long the player took.
 *
 * Full marks for an instant answer, decaying to the floor by the time the logo is
 * fully revealed. Out-of-range values are clamped rather than rejected.
 *
 * KNOWN LIMIT: the elapsed time is measured in the browser, so a crafted request
 * claiming zero elapsed time always scores the maximum. Which option is correct is
 * still decided here on the server — only the speed bonus is takeable. That is an
 * accepted trade today because scores live in the player's own localStorage and
 * there is nobody to cheat but themselves. Adding a shared leaderboard would make
 * this exploitable for real, and the round would then need the server to timestamp
 * each question as it is served rather than trusting the client's stopwatch.
 */
export function pointsForElapsed(elapsedMs: number): number {
  const clamped = Math.min(Math.max(elapsedMs || 0, 0), TOTAL_MS);
  const progress = Math.min(1, clamped / REVEAL_MS);
  return Math.max(MIN_POINTS, Math.round(MAX_POINTS - (MAX_POINTS - MIN_POINTS) * progress));
}

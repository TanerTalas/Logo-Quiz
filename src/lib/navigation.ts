/**
 * Client Navigation Tracking
 *
 * Tells apart a real browser document load (first visit, refresh, pasted URL, or a
 * back/forward step that had to recreate the document) from an in-app route change.
 * App Router navigations keep the same document alive, so the module level state below
 * survives them and is wiped automatically whenever the browser loads the page again.
 *
 * Two features rely on this:
 *  - the game and game over screens are session-only, so a reload sends the player home
 *  - the intro curtain plays on entry and on refresh, but never on back/forward
 */

export type DocumentNavigationType = 'navigate' | 'reload' | 'back_forward' | 'prerender';

// Last pathname handed to recordPathname, plus how many client side route changes
// happened since this document was loaded. Both reset on every full page load.
let lastPathname: string | null = null;
let clientNavigationCount = 0;

/**
 * Records the pathname currently being rendered.
 *
 * Called during render by NavigationTracker, which sits above every page in the root
 * layout, so the counter is always up to date before any page effect runs. Repeated
 * calls with the same pathname are ignored, which keeps React StrictMode double renders
 * from inflating the count.
 */
export function recordPathname(pathname: string): void {
  // Server rendering shares module state across requests, so only track in the browser.
  if (typeof window === 'undefined') return;

  if (lastPathname === null) {
    lastPathname = pathname;
    return;
  }

  if (lastPathname !== pathname) {
    lastPathname = pathname;
    clientNavigationCount += 1;
  }
}

/**
 * True while the page on screen is the one the browser loaded this document with, i.e.
 * the user arrived by refreshing, opening the URL directly or stepping back into a fresh
 * document, rather than by navigating inside the app.
 */
export function isDocumentEntry(): boolean {
  return clientNavigationCount === 0;
}

/**
 * How the browser created the current document: a normal navigation, a reload, or a
 * back/forward step. Falls back to 'navigate' when the timing entry is unavailable.
 */
export function getDocumentNavigationType(): DocumentNavigationType {
  if (typeof window === 'undefined' || typeof performance === 'undefined') return 'navigate';

  try {
    const [entry] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    return entry ? (entry.type as DocumentNavigationType) : 'navigate';
  } catch {
    return 'navigate';
  }
}

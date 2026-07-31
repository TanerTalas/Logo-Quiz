/**
 * Decorative Logo Images
 *
 * Helpers for the brand tiles on the intro curtain and the home page globe. Those
 * are set dressing, not quiz questions, so they link straight to the CDN with the
 * brand slug visible — nothing is being hidden there.
 *
 * Anything inside a round goes through /api/logo-image instead, which addresses a
 * logo by its position in the round so the slug never reaches the browser.
 */

/** Resolves the logo CDN URL for a given brand slug. */
export function getLogoUrl(slug: string): string {
  return `https://cdn.simpleicons.org/${slug}`;
}

/** Fades a tile out rather than showing a broken image icon. */
export function handleImageFallback(event: React.SyntheticEvent<HTMLImageElement, Event>) {
  event.currentTarget.style.opacity = '0.4';
}

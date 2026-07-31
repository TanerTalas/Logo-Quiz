/**
 * Logo Contrast
 *
 * Decides which brand logos are too light to be shown on the white tiles the game and
 * the catalog use. Sony and Unity are literally `#FFFFFF`, so on white they were not
 * dim — they were invisible, which during a round means an unanswerable question.
 *
 * The brand colour itself is never changed: it is part of the puzzle (see the note in
 * `db/seed.ts`), and recolouring Snapchat's yellow would take a real clue away. Instead
 * the affected logos are given a dark plate to sit on, which is also how these brands
 * publish their own assets.
 *
 * Imported by both the app and the seed script, so it stays free of server-only code.
 */

/** The plate colour, kept in step with `--color-text` in globals.css. */
export const LOGO_PLATE_COLOR = '#201e1d';

/** The tile colour every logo is measured against: `--color-surface`, plain white. */
const TILE_COLOR = '#ffffff';

/**
 * Below this WCAG contrast ratio against the tile, a logo gets a plate.
 *
 * 1.5 is well under the 3:1 the guidelines want for graphics, and deliberately so: a
 * logo is recognised by its shape, not read like text, so a merely low contrast mark
 * such as McDonald's yellow (1.57) still reads fine and keeps its white tile. This
 * catches the ones that genuinely disappear — the whites, the pale yellows and the
 * neon greens, thirteen brands out of the catalog's 365.
 */
const PLATE_THRESHOLD = 1.5;

/** Accepts `#RRGGBB` or the bare `RRGGBB` that simple-icons ships. */
function relativeLuminance(hex: string): number {
  const value = hex.replace('#', '');
  const channels = [0, 2, 4].map((offset) => {
    const srgb = parseInt(value.slice(offset, offset + 2), 16) / 255;
    return srgb <= 0.03928 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

/** WCAG contrast ratio between two colours, from 1 (identical) to 21 (black on white). */
export function contrastRatio(hexA: string, hexB: string): number {
  const [lighter, darker] = [relativeLuminance(hexA), relativeLuminance(hexB)].sort(
    (a, b) => b - a
  );

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * True when a logo in this colour would wash out on a white tile and should be given a
 * dark plate instead. Anything unparseable is treated as safe — a missing plate is a far
 * smaller problem than a plate under a black logo.
 */
export function needsDarkPlate(hex: string | null | undefined): boolean {
  if (!hex || !/^#?[0-9a-f]{6}$/i.test(hex)) return false;

  return contrastRatio(hex, TILE_COLOR) < PLATE_THRESHOLD;
}

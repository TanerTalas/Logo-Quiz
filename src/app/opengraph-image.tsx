/**
 * Open Graph Card
 *
 * The image social platforms show when the site is linked.
 *
 * Without one, every platform guesses differently: WhatsApp fell back to the site
 * icon and got it right, while Instagram scanned the page for images and picked the
 * first `<img>` in the markup — the intro curtain's opening tile, which is Spotify.
 * So the link previewed as a Spotify logo.
 *
 * Drawn rather than stored as a file so it stays in step with the design tokens, and
 * built only from local assets: the fonts are committed under `assets/`, and there are
 * deliberately no brand logos on it, since fetching those from the SimpleIcons CDN is
 * the exact call that fails from a datacenter IP (see the notes in the image route).
 */

import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const alt = 'Logo Quiz — a blurred brand logo sharpens in seconds. Guess it early.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Design tokens, spelled out because the card is rendered outside the stylesheet.
const INK = '#201e1d';
const PAPER = '#f3f2f2';
const ACCENT = '#ec3013';

export default async function OpenGraphImage() {
  const [bold, regular] = await Promise.all([
    readFile(join(process.cwd(), 'assets/Archivo-ExtraBold.ttf')),
    readFile(join(process.cwd(), 'assets/Archivo-Regular.ttf')),
  ]);

  return new ImageResponse(
    (
      <div style={{ display: 'flex', width: '100%', height: '100%', background: PAPER }}>
        {/* Left: the wordmark, laid out like the intro curtain */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            flex: 1,
            padding: '0 72px',
          }}
        >
          <div
            style={{
              display: 'flex',
              fontSize: 19,
              fontWeight: 800,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: ACCENT,
            }}
          >
            The faster you guess, the more you score
          </div>

          {/* The words are spaced with a margin rather than `gap`: satori drops the gap
              on this row, which ran "LOGO" and "QUIZ" together. */}
          <div
            style={{
              display: 'flex',
              marginTop: 28,
              fontSize: 118,
              fontWeight: 800,
              lineHeight: 0.92,
              letterSpacing: '-0.02em',
              textTransform: 'uppercase',
            }}
          >
            <div style={{ display: 'flex', color: INK, marginRight: 30 }}>Logo</div>
            <div style={{ display: 'flex', color: ACCENT }}>Quiz</div>
          </div>

          {/* The 2px rule the whole design language is built on */}
          <div style={{ display: 'flex', width: 460, height: 2, background: INK, marginTop: 36 }} />

          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              marginTop: 24,
              fontSize: 18,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#6b6867',
            }}
          >
            Designed &amp; coded by
            <div style={{ display: 'flex', fontWeight: 800, fontSize: 20, color: INK, marginLeft: 10 }}>
              Taner Talas
            </div>
          </div>
        </div>

        {/* Right: the accent panel from the home page hero, standing in for the
            mystery logo the player is squinting at */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 340,
            height: '100%',
            background: ACCENT,
            borderLeft: `2px solid ${INK}`,
          }}
        >
          <div style={{ display: 'flex', fontSize: 300, fontWeight: 800, color: PAPER }}>?</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Archivo', data: bold, weight: 800, style: 'normal' },
        { name: 'Archivo', data: regular, weight: 400, style: 'normal' },
      ],
    }
  );
}

/**
 * GET /api/logo-image/[index]
 *
 * Serves the mystery logo for one question of the current round.
 *
 * The game cannot link straight to the CDN, because that URL ends in the brand
 * slug — "cdn.simpleicons.org/spotify" gives the answer away to anyone with the
 * network tab open. So the image is addressed by its position in the round, and
 * the server resolves that position through the round cookie before proxying the
 * bytes back.
 *
 * Hiding the URL is only half of it: a SimpleIcons SVG carries the brand name in a
 * <title> element, so the file spells out the answer to anyone who opens it. The
 * markup is stripped of anything naming the brand before it is served.
 */

import { NextResponse } from 'next/server';

import { getLogoAnswer } from '@/db/queries';
import { readRoundSession, logoIdAt } from '@/lib/roundSession';

// The proxied bytes are the same for a given brand, so let the server-side fetch
// cache hold them for a day. Only this hop is cached — see the response headers.
const UPSTREAM_REVALIDATE_SECONDS = 60 * 60 * 24;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ index: string }> }
) {
  const session = await readRoundSession();
  if (!session) {
    return NextResponse.json({ error: 'No active round' }, { status: 409 });
  }

  // The ?r= tag scopes the URL to one round. Refusing a stale tag is what makes it
  // safe to let the browser cache the response.
  const requestedNonce = new URL(request.url).searchParams.get('r');
  if (requestedNonce !== session.nonce) {
    return NextResponse.json({ error: 'Stale round' }, { status: 409 });
  }

  const { index } = await params;
  const logoId = logoIdAt(session, Number.parseInt(index, 10));
  if (logoId === null) {
    return NextResponse.json({ error: 'Question out of range' }, { status: 400 });
  }

  const logo = await getLogoAnswer(logoId);
  if (!logo) {
    return NextResponse.json({ error: 'Question no longer exists' }, { status: 410 });
  }

  const upstream = await fetch(logo.imageUrl, {
    next: { revalidate: UPSTREAM_REVALIDATE_SECONDS },
  });

  if (!upstream.ok) {
    return NextResponse.json({ error: 'Logo image unavailable' }, { status: 502 });
  }

  const contentType = upstream.headers.get('content-type') ?? 'image/svg+xml';
  const body = contentType.includes('svg')
    ? stripBrandNames(await upstream.text())
    : await upstream.arrayBuffer();

  return new NextResponse(body, {
    headers: {
      'Content-Type': contentType,
      // Private, because the URL resolves to a brand only for this player's round.
      // Cacheable, because the ?r= tag makes it unique to that round — which is what
      // lets the game preload the next question instead of blanking between them.
      'Cache-Control': 'private, max-age=1800, immutable',
    },
  });
}

/**
 * Removes the text that names the brand from an SVG.
 *
 * SimpleIcons ships every icon with `<title>Spotify</title>` for screen readers,
 * and some carry aria-label or desc as well. Left in, they hand the answer to
 * anyone who previews the request — so they come out for the duration of a round.
 * The paths, which are the only part the player is meant to see, are untouched.
 */
function stripBrandNames(svg: string): string {
  return svg
    .replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, '')
    .replace(/<desc\b[^>]*>[\s\S]*?<\/desc>/gi, '')
    .replace(/\saria-label="[^"]*"/gi, '');
}

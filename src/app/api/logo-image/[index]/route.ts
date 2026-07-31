/**
 * GET /api/logo-image/[index]
 *
 * Serves the mystery logo for one question of the current round.
 *
 * The game cannot link straight to the CDN, because that URL ends in the brand
 * slug — "cdn.simpleicons.org/spotify" gives the answer away to anyone with the
 * network tab open. So the image is addressed by its position in the round, and
 * the server resolves that position through the round cookie.
 *
 * The markup comes from the database, written at seed time with the brand name
 * already stripped out. An earlier version proxied the CDN on every request, which
 * put an external service in the game's hot path: the CDN sits behind Cloudflare,
 * which rejects datacenter IPs, so it worked locally and returned 502 from Vercel.
 */

import { NextResponse } from 'next/server';

import { getLogoSvg } from '@/db/queries';
import { readRoundSession, logoIdAt } from '@/lib/roundSession';

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

  const svg = await getLogoSvg(logoId);
  if (!svg) {
    return NextResponse.json({ error: 'Question no longer exists' }, { status: 410 });
  }

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      // Private, because the URL resolves to a brand only for this player's round.
      // Cacheable, because the ?r= tag makes it unique to that round — which is what
      // lets the game preload the next question instead of blanking between them.
      'Cache-Control': 'private, max-age=1800, immutable',
    },
  });
}

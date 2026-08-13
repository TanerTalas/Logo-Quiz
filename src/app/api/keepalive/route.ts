/**
 * GET /api/keepalive
 *
 * Keeps the Supabase project awake. The free tier pauses a project after seven days
 * without activity, and a paused database takes the whole game down until someone
 * restores it by hand from the dashboard.
 *
 * Vercel Cron calls this once a day (see `crons` in vercel.json). It has to be its
 * own route rather than a ping at an existing page: /categories and /logos are ISR
 * with a one hour revalidate, so a request to them is usually served from the cache
 * and never reaches Postgres. This one runs a real query on every call.
 *
 * Requests are rejected unless they carry CRON_SECRET, which Vercel attaches to its
 * own cron invocations automatically. With the variable unset the route stays open —
 * the query is a single harmless read, so an unprotected keepalive still beats a
 * keepalive that silently 401s because the secret was never added in the dashboard.
 */

import { NextResponse } from 'next/server';

import { pingDatabase } from '@/db/queries';

// The result must never be cached; a cached 200 would keep reporting success while
// the database quietly went to sleep behind it.
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (secret && request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const reachable = await pingDatabase();

    return NextResponse.json(
      { ok: reachable, checkedAt: new Date().toISOString() },
      { status: reachable ? 200 : 503, headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    // Answer with a failing status so the cron run shows up as failed in Vercel's
    // log instead of looking healthy while the database is unreachable.
    console.error('[keepalive] database ping failed', error);

    return NextResponse.json(
      { ok: false, error: 'Database unreachable' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}

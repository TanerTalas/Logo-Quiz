/**
 * POST /api/round
 *
 * Starts a round. The server picks the logos, builds the multiple-choice options,
 * and stores the chosen logo IDs in a signed httpOnly cookie. The response carries
 * only the options — which one is correct stays on the server.
 *
 * A category round covers every logo it contains, so its length varies: 14 questions
 * for Sports & Fitness, 61 for Tech & Apps. A mixed round draws from all 365 and is
 * capped. Three lives is what actually ends either of them.
 *
 * Request:  { category?: string | null }
 * Response: { categoryName: string, questions: [{ options: string[] }] }
 */

import { NextResponse } from 'next/server';

import { buildRound, getCategoryBySlug } from '@/db/queries';
import { saveRoundSession, createRoundNonce } from '@/lib/roundSession';
import { MIXED_ROUND_QUESTIONS } from '@/lib/scoring';

export async function POST(request: Request) {
  let category: string | null = null;

  // An empty body is a valid mixed round, so parse failures are not fatal.
  try {
    const body = (await request.json()) as { category?: string | null };
    category = typeof body.category === 'string' && body.category ? body.category : null;
  } catch {
    category = null;
  }

  // A category round has no limit — it runs the whole category. Mixed is capped.
  const round = await buildRound(category, category ? undefined : MIXED_ROUND_QUESTIONS);

  if (!round) {
    return NextResponse.json({ error: 'Unknown category' }, { status: 404 });
  }

  // Remember the answers server-side for /api/guess and /api/logo-image.
  const nonce = createRoundNonce();
  await saveRoundSession({
    category,
    logoIds: round.logoIds,
    issuedAt: Date.now(),
    nonce,
  });

  const categoryRow = category ? await getCategoryBySlug(category) : undefined;

  return NextResponse.json(
    {
      categoryName: categoryRow?.name ?? 'Mixed',
      // Scopes image URLs to this round; carries no information about the answers.
      roundId: nonce,
      questions: round.questions,
    },
    // A round is unique to one player and one moment; never let it be cached.
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

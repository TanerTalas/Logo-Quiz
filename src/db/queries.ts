/**
 * Query Layer
 *
 * The only place the app reads from Postgres. Every function here returns a shape
 * that is safe to render or ship to the browser — raw table rows never leave this
 * module, because `logos.slug` and `logos.name` are quiz answers.
 *
 * The catalog pages (/logos, /categories) are an exception by design: they exist to
 * show players every brand in the game, so names and images are public there. What
 * must stay secret is which logo is being asked *during a round* — that path goes
 * through the round helpers, not these.
 */

import 'server-only';

import { asc, eq } from 'drizzle-orm';

import { db } from './index';
import { categories, logos } from './schema';

// ---------------------------------------------------------------------------
// Types returned to pages
// ---------------------------------------------------------------------------

export interface CatalogLogo {
  name: string;
  imageUrl: string;
  difficulty: number;
}

export interface CatalogCategory {
  slug: string;
  name: string;
  logos: CatalogLogo[];
}

// ---------------------------------------------------------------------------
// Catalog reads
// ---------------------------------------------------------------------------

/**
 * Every category with the logos inside it, ordered for display.
 *
 * Fetched as a single joined query — the whole catalog is only a few hundred rows,
 * so pulling it at once beats one query per category.
 */
export async function getCatalog(): Promise<CatalogCategory[]> {
  const rows = await db
    .select({
      categorySlug: categories.slug,
      categoryName: categories.name,
      logoName: logos.name,
      logoImageUrl: logos.imageUrl,
      logoDifficulty: logos.difficulty,
    })
    .from(categories)
    .innerJoin(logos, eq(logos.categoryId, categories.id))
    .orderBy(asc(categories.sortOrder), asc(logos.name));

  // Group the flat join result back into categories, preserving row order.
  const grouped = new Map<string, CatalogCategory>();

  for (const row of rows) {
    let category = grouped.get(row.categorySlug);
    if (!category) {
      category = { slug: row.categorySlug, name: row.categoryName, logos: [] };
      grouped.set(row.categorySlug, category);
    }
    category.logos.push({
      name: row.logoName,
      imageUrl: row.logoImageUrl,
      difficulty: row.logoDifficulty,
    });
  }

  return [...grouped.values()];
}

/** Total number of logos in the game, used for the "Mixed" card. */
export function countLogos(catalog: CatalogCategory[]): number {
  return catalog.reduce((total, category) => total + category.logos.length, 0);
}

/** Looks up a single category by its URL slug. Returns undefined if unknown. */
export async function getCategoryBySlug(slug: string) {
  const [row] = await db
    .select({ id: categories.id, slug: categories.slug, name: categories.name })
    .from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);

  return row;
}

// ---------------------------------------------------------------------------
// Round building
// ---------------------------------------------------------------------------

/** What the browser is told about one question: four names, and nothing else. */
export interface RoundQuestion {
  options: string[];
}

export interface BuiltRound {
  /** Logo IDs in question order — server-side only, stored in the round cookie. */
  logoIds: number[];
  questions: RoundQuestion[];
}

/** Fisher-Yates shuffle over a copy of the input. */
function shuffle<T>(items: T[]): T[] {
  const list = [...items];
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

/**
 * Assembles a round: which logos get asked, and the four names shown under each.
 *
 * Two things shape the selection, both of which matter now the catalog spans 365
 * brands across very different categories:
 *
 *  - Questions ramp from easy to hard rather than being drawn at random, so a round
 *    does not open on three obscure brands.
 *  - Distractors come from the answer's own category. Drawn from the whole catalog
 *    they would be giveaways — "Ferrari, Spotify, HSBC, Ryanair" is not a question.
 *
 * Returns null when the category slug does not exist.
 */
export async function buildRound(
  categorySlug: string | null,
  questionCount: number = 10
): Promise<BuiltRound | null> {
  // The whole logo table is small enough to select in one go, and having every
  // category on hand is what makes same-category distractors cheap to pick.
  const allLogos = await db
    .select({
      id: logos.id,
      name: logos.name,
      categoryId: logos.categoryId,
      difficulty: logos.difficulty,
    })
    .from(logos);

  let pool = allLogos;

  if (categorySlug) {
    const category = await getCategoryBySlug(categorySlug);
    if (!category) return null;
    pool = allLogos.filter((logo) => logo.categoryId === category.id);
  }

  if (pool.length === 0) return null;

  const size = Math.min(questionCount, pool.length);

  // Aim for roughly 40% easy, 40% medium, 20% hard.
  const quota: Record<number, number> = {
    1: Math.round(size * 0.4),
    2: Math.round(size * 0.4),
    3: size - Math.round(size * 0.4) - Math.round(size * 0.4),
  };

  const picked: typeof pool = [];
  for (const difficulty of [1, 2, 3]) {
    const tier = pool.filter((logo) => logo.difficulty === difficulty);
    picked.push(...shuffle(tier).slice(0, quota[difficulty]));
  }

  // Small categories may not have enough logos at a given difficulty; top up from
  // whatever is left so the round is always full length.
  if (picked.length < size) {
    const chosen = new Set(picked.map((logo) => logo.id));
    const leftover = shuffle(pool.filter((logo) => !chosen.has(logo.id)));
    picked.push(...leftover.slice(0, size - picked.length));
  }

  picked.sort((a, b) => a.difficulty - b.difficulty);

  // Build the four options for each question.
  const questions: RoundQuestion[] = picked.map((answer) => {
    const sameCategory = allLogos.filter(
      (logo) => logo.categoryId === answer.categoryId && logo.name !== answer.name
    );
    // Fall back to the full catalog if a category is ever too small to fill three.
    const candidates = sameCategory.length >= 3 ? sameCategory : allLogos;

    const distractors: string[] = [];
    const used = new Set([answer.name]);
    for (const candidate of shuffle(candidates)) {
      if (distractors.length === 3) break;
      // Guard against two brands sharing a display name.
      if (used.has(candidate.name)) continue;
      used.add(candidate.name);
      distractors.push(candidate.name);
    }

    return { options: shuffle([answer.name, ...distractors]) };
  });

  return { logoIds: picked.map((logo) => logo.id), questions };
}

/** The answer data for one logo. Never returned to the browser as-is. */
export async function getLogoAnswer(logoId: number) {
  const [row] = await db
    .select({
      name: logos.name,
      acceptedAnswers: logos.acceptedAnswers,
      imageUrl: logos.imageUrl,
    })
    .from(logos)
    .where(eq(logos.id, logoId))
    .limit(1);

  return row;
}

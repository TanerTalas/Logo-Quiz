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

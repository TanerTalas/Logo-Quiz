/**
 * Database Seed Script
 *
 * Fills the categories and logos tables from `catalog.ts`. Run with:
 *   npm run db:seed
 *
 * The script is idempotent — it upserts on the unique `slug` columns, so running
 * it twice changes nothing and row IDs stay stable (important, because the image
 * proxy route addresses logos by ID). Brands removed from the catalog are deleted
 * from the table on the next run.
 *
 * Display names and brand colours come from the `simple-icons` package, which is a
 * devDependency: this script runs on your machine, never in production.
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { notInArray } from 'drizzle-orm';
import * as simpleIcons from 'simple-icons';

import { categories, logos } from './schema';
import { CATALOG, ACCEPTED_ALIASES, difficultyFor } from './catalog';

// ---------------------------------------------------------------------------
// SimpleIcons lookup
// ---------------------------------------------------------------------------

interface SimpleIcon {
  title: string;
  slug: string;
  hex: string;
}

// The package exports one `siBrandName` constant per icon; index them by slug.
const ICONS_BY_SLUG = new Map<string, SimpleIcon>(
  (Object.values(simpleIcons) as SimpleIcon[])
    .filter((icon) => icon && typeof icon.slug === 'string')
    .map((icon) => [icon.slug, icon])
);

/** Public CDN URL for a brand icon, rendered in the brand's own colour. */
function logoImageUrl(slug: string): string {
  return `https://cdn.simpleicons.org/${slug}`;
}

// ---------------------------------------------------------------------------
// Validation — fail before touching the database, not halfway through
// ---------------------------------------------------------------------------

function validateCatalog(): void {
  const problems: string[] = [];
  const seen = new Map<string, string>();

  for (const category of CATALOG) {
    if (category.logos.length < 10) {
      problems.push(
        `Category "${category.slug}" has only ${category.logos.length} logos; a round asks 10 questions.`
      );
    }

    for (const slug of category.logos) {
      if (!ICONS_BY_SLUG.has(slug)) {
        problems.push(`Unknown SimpleIcons slug "${slug}" in category "${category.slug}".`);
      }
      const owner = seen.get(slug);
      if (owner) {
        problems.push(`Slug "${slug}" appears in both "${owner}" and "${category.slug}".`);
      } else {
        seen.set(slug, category.slug);
      }
    }
  }

  if (problems.length > 0) {
    throw new Error(`Catalog is invalid:\n  - ${problems.join('\n  - ')}`);
  }
}

// ---------------------------------------------------------------------------
// Seeding
// ---------------------------------------------------------------------------

async function seed(): Promise<void> {
  // Catalog problems are checked first so they surface even without a database.
  validateCatalog();

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set. Create .env.local first (see .env.example).');
  }

  // A short-lived, single connection: this is a one-off script, not the app.
  const client = postgres(connectionString, { prepare: false, max: 1 });
  const db = drizzle(client);

  try {
    let logoCount = 0;
    const keptSlugs: string[] = [];

    for (const [index, category] of CATALOG.entries()) {
      // Upsert the category and get its row ID back.
      const [row] = await db
        .insert(categories)
        .values({ slug: category.slug, name: category.name, sortOrder: index })
        .onConflictDoUpdate({
          target: categories.slug,
          set: { name: category.name, sortOrder: index },
        })
        .returning({ id: categories.id });

      // Upsert every logo in the category.
      for (const slug of category.logos) {
        const icon = ICONS_BY_SLUG.get(slug)!;
        const values = {
          categoryId: row.id,
          slug,
          name: icon.title,
          imageUrl: logoImageUrl(slug),
          difficulty: difficultyFor(slug),
          acceptedAnswers: ACCEPTED_ALIASES[slug] ?? [],
        };

        await db
          .insert(logos)
          .values(values)
          .onConflictDoUpdate({ target: logos.slug, set: values });

        keptSlugs.push(slug);
        logoCount++;
      }

      console.log(`  ${category.name.padEnd(22)} ${category.logos.length} logos`);
    }

    // Drop anything that used to be in the catalog but no longer is.
    const removed = await db
      .delete(logos)
      .where(notInArray(logos.slug, keptSlugs))
      .returning({ slug: logos.slug });

    // Same for categories, matched on the slugs still present in the catalog.
    const catalogCategorySlugs = CATALOG.map((c) => c.slug);
    await db.delete(categories).where(notInArray(categories.slug, catalogCategorySlugs));

    console.log(`\nSeeded ${CATALOG.length} categories and ${logoCount} logos.`);
    if (removed.length > 0) {
      console.log(`Removed ${removed.length} stale logos: ${removed.map((r) => r.slug).join(', ')}`);
    }
  } finally {
    await client.end();
  }
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\nSeed failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  });

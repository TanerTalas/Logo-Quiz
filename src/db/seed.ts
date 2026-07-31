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
import { notInArray, sql } from 'drizzle-orm';
import * as simpleIcons from 'simple-icons';

import { categories, logos } from './schema';
import { CATALOG, ACCEPTED_ALIASES, difficultyFor } from './catalog';
import { LOGO_PLATE_COLOR, needsDarkPlate } from '../lib/logoContrast';

// ---------------------------------------------------------------------------
// SimpleIcons lookup
// ---------------------------------------------------------------------------

interface SimpleIcon {
  title: string;
  slug: string;
  hex: string;
  svg: string;
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

/**
 * Prepares the icon markup for use as a mystery logo.
 *
 * Three changes. First, the brand colour is painted on: the package ships bare paths,
 * while the CDN applies the hex — and the colour is a deliberate part of the puzzle.
 * Second, everything that names the brand comes out. SimpleIcons gives every icon a
 * `<title>` for screen readers, which would spell out the answer to anyone who
 * opened the image.
 *
 * Third, a logo too light for the game's white tile gets a dark plate behind it, filling
 * the viewBox. The plate is baked in here rather than applied by the game because the
 * browser only ever receives this file as an `<img>` source: it cannot see the colour
 * inside, and telling it separately would mean shipping a hint about the answer.
 */
function prepareMysterySvg(icon: SimpleIcon): string {
  const stripped = icon.svg
    .replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, '')
    .replace(/<desc\b[^>]*>[\s\S]*?<\/desc>/gi, '')
    .replace(/\saria-label="[^"]*"/gi, '')
    .replace('<svg', `<svg fill="#${icon.hex}"`);

  if (!needsDarkPlate(icon.hex)) return stripped;

  // Straight after the opening tag, so the plate paints under the icon's paths.
  return stripped.replace(
    /^(<svg[^>]*>)/,
    `$1<rect width="100%" height="100%" fill="${LOGO_PLATE_COLOR}"/>`
  );
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
    // Everything below runs as a handful of bulk statements rather than one query
    // per row: with a database on another continent each round trip costs real
    // time, and 375 sequential upserts would take minutes.

    // 1. Upsert all categories in a single statement, keeping their IDs stable.
    const categoryRows = await db
      .insert(categories)
      .values(
        CATALOG.map((category, index) => ({
          slug: category.slug,
          name: category.name,
          sortOrder: index,
        }))
      )
      .onConflictDoUpdate({
        target: categories.slug,
        set: { name: sql`excluded.name`, sortOrder: sql`excluded.sort_order` },
      })
      .returning({ id: categories.id, slug: categories.slug });

    const categoryIdBySlug = new Map(categoryRows.map((row) => [row.slug, row.id]));

    // 2. Flatten the catalog into logo rows.
    const logoValues = CATALOG.flatMap((category) =>
      category.logos.map((slug) => {
        const icon = ICONS_BY_SLUG.get(slug)!;
        return {
          categoryId: categoryIdBySlug.get(category.slug)!,
          slug,
          name: icon.title,
          imageUrl: logoImageUrl(slug),
          color: icon.hex,
          svg: prepareMysterySvg(icon),
          difficulty: difficultyFor(slug),
          acceptedAnswers: ACCEPTED_ALIASES[slug] ?? [],
        };
      })
    );

    // 3. Upsert them all at once.
    await db
      .insert(logos)
      .values(logoValues)
      .onConflictDoUpdate({
        target: logos.slug,
        set: {
          categoryId: sql`excluded.category_id`,
          name: sql`excluded.name`,
          imageUrl: sql`excluded.image_url`,
          color: sql`excluded.color`,
          svg: sql`excluded.svg`,
          difficulty: sql`excluded.difficulty`,
          acceptedAnswers: sql`excluded.accepted_answers`,
        },
      });

    // 4. Drop anything that used to be in the catalog but no longer is.
    const removed = await db
      .delete(logos)
      .where(notInArray(logos.slug, logoValues.map((row) => row.slug)))
      .returning({ slug: logos.slug });

    await db.delete(categories).where(notInArray(categories.slug, CATALOG.map((c) => c.slug)));

    for (const category of CATALOG) {
      console.log(`  ${category.name.padEnd(22)} ${category.logos.length} logos`);
    }

    console.log(`\nSeeded ${CATALOG.length} categories and ${logoValues.length} logos.`);
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

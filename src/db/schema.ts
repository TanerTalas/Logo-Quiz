/**
 * Database Schema
 *
 * Drizzle table definitions for the Logo Quiz dataset. Two tables only:
 * categories and the logos that belong to them. Scores are intentionally absent —
 * the game keeps its high score in the browser (localStorage), so there is no
 * server-side leaderboard to store.
 *
 * SECURITY NOTE: `name`, `slug` and `acceptedAnswers` on the logos table are the
 * answers to the quiz. Nothing in this file may ever be serialised straight to the
 * client — go through the shaped selectors in `src/db/queries.ts` instead.
 */

import { pgTable, serial, text, integer, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

/**
 * A playable category (Tech & Apps, Automotive, ...).
 * `slug` is the value that appears in the URL: /game/tech
 */
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  // Controls the order the cards appear in on the Categories page.
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// Logos
// ---------------------------------------------------------------------------

/**
 * A single brand logo — one quiz question's worth of data.
 *
 * `slug` doubles as the SimpleIcons identifier used to build `imageUrl`, which is
 * why it counts as answer data: "spotify" gives the answer away just as plainly as
 * "Spotify" does. The image is therefore served to players through a proxy route
 * keyed on `id`, never on `slug`.
 */
export const logos = pgTable(
  'logos',
  {
    id: serial('id').primaryKey(),
    categoryId: integer('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
    slug: text('slug').notNull().unique(),
    name: text('name').notNull(),
    /**
     * CDN address, used only where the brand is already public: the catalog pages
     * and the decorative tiles. The browser fetches these directly.
     */
    imageUrl: text('image_url').notNull(),
    /**
     * The brand's own colour, as the six digit hex SimpleIcons publishes it in.
     *
     * Not decoration: it is what says whether a logo would vanish on the white tiles the
     * catalog and the game use, so the display code can put a dark plate under the ones
     * that would. Safe to render — a colour is not an answer. See `lib/logoContrast.ts`.
     */
    color: text('color').notNull().default('000000'),
    /**
     * The icon markup itself, stored at seed time with the brand name stripped out.
     *
     * The mystery logo shown during a round is served from here rather than proxied
     * from the CDN. Fetching it per question put an external service in the game's
     * hot path — and the CDN sits behind Cloudflare, which rejects requests from
     * datacenter IPs, so the proxy worked locally and returned 502 in production.
     */
    svg: text('svg').notNull().default(''),
    // 1 = everyone knows it, 2 = fairly well known, 3 = niche.
    difficulty: integer('difficulty').notNull().default(1),
    // Alternative spellings accepted as correct, e.g. ["Meta", "FB"] for Facebook.
    acceptedAnswers: text('accepted_answers').array().notNull().default([]),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Round building always filters by category, so index that lookup.
    index('logos_category_id_idx').on(table.categoryId),
  ]
);

// ---------------------------------------------------------------------------
// Relations (lets Drizzle's query API join categories to their logos)
// ---------------------------------------------------------------------------

export const categoriesRelations = relations(categories, ({ many }) => ({
  logos: many(logos),
}));

export const logosRelations = relations(logos, ({ one }) => ({
  category: one(categories, {
    fields: [logos.categoryId],
    references: [categories.id],
  }),
}));

// Row types inferred from the tables above, for use across the server code.
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Logo = typeof logos.$inferSelect;
export type NewLogo = typeof logos.$inferInsert;

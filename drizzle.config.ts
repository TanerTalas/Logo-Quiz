/**
 * Drizzle Kit Configuration
 *
 * Used by the CLI only (`npm run db:push`, `npm run db:studio`), never at runtime.
 * Next.js loads .env.local automatically but the standalone CLI does not, so it is
 * loaded explicitly here.
 */

import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config({ path: '.env.local' });

/**
 * Schema changes need a session that survives more than one transaction, which the
 * transaction pooler does not provide. Once the app is pointed at the transaction
 * pooler in production, set MIGRATION_DATABASE_URL to the session pooler URL and
 * the CLI will use that instead. Locally, where both are the same, DATABASE_URL is
 * all there is and the fallback covers it.
 */
const migrationUrl = process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL;

if (!migrationUrl) {
  throw new Error('Set DATABASE_URL (or MIGRATION_DATABASE_URL) in .env.local.');
}

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: migrationUrl,
  },
  verbose: true,
});

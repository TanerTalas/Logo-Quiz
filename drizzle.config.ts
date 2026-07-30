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

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
});

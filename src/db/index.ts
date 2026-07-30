/**
 * Database Connection
 *
 * Creates the single Drizzle client used by every server component and route
 * handler. Importing `server-only` makes the build fail loudly if this module is
 * ever pulled into a client component, which would leak DATABASE_URL.
 */

import 'server-only';

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    'DATABASE_URL is not set. Copy the Supabase connection string into .env.local.'
  );
}

/**
 * Next.js reloads modules on every edit in dev, which would open a new pool each
 * time and exhaust the connection limit. Caching the socket on globalThis keeps a
 * single pool alive across reloads; production builds create it exactly once.
 */
const globalForDb = globalThis as unknown as { pgClient?: postgres.Sql };

const client =
  globalForDb.pgClient ??
  postgres(connectionString, {
    // Supabase's connection pooler does not support prepared statements.
    prepare: false,
    max: 10,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.pgClient = client;
}

export const db = drizzle(client, { schema });

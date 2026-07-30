/**
 * Connection Check
 *
 * Quick sanity check that DATABASE_URL points at a reachable Postgres and reports
 * the round-trip latency. Run with: npx tsx src/db/check-connection.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import postgres from 'postgres';

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url || url.startsWith('BURAYA')) {
    throw new Error('DATABASE_URL is not filled in yet (.env.local).');
  }

  const sql = postgres(url, { prepare: false, max: 1, connect_timeout: 20 });

  try {
    const started = Date.now();
    const rows = await sql`select current_database() as db, version() as version`;
    const elapsed = Date.now() - started;

    console.log(`Connected in ${elapsed} ms (includes TLS handshake)`);
    console.log(`Database: ${rows[0].db}`);
    console.log(`Server:   ${String(rows[0].version).split(' on ')[0]}`);

    // Warm round trips: this is the per-query cost the app will actually pay.
    const samples: number[] = [];
    for (let i = 0; i < 5; i++) {
      const t0 = Date.now();
      await sql`select 1`;
      samples.push(Date.now() - t0);
    }
    const average = Math.round(samples.reduce((a, b) => a + b, 0) / samples.length);
    console.log(`Warm query round trip: ${samples.join(', ')} ms (avg ${average} ms)`);
  } finally {
    await sql.end();
  }
}

main().catch((error) => {
  console.error('Connection failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});

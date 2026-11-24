/**
 * Idempotent migration script — run before seeding after schema changes.
 * Safe to run multiple times; uses IF NOT EXISTS / IF EXISTS guards.
 */
import { pool } from "@workspace/db/admin";

async function migrate() {
  const client = await pool.connect();

  try {
    console.log("Running migrations...");

    // Extend post_status enum with moderation states
    await client.query(`ALTER TYPE post_status ADD VALUE IF NOT EXISTS 'hidden'`);
    await client.query(`ALTER TYPE post_status ADD VALUE IF NOT EXISTS 'resolved'`);

    // Add NGO operational status column
    await client.query(`
      ALTER TABLE ngos ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active'
    `);

    await client.query(`
      BEGIN;
      ALTER TABLE ngos ADD COLUMN IF NOT EXISTS referral_approved_at timestamptz;
      CREATE TABLE IF NOT EXISTS contact_access_log (
        id serial PRIMARY KEY,
        viewer_user_id integer NOT NULL,
        ngo_id integer NOT NULL,
        post_id integer NOT NULL,
        accessed_at timestamptz NOT NULL DEFAULT now()
      );
      ALTER TABLE contact_access_log ENABLE ROW LEVEL SECURITY;
      COMMIT;
    `);

    console.log("Migrations complete.");
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});

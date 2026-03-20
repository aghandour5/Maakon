/**
 * Idempotent migration script — run before seeding after schema changes.
 * Safe to run multiple times; uses IF NOT EXISTS / IF EXISTS guards.
 */
import { pool } from "@workspace/db";

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

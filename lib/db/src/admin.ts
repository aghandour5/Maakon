import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";
import { getAdminDatabaseConnectionString } from "./connection-config";

/** Import only from maintenance scripts; do not expose this URL to the API. */
export const pool = new pg.Pool({
  connectionString: getAdminDatabaseConnectionString(
    process.env.DATABASE_ADMIN_URL,
  ),
});
export const db = drizzle(pool, { schema });

export * from "./schema";

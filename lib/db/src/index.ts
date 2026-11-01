import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";
import { getDatabaseConnectionString } from "./connection-config";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: getDatabaseConnectionString(process.env.DATABASE_URL),
});
export const db = drizzle(pool, { schema });

export * from "./schema";
export { assertRuntimeDatabaseRole } from "./runtime-role";

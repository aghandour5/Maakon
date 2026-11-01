import "dotenv/config";
import app from "./app";
import { logger } from "./lib/logger";
import { assertRuntimeDatabaseRole, pool } from "@workspace/db";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function start() {
  if (process.env.NODE_ENV === "production") {
    await assertRuntimeDatabaseRole(pool);
  }
  app.listen(port, "0.0.0.0", () => {
    logger.info({ port }, "Server listening on all interfaces (0.0.0.0)");
  });
}

start().catch(async (err: unknown) => {
  logger.fatal({ err }, "API startup failed");
  await pool.end();
  process.exitCode = 1;
});

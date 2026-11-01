import { readFile } from "node:fs/promises";
import { pool } from "@workspace/db/admin";

async function configureRuntimeRole() {
  const client = await pool.connect();
  try {
    const sql = await readFile(
      new URL("../../lib/db/sql/runtime-role.sql", import.meta.url),
      "utf8",
    );
    await client.query(sql);
    const { rows } = await client.query<{ rolcanlogin: boolean }>(
      "SELECT rolcanlogin FROM pg_roles WHERE rolname = 'maakon_api'",
    );
    console.log(
      JSON.stringify({
        role: "maakon_api",
        permissionsConfigured: true,
        loginEnabled: rows[0].rolcanlogin,
        passwordChanged: false,
      }),
    );
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

configureRuntimeRole()
  .catch((error: unknown) => {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? error.code
        : "SETUP_FAILED";
    console.error("Runtime role configuration failed.", { code });
    process.exitCode = 1;
  })
  .finally(() => pool.end());

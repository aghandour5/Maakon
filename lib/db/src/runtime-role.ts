import type { Pool } from "pg";

/** Check the actual connected role, including privileges inherited from PUBLIC. */
export async function assertRuntimeDatabaseRole(
  pool: Pick<Pool, "query">,
): Promise<void> {
  const { rows } = await pool.query<{ privileged: boolean }>(`
    SELECT (
      r.rolsuper OR r.rolcreatedb OR r.rolcreaterole OR r.rolreplication OR r.rolbypassrls
      OR EXISTS (SELECT 1 FROM pg_auth_members m WHERE m.member = r.oid)
      OR EXISTS (SELECT 1 FROM pg_class c WHERE c.relowner = r.oid)
      OR has_database_privilege(current_user, current_database(), 'CREATE')
      OR has_schema_privilege(current_user, 'public', 'CREATE')
    ) AS privileged
    FROM pg_roles r WHERE r.rolname = current_user
  `);
  if (rows.length !== 1 || rows[0].privileged !== false) {
    throw new Error(
      "The API requires a non-owner database role without administrative privileges or role memberships. Configure DATABASE_URL with the restricted runtime login.",
    );
  }
}

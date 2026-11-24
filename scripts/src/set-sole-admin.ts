import { db, pool, adminActionsTable, usersTable } from "@workspace/db/admin";
import { asc, eq, inArray, or, sql } from "drizzle-orm";

const NOTE = "maintenance:set-sole-admin";
const USAGE = "Usage: set:sole-admin <email> [--dry-run | --apply]";

async function setSoleAdmin() {
  const args = process.argv.slice(2);
  const flags = args.filter((arg) => arg.startsWith("--"));
  const emails = args.filter((arg) => !arg.startsWith("--"));
  if (
    emails.length !== 1 ||
    flags.length > 1 ||
    (flags[0] && !["--dry-run", "--apply"].includes(flags[0]))
  ) {
    throw new Error(USAGE);
  }
  const email = emails[0].trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error(USAGE);
  const apply = flags[0] === "--apply";

  const result = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${NOTE}))`);
    const rows = await tx.select({ id: usersTable.id, email: usersTable.email, role: usersTable.role })
      .from(usersTable)
      .where(or(eq(usersTable.role, "admin"), eq(sql`lower(${usersTable.email})`, email)))
      .orderBy(asc(usersTable.id))
      .for("update");

    const matches = rows.filter((row) => row.email?.toLowerCase() === email);
    if (matches.length > 1) {
      throw new Error(`Multiple users match ${email}: ${matches.map(({ id }) => id).join(", ")}`);
    }
    let target = matches[0];
    const created = !target;
    const demoted = rows.filter((row) => row.role === "admin" && row.id !== target?.id);
    const promote = target?.role !== "admin";
    if (!apply) return { target, created, demoted, promote };

    const now = new Date();
    if (demoted.length) {
      await tx.update(usersTable).set({ role: "user", updatedAt: now })
        .where(inArray(usersTable.id, demoted.map(({ id }) => id)));
    }
    if (!target) {
      // Sign-in links an existing row by email, so a new row grants admin on first login.
      [target] = await tx.insert(usersTable).values({ email, role: "admin" })
        .returning({ id: usersTable.id, email: usersTable.email, role: usersTable.role });
    } else if (promote) {
      await tx.update(usersTable).set({ role: "admin", updatedAt: now })
        .where(eq(usersTable.id, target.id));
    }

    const actions = [
      ...demoted.map(({ id }) => ({ targetType: "user", targetId: id, action: "role:user", note: NOTE })),
      ...(promote ? [{ targetType: "user", targetId: target.id, action: "role:admin", note: NOTE }] : []),
    ];
    if (actions.length) await tx.insert(adminActionsTable).values(actions);
    return { target, created, demoted, promote };
  });

  const { target, created, demoted, promote } = result;
  const verb = (done: string, planned: string) => (apply ? done : `Would ${planned}`);
  const demotedList = demoted.map(({ id, email }) => `${id} <${email ?? "no email"}>`).join(", ");
  console.log(`${verb("Removed", "remove")} admin access from ${demoted.length} user(s): ${demotedList || "none"}`);
  if (!promote) {
    console.log(`${email} (user ${target!.id}) is already an admin`);
  } else if (created) {
    const id = target ? ` (user ${target.id})` : "";
    console.log(`${verb("Created", "create")} admin user ${email}${id}; access starts at their first sign-in`);
  } else {
    console.log(`${verb("Granted", "grant")} admin access to ${email} (user ${target!.id})`);
  }
}

try {
  await setSoleAdmin();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await pool.end();
}

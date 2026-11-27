import { db, pool, adminActionsTable, postsTable, usersTable } from "@workspace/db/admin";
import { and, asc, desc, eq, gt, inArray, isNull, like, or, sql } from "drizzle-orm";

const RETIRE_NOTE = "release-a:retire-individual-offers";
const ROLLBACK_NOTE = `${RETIRE_NOTE}:rollback`;
const individualOffers = and(
  eq(postsTable.postType, "offer"),
  inArray(postsTable.userId, db.select({ id: usersTable.id }).from(usersTable)
    .where(eq(usersTable.accountType, "individual"))),
);
const unclaimedOffers = and(eq(postsTable.postType, "offer"), isNull(postsTable.userId));

async function retireOffers() {
  const args = process.argv.slice(2);
  if (args.length > 1 || (args[0] && !["--dry-run", "--apply", "--rollback"].includes(args[0]))) {
    throw new Error("Usage: retire:offers [--dry-run | --apply | --rollback]");
  }
  const mode = args[0] ?? "--dry-run";

  if (mode === "--dry-run") {
    const offers = await db.select({ id: postsTable.id, status: postsTable.status }).from(postsTable)
      .where(or(
        and(individualOffers, eq(postsTable.status, "active")),
        and(unclaimedOffers, eq(postsTable.status, "draft")),
      ))
      .orderBy(asc(postsTable.id));
    printIds("Would hide individual offers", offers.filter((offer) => offer.status === "active"));
    printIds("Would remove unclaimed offer drafts", offers.filter((offer) => offer.status === "draft"));
    return;
  }

  const rollback = mode === "--rollback";
  const [offers, drafts] = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${RETIRE_NOTE}))`);
    const now = new Date();
    const stillValid = or(isNull(postsTable.expiresAt), gt(postsTable.expiresAt, now));
    const lastStatusNote = tx.select({ note: adminActionsTable.note }).from(adminActionsTable)
      .where(and(
        eq(adminActionsTable.targetType, "post"),
        eq(adminActionsTable.targetId, postsTable.id),
        like(adminActionsTable.action, "status:%"),
      ))
      .orderBy(desc(adminActionsTable.id))
      .limit(1);
    const retiredByRelease = eq(sql<string>`(${lastStatusNote})`, RETIRE_NOTE);
    const offerStatus = rollback ? "active" : "hidden";
    const draftStatus = rollback ? "draft" : "removed";

    const offers = await tx.update(postsTable).set({ status: offerStatus, updatedAt: now })
      .where(and(
        individualOffers,
        rollback
          ? and(eq(postsTable.status, "hidden"), retiredByRelease, stillValid)
          : eq(postsTable.status, "active"),
      ))
      .returning({ id: postsTable.id });
    const drafts = await tx.update(postsTable).set({ status: draftStatus, updatedAt: now })
      .where(and(
        unclaimedOffers,
        rollback
          ? and(eq(postsTable.status, "removed"), retiredByRelease, stillValid)
          : eq(postsTable.status, "draft"),
      ))
      .returning({ id: postsTable.id });

    const note = rollback ? ROLLBACK_NOTE : RETIRE_NOTE;
    const actions = [
      ...offers.map(({ id }) => ({ targetType: "post", targetId: id, action: `status:${offerStatus}`, note })),
      ...drafts.map(({ id }) => ({ targetType: "post", targetId: id, action: `status:${draftStatus}`, note })),
    ];
    if (actions.length) await tx.insert(adminActionsTable).values(actions);
    return [offers, drafts];
  });

  printIds(rollback ? "Restored active offers" : "Hid individual offers", offers);
  printIds(rollback ? "Restored unclaimed offer drafts" : "Removed unclaimed offer drafts", drafts);
}

function printIds(label: string, rows: { id: number }[]) {
  const ids = rows.map(({ id }) => id).sort((a, b) => a - b);
  console.log(`${label}: ${ids.length} (${ids.join(", ") || "none"})`);
}

try {
  await retireOffers();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await pool.end();
}

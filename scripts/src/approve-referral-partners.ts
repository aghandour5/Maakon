import { db, pool, adminActionsTable, ngosTable } from "@workspace/db/admin";
import { getReferralApprovalError } from "@workspace/db/referrals";
import { asc, inArray } from "drizzle-orm";

async function approvePartners() {
  const args = process.argv.slice(2);
  const ids = [...new Set(args.map(Number))];
  if (
    !ids.length ||
    args.some((arg) => !/^[1-9]\d*$/.test(arg)) ||
    ids.some((id) => id > 2147483647)
  ) {
    throw new Error("Usage: approve:referrals <reviewed-ngo-id> [reviewed-ngo-id ...]");
  }

  const approved = await db.transaction(async (tx) => {
    const ngos = await tx.select().from(ngosTable)
      .where(inArray(ngosTable.id, ids))
      .orderBy(asc(ngosTable.id))
      .for("update");
    const missing = ids.filter((id) => !ngos.some((ngo) => ngo.id === id));
    if (missing.length) throw new Error(`Organizations not found: ${missing.join(", ")}`);

    for (const ngo of ngos) {
      const error = getReferralApprovalError(ngo);
      if (error) throw new Error(`Organization ${ngo.id}: ${error}`);
    }
    const newIds = ngos.filter((ngo) => !ngo.referralApprovedAt).map((ngo) => ngo.id);
    if (!newIds.length) return [];

    await tx.update(ngosTable).set({ referralApprovedAt: new Date() })
      .where(inArray(ngosTable.id, newIds));
    await tx.insert(adminActionsTable).values(newIds.map((id) => ({
      targetType: "ngo",
      targetId: id,
      action: "referral:approve",
      note: "release-a:reviewed-referral-partners",
    })));
    return newIds;
  });

  console.log(`Approved ${approved.length} organization(s): ${approved.join(", ") || "none"}`);
}

try {
  await approvePartners();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await pool.end();
}

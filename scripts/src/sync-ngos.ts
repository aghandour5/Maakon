import { db } from "@workspace/db";
import { postsTable, ngosTable } from "@workspace/db/schema";
import { eq, isNotNull, and } from "drizzle-orm";

async function run() {
  console.log("Starting sync...");

  const verifiedNgos = await db
    .select()
    .from(ngosTable)
    .where(isNotNull(ngosTable.verifiedAt));

  console.log(`Found ${verifiedNgos.length} verified NGOs.`);

  for (const ngo of verifiedNgos) {
    if (!ngo.userId) continue;

    console.log(`Updating posts for NGO: ${ngo.name} (userId: ${ngo.userId})`);

    const res = await db
      .update(postsTable)
      .set({ verifiedBadgeType: "ngo" })
      .where(
        and(
          eq(postsTable.userId, ngo.userId),
          eq(postsTable.providerType, "ngo")
        )
      )
      .returning({ id: postsTable.id });
      
    console.log(`Updated ${res.length} posts for ${ngo.name}`);
  }

  console.log("Sync complete.");
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});

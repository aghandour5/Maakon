import { db } from "./lib/db/src/index";
import { postsTable } from "./lib/db/src/schema/posts";

async function main() {
  try {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    
    await db.insert(postsTable).values({
      postType: "need",
      title: "Test Need",
      category: "food",
      description: "We need food here, testing 123.",
      urgency: null,
      governorate: "Beirut",
      district: null,
      publicLat: 33.9074,
      publicLng: 35.467,
      privateLat: null,
      privateLng: null,
      exactAddressPrivate: null,
      providerType: null,
      contactMethod: null,
      contactInfo: null,
      status: "active",
      expiresAt,
      lastConfirmedAt: new Date(),
    }).returning();
    console.log("Insert successful!");
  } catch (e: any) {
    console.error("DB Error:", e);
    console.error("Cause:", e.cause || e.message);
  }
  process.exit(0);
}

main();

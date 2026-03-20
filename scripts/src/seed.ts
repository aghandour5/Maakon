import { db, pool, postsTable, ngosTable, usersTable, reportsTable, adminActionsTable } from "@workspace/db";

const GOVERNORATE_CENTERS: Record<string, { lat: number; lng: number }> = {
  "Beirut": { lat: 33.8938, lng: 35.5018 },
  "Mount Lebanon": { lat: 33.8100, lng: 35.6000 },
  "North Lebanon": { lat: 34.4333, lng: 35.8333 },
  "South Lebanon": { lat: 33.2717, lng: 35.2033 },
  "Nabatieh": { lat: 33.3772, lng: 35.4840 },
  "Bekaa": { lat: 33.8500, lng: 35.9017 },
  "Akkar": { lat: 34.5581, lng: 36.0808 },
  "Baalbek-Hermel": { lat: 34.0049, lng: 36.2098 },
};

function fuzz(val: number) {
  return Math.round((val + (Math.random() - 0.5) * 0.1) * 10000) / 10000;
}

function expiresIn(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

function expiredDaysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

async function seed() {
  console.log("Seeding database...");

  // Clear all data in dependency order
  await db.delete(adminActionsTable);
  await db.delete(reportsTable);
  await db.delete(postsTable);
  await db.delete(ngosTable);
  await db.delete(usersTable);

  // ── NGOs ────────────────────────────────────────────────────────────────────
  const now = new Date();
  const ngos = await db.insert(ngosTable).values([
    {
      name: "UNHCR Lebanon",
      description: "UN Refugee Agency — emergency shelter, registration, and protection",
      governorate: "Beirut",
      district: "Beirut City",
      lat: 33.8869,
      lng: 35.5131,
      phone: "+961 1 850 178",
      website: "https://www.unhcr.org/lb",
      verifiedAt: now,
      status: "active",
    },
    {
      name: "Lebanese Red Cross",
      description: "Emergency medical, ambulance, blood bank, and first aid services",
      governorate: "Beirut",
      district: "Beirut City",
      lat: 33.8795,
      lng: 35.4978,
      phone: "140",
      website: "https://www.redcross.org.lb",
      verifiedAt: now,
      status: "active",
    },
    {
      name: "World Food Programme Lebanon",
      description: "Food assistance, vouchers, and emergency food distributions",
      governorate: "Bekaa",
      district: "Zahle",
      lat: 33.8498,
      lng: 35.9002,
      phone: "+961 8 900 950",
      website: "https://www.wfp.org/countries/lebanon",
      verifiedAt: now,
      status: "active",
    },
    {
      name: "ACTED Lebanon",
      description: "Emergency shelter, food security, and livelihoods support",
      governorate: "North Lebanon",
      district: "Tripoli",
      lat: 34.4367,
      lng: 35.8497,
      phone: "+961 6 200 123",
      website: "https://www.acted.org/en/countries/lebanon",
      verifiedAt: now,
      status: "active",
    },
    {
      name: "Caritas Lebanon",
      description: "Social services, health care, and emergency assistance",
      governorate: "Mount Lebanon",
      district: "Metn",
      lat: 33.8950,
      lng: 35.5850,
      phone: "+961 1 221 025",
      website: "https://www.caritasliban.org.lb",
      verifiedAt: now,
      status: "active",
    },
    {
      name: "Islamic Relief Lebanon",
      description: "Emergency food, shelter, water and sanitation support",
      governorate: "South Lebanon",
      district: "Sidon",
      lat: 33.5586,
      lng: 35.3696,
      phone: "+961 7 750 100",
      website: "https://islamic-relief.org",
      verifiedAt: now,
      status: "active",
    },
    {
      name: "Mercy Corps Lebanon",
      description: "Cash assistance, food vouchers, and livelihood programs for displaced families",
      governorate: "Bekaa",
      district: "Zahle",
      lat: 33.8512,
      lng: 35.9021,
      phone: "+961 8 000 200",
      website: "https://www.mercycorps.org",
      verifiedAt: now,
      status: "active",
    },
    // Unverified NGO — awaiting review
    {
      name: "Al-Amal Community Relief",
      description: "Local community group providing food baskets and clothing to families in Akkar",
      governorate: "Akkar",
      district: "Akkar",
      lat: 34.5560,
      lng: 36.0790,
      phone: "+961 6 555 789",
      website: null,
      verifiedAt: null, // Pending verification
      status: "active",
    },
  ]).returning();

  console.log(`Seeded ${ngos.length} NGOs`);

  // ── Active need posts ────────────────────────────────────────────────────────
  const needPosts = [
    {
      postType: "need" as const,
      title: "Family of 6 needs emergency shelter — Beirut",
      category: "shelter",
      description: "We were displaced after our building was damaged. We need urgent shelter for 2 adults and 4 children. We have some savings but cannot afford Beirut rents.",
      urgency: "critical" as const,
      governorate: "Beirut",
      district: "Beirut City",
      publicLat: fuzz(GOVERNORATE_CENTERS["Beirut"].lat),
      publicLng: fuzz(GOVERNORATE_CENTERS["Beirut"].lng),
      exactAddressPrivate: "Hamra Street, near Cola intersection",
      contactMethod: "whatsapp",
      contactInfo: "+961 70 000 001",
      status: "active" as const,
      expiresAt: expiresIn(14),
      lastConfirmedAt: now,
    },
    {
      postType: "need" as const,
      title: "Insulin and diabetes medication needed — Tripoli",
      category: "medical",
      description: "My father has Type 1 diabetes and we ran out of insulin. Cannot find it in local pharmacies. Please help.",
      urgency: "critical" as const,
      governorate: "North Lebanon",
      district: "Tripoli",
      publicLat: fuzz(GOVERNORATE_CENTERS["North Lebanon"].lat),
      publicLng: fuzz(GOVERNORATE_CENTERS["North Lebanon"].lng),
      exactAddressPrivate: "Near Al-Mina port area",
      contactMethod: "phone",
      contactInfo: "+961 6 000 002",
      status: "active" as const,
      expiresAt: expiresIn(7),
      lastConfirmedAt: now,
    },
    {
      postType: "need" as const,
      title: "Food for elderly couple — Bekaa valley",
      category: "food",
      description: "My elderly grandparents are alone in their village in the Bekaa. They have no income and need food supplies delivered or nearby pickup option.",
      urgency: "high" as const,
      governorate: "Bekaa",
      district: "Zahle",
      publicLat: fuzz(GOVERNORATE_CENTERS["Bekaa"].lat),
      publicLng: fuzz(GOVERNORATE_CENTERS["Bekaa"].lng),
      contactMethod: "whatsapp",
      contactInfo: "+961 76 000 003",
      status: "active" as const,
      expiresAt: expiresIn(21),
      lastConfirmedAt: now,
    },
    {
      postType: "need" as const,
      title: "Children's winter clothes needed — Nabatieh",
      category: "clothing",
      description: "3 children (ages 4, 7, 9) need warm winter clothes. We fled quickly and could not take much with us.",
      urgency: "medium" as const,
      governorate: "Nabatieh",
      district: "Nabatieh",
      publicLat: fuzz(GOVERNORATE_CENTERS["Nabatieh"].lat),
      publicLng: fuzz(GOVERNORATE_CENTERS["Nabatieh"].lng),
      contactMethod: "phone",
      contactInfo: "+961 7 000 004",
      status: "active" as const,
      expiresAt: expiresIn(30),
      lastConfirmedAt: now,
    },
    {
      postType: "need" as const,
      title: "Need clean water — Akkar village",
      category: "water",
      description: "Our village well is contaminated. 35 families need access to clean water. Tanker truck deliveries or water filter donations welcome.",
      urgency: "critical" as const,
      governorate: "Akkar",
      district: "Akkar",
      publicLat: fuzz(GOVERNORATE_CENTERS["Akkar"].lat),
      publicLng: fuzz(GOVERNORATE_CENTERS["Akkar"].lng),
      contactMethod: "phone",
      contactInfo: "+961 6 000 005",
      status: "active" as const,
      expiresAt: expiresIn(14),
      lastConfirmedAt: now,
    },
    {
      postType: "need" as const,
      title: "Transportation to medical appointment — Mount Lebanon",
      category: "transportation",
      description: "My mother has cancer treatment at AUBMC next Tuesday morning. We have no car and taxis are unaffordable. Any volunteer driver?",
      urgency: "high" as const,
      governorate: "Mount Lebanon",
      district: "Metn",
      publicLat: fuzz(GOVERNORATE_CENTERS["Mount Lebanon"].lat),
      publicLng: fuzz(GOVERNORATE_CENTERS["Mount Lebanon"].lng),
      contactMethod: "whatsapp",
      contactInfo: "+961 71 000 006",
      status: "active" as const,
      expiresAt: expiresIn(5),
      lastConfirmedAt: now,
    },
    {
      postType: "need" as const,
      title: "Mental health support for family — Baalbek",
      category: "psychological",
      description: "Our family experienced severe trauma. We need counseling support, preferably in Arabic. Two teenagers showing signs of anxiety and depression.",
      urgency: "medium" as const,
      governorate: "Baalbek-Hermel",
      district: "Baalbek",
      publicLat: fuzz(GOVERNORATE_CENTERS["Baalbek-Hermel"].lat),
      publicLng: fuzz(GOVERNORATE_CENTERS["Baalbek-Hermel"].lng),
      contactMethod: "whatsapp",
      contactInfo: "+961 8 000 007",
      status: "active" as const,
      expiresAt: expiresIn(30),
      lastConfirmedAt: now,
    },
  ];

  // ── Active offer posts ───────────────────────────────────────────────────────
  const offerPosts = [
    {
      postType: "offer" as const,
      title: "Spare room available — Achrafieh",
      category: "shelter",
      description: "I have a spare room in my Achrafieh apartment. Offering 3–4 months free accommodation for a displaced family. Small family preferred.",
      governorate: "Beirut",
      district: "Beirut City",
      publicLat: fuzz(GOVERNORATE_CENTERS["Beirut"].lat),
      publicLng: fuzz(GOVERNORATE_CENTERS["Beirut"].lng),
      providerType: "individual",
      contactMethod: "whatsapp",
      contactInfo: "+961 70 000 100",
      status: "active" as const,
      expiresAt: expiresIn(30),
      lastConfirmedAt: now,
    },
    {
      postType: "offer" as const,
      title: "Hot meals daily — Hamra kitchen",
      category: "food",
      description: "Community kitchen offering free hot meals every day noon to 2pm. Up to 50 portions available. No registration needed.",
      governorate: "Beirut",
      district: "Beirut City",
      publicLat: fuzz(GOVERNORATE_CENTERS["Beirut"].lat),
      publicLng: fuzz(GOVERNORATE_CENTERS["Beirut"].lng),
      providerType: "organization",
      contactMethod: "phone",
      contactInfo: "+961 1 000 200",
      status: "active" as const,
      expiresAt: expiresIn(60),
      lastConfirmedAt: now,
    },
    {
      postType: "offer" as const,
      title: "Free GP consultations — Mount Lebanon clinic",
      category: "medical",
      description: "Volunteer doctor offering free general practice consultations on Saturdays. Chronic conditions, emergency referrals, prescriptions.",
      governorate: "Mount Lebanon",
      district: "Metn",
      publicLat: fuzz(GOVERNORATE_CENTERS["Mount Lebanon"].lat),
      publicLng: fuzz(GOVERNORATE_CENTERS["Mount Lebanon"].lng),
      providerType: "individual",
      contactMethod: "whatsapp",
      contactInfo: "+961 70 000 300",
      status: "active" as const,
      expiresAt: expiresIn(30),
      lastConfirmedAt: now,
    },
    {
      postType: "offer" as const,
      title: "Pickup truck — weekend moves in Bekaa",
      category: "transportation",
      description: "Available on weekends to help displaced families move their belongings. Covering Zahle, Bar Elias, and surrounding areas. Free of charge.",
      governorate: "Bekaa",
      district: "Zahle",
      publicLat: GOVERNORATE_CENTERS["Bekaa"].lat,
      publicLng: GOVERNORATE_CENTERS["Bekaa"].lng,
      providerType: "individual",
      contactMethod: "phone",
      contactInfo: "+961 76 000 400",
      status: "active" as const,
      expiresAt: expiresIn(30),
      lastConfirmedAt: now,
    },
    {
      postType: "offer" as const,
      title: "School supplies for 50 children — Sidon",
      category: "education",
      description: "Backpacks, notebooks, stationery for primary school age. For displaced children enrolling in local schools. Pick up in Sidon city center.",
      governorate: "South Lebanon",
      district: "Sidon",
      publicLat: GOVERNORATE_CENTERS["South Lebanon"].lat,
      publicLng: GOVERNORATE_CENTERS["South Lebanon"].lng,
      providerType: "organization",
      contactMethod: "whatsapp",
      contactInfo: "+961 7 000 500",
      status: "active" as const,
      expiresAt: expiresIn(21),
      lastConfirmedAt: now,
    },
    {
      postType: "offer" as const,
      title: "Winter clothing collection — Akkar",
      category: "clothing",
      description: "Large donation of clean winter clothes for all ages. Available for pickup in Akkar. Can arrange regional delivery.",
      governorate: "Akkar",
      district: "Akkar",
      publicLat: GOVERNORATE_CENTERS["Akkar"].lat,
      publicLng: GOVERNORATE_CENTERS["Akkar"].lng,
      providerType: "organization",
      contactMethod: "phone",
      contactInfo: "+961 6 000 600",
      status: "active" as const,
      expiresAt: expiresIn(30),
      lastConfirmedAt: now,
    },
    {
      postType: "offer" as const,
      title: "Free online trauma counseling — Arabic/French",
      category: "psychological",
      description: "Certified psychologist offering free online and in-person sessions for trauma and displacement. Sessions in Arabic and French.",
      governorate: "Beirut",
      district: "Beirut City",
      publicLat: fuzz(GOVERNORATE_CENTERS["Beirut"].lat),
      publicLng: fuzz(GOVERNORATE_CENTERS["Beirut"].lng),
      providerType: "individual",
      contactMethod: "email",
      contactInfo: "psy@example.com",
      status: "active" as const,
      expiresAt: expiresIn(45),
      lastConfirmedAt: now,
    },
    {
      postType: "offer" as const,
      title: "Emergency water tanker — North Lebanon",
      category: "water",
      description: "NGO tanker available for emergency water delivery to villages in North Lebanon. Contact to schedule.",
      governorate: "North Lebanon",
      district: "Tripoli",
      publicLat: GOVERNORATE_CENTERS["North Lebanon"].lat,
      publicLng: GOVERNORATE_CENTERS["North Lebanon"].lng,
      providerType: "organization",
      contactMethod: "phone",
      contactInfo: "+961 6 000 700",
      status: "active" as const,
      expiresAt: expiresIn(60),
      lastConfirmedAt: now,
    },
  ];

  // ── Moderation demo posts (hidden, resolved, expired) ──────────────────────
  const moderationDemoPosts = [
    {
      postType: "need" as const,
      title: "DEMO: Hidden post — suspicious contact info",
      category: "food",
      description: "This post was hidden by a moderator due to suspicious contact details flagged by reports.",
      urgency: "medium" as const,
      governorate: "Beirut",
      district: "Beirut City",
      publicLat: fuzz(GOVERNORATE_CENTERS["Beirut"].lat),
      publicLng: fuzz(GOVERNORATE_CENTERS["Beirut"].lng),
      status: "hidden" as const,
      expiresAt: expiresIn(30),
      lastConfirmedAt: now,
    },
    {
      postType: "need" as const,
      title: "DEMO: Resolved — family found shelter",
      category: "shelter",
      description: "The family confirmed they found accommodation through a volunteer. Post marked resolved.",
      urgency: "high" as const,
      governorate: "Mount Lebanon",
      district: "Metn",
      publicLat: fuzz(GOVERNORATE_CENTERS["Mount Lebanon"].lat),
      publicLng: fuzz(GOVERNORATE_CENTERS["Mount Lebanon"].lng),
      status: "resolved" as const,
      expiresAt: expiresIn(30),
      lastConfirmedAt: now,
    },
    {
      postType: "offer" as const,
      title: "DEMO: Expired — clothing drive ended",
      category: "clothing",
      description: "This clothing drive has ended. Post auto-expired after 7 days.",
      governorate: "South Lebanon",
      district: "Sidon",
      publicLat: GOVERNORATE_CENTERS["South Lebanon"].lat,
      publicLng: GOVERNORATE_CENTERS["South Lebanon"].lng,
      providerType: "organization",
      status: "expired" as const,
      expiresAt: expiredDaysAgo(3),
      lastConfirmedAt: now,
    },
    {
      postType: "need" as const,
      title: "DEMO: Stale active post (should be cleaned up)",
      category: "medical",
      description: "This active post has an expiry date in the past. Run /admin/cleanup to auto-expire it.",
      urgency: "low" as const,
      governorate: "Bekaa",
      district: "Zahle",
      publicLat: fuzz(GOVERNORATE_CENTERS["Bekaa"].lat),
      publicLng: fuzz(GOVERNORATE_CENTERS["Bekaa"].lng),
      status: "active" as const,
      expiresAt: expiredDaysAgo(2), // expired 2 days ago but still "active" — cleanup demo
      lastConfirmedAt: now,
    },
  ];

  const seededPosts = await db
    .insert(postsTable)
    .values([...needPosts, ...offerPosts, ...moderationDemoPosts])
    .returning();

  console.log(`Seeded ${seededPosts.length} posts`);

  // ── Reports ─────────────────────────────────────────────────────────────────
  // Add sample reports for demo moderation workflow
  const firstActiveNeed = seededPosts.find((p) => p.postType === "need" && p.status === "active");
  const secondActiveNeed = seededPosts.filter((p) => p.postType === "need" && p.status === "active")[1];
  const hiddenPost = seededPosts.find((p) => p.status === "hidden");

  const reportData = [];

  if (firstActiveNeed) {
    reportData.push({
      postId: firstActiveNeed.id,
      reason: "spam" as const,
      details: "Contact info looks like a scam number",
      status: "pending" as const,
    });
    reportData.push({
      postId: firstActiveNeed.id,
      reason: "fake" as const,
      details: "Could not reach contact, number disconnected",
      status: "reviewed" as const,
    });
  }

  if (secondActiveNeed) {
    reportData.push({
      postId: secondActiveNeed.id,
      reason: "outdated" as const,
      details: "Poster said need was met but did not update the post",
      status: "pending" as const,
    });
  }

  if (hiddenPost) {
    reportData.push({
      postId: hiddenPost.id,
      reason: "scam" as const,
      details: "Multiple users confirmed this is a fraudulent request",
      status: "actioned" as const,
      resolvedAt: now,
    });
    reportData.push({
      postId: hiddenPost.id,
      reason: "fake" as const,
      details: "Post details do not match reality",
      status: "dismissed" as const,
      resolvedAt: now,
    });
  }

  if (reportData.length > 0) {
    const seededReports = await db.insert(reportsTable).values(reportData).returning();
    console.log(`Seeded ${seededReports.length} reports`);

    // Recalculate report counts for affected posts
    const reportedPostIds = [...new Set(seededReports.map((r) => r.postId))];
    for (const postId of reportedPostIds) {
      const cnt = seededReports.filter((r) => r.postId === postId).length;
      await pool.query("UPDATE posts SET report_count = $1 WHERE id = $2", [cnt, postId]);
    }
  }

  console.log("Seed complete.");
  console.log("\nQuick reference:");
  console.log(`  Active posts: ${seededPosts.filter((p) => p.status === "active").length}`);
  console.log(`  Hidden posts: ${seededPosts.filter((p) => p.status === "hidden").length}`);
  console.log(`  Resolved posts: ${seededPosts.filter((p) => p.status === "resolved").length}`);
  console.log(`  Expired posts: ${seededPosts.filter((p) => p.status === "expired").length}`);
  console.log(`  NGOs seeded: ${ngos.length} (${ngos.filter((n) => n.verifiedAt).length} verified, ${ngos.filter((n) => !n.verifiedAt).length} unverified)`);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

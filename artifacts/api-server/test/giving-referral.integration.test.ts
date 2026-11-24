import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { once } from "node:events";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { eq, sql } from "drizzle-orm";
import type { Post, User } from "@workspace/db/schema";

const testUrl = process.env.MAAKON_API_TEST_DATABASE_URL;
const workspace = fileURLToPath(new URL("../../../", import.meta.url));
const area = { governorate: "Beirut", district: "Beirut City" };
const requestData = {
  ...area,
  postType: "need" as const,
  title: "Example request",
  category: "food",
  description: "A synthetic request for the integration suite.",
  providerType: "individual",
  contactMethod: "email",
  contactInfo: "requester@example.test",
};
const offerData = { ...requestData, postType: "offer" as const };

test("Release A referrals and request privacy", { skip: !testUrl }, async (t) => {
  const url = new URL(testUrl!);
  assert.ok(["postgres:", "postgresql:"].includes(url.protocol));
  assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(url.hostname));
  assert.equal(url.username, "db02_test_owner");
  assert.equal(url.pathname, "/maakon_release_a_test");
  assert.equal(url.search, "");

  Object.assign(process.env, {
    NODE_ENV: "test",
    DATABASE_URL: url.href,
    DATABASE_ADMIN_URL: url.href,
    VITE_SUPABASE_URL: "http://127.0.0.1:1",
    VITE_SUPABASE_ANON_KEY: "synthetic-test-key",
    SUPABASE_SERVICE_ROLE_KEY: "",
    DEV_SUPABASE_BYPASS: "true",
    ADMIN_IP_WHITELIST: "",
    LOG_LEVEL: "silent",
  });
  const {
    db, pool, usersTable, ngosTable, postsTable, sessionsTable, contactAccessLogTable, adminActionsTable,
  } = await import("@workspace/db");
  let server: Server | undefined;
  let ownsFixtures = false;
  t.after(async () => {
    if (server) await new Promise<void>((resolve) => server!.close(() => resolve()));
    try {
      if (ownsFixtures) {
        await pool.query(`
          TRUNCATE contact_access_log, admin_actions, sessions, reports, ngo_verification_requests,
            ngos, posts, users RESTART IDENTITY
        `);
      }
    } finally {
      await pool.end();
    }
  });

  assert.deepEqual(
    (await pool.query("SELECT current_user AS owner, current_database() AS name")).rows[0],
    { owner: "db02_test_owner", name: "maakon_release_a_test" },
  );
  const tables = [
    "contact_access_log", "admin_actions", "sessions", "reports",
    "ngo_verification_requests", "ngos", "posts", "users",
  ];
  for (const table of tables) {
    assert.equal((await pool.query(`SELECT 1 FROM ${table} LIMIT 1`)).rowCount, 0, "Use an empty test database");
  }
  ownsFixtures = true;

  const { default: app } = await import("../src/app");
  const { createSession } = await import("../src/lib/session");
  const { createCsrfToken } = await import("../src/lib/csrf");
  server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const endpoint = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;

  async function send(path: string, method = "GET", body?: object, sessionHeaders?: Record<string, string>) {
    const response = await fetch(endpoint + path, {
      method,
      headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...sessionHeaders },
      body: body ? JSON.stringify(body) : undefined,
    });
    return {
      status: response.status,
      headers: response.headers,
      body: response.status === 204 ? null : await response.json(),
    };
  }

  async function signIn(user: User, mfaVerified = false) {
    const token = await createSession(user.id);
    const csrf = createCsrfToken();
    if (mfaVerified) await db.update(sessionsTable).set({ mfaVerified }).where(eq(sessionsTable.token, token));
    return { Cookie: `maakon_sid=${token}; maakon_csrf=${csrf}`, "x-csrf-token": csrf };
  }

  const [individual, ngoUser, unverified, hidden, admin] = await db.insert(usersTable).values([
    { email: "requester@example.test", supabaseUid: "test-individual", emailVerified: true, onboardingComplete: true },
    { email: "verified@example.test", accountType: "ngo", onboardingComplete: true },
    { email: "unverified@example.test", accountType: "ngo", ngoVerificationStatus: "verified" },
    { email: "hidden@example.test", accountType: "ngo" },
    { email: "admin@example.test", role: "admin", mfaEnabled: true },
  ]).returning();
  const [individualHeaders, ngoHeaders, unverifiedHeaders, hiddenHeaders, adminHeaders, adminWithoutMfa] =
    await Promise.all([signIn(individual), signIn(ngoUser), signIn(unverified), signIn(hidden), signIn(admin, true), signIn(admin)]);
  const now = new Date();
  const ngoData = { ...area, name: "Test organization", phone: "140" };
  const [verifiedNgo, unverifiedNgo, noContact, areaNgo, distantAreaNgo] = await db.insert(ngosTable).values([
    { ...ngoData, userId: ngoUser.id, verifiedAt: now, lat: 33.8938, lng: 35.5018 },
    { ...ngoData, userId: unverified.id, referralApprovedAt: now },
    { ...ngoData, verifiedAt: now, phone: null, referralApprovedAt: now },
    { ...ngoData, verifiedAt: now, referralApprovedAt: now },
    { ...ngoData, governorate: "Akkar", district: "Halba", verifiedAt: now, referralApprovedAt: now },
    { ...ngoData, userId: hidden.id, verifiedAt: now, status: "hidden", referralApprovedAt: now },
  ]).returning();
  const [request, hiddenRequest, resolvedRequest, expiredRequest, pendingRequest, removedRequest, pastDueRequest] =
    await db.insert(postsTable).values(([
      "active", "hidden", "resolved", "expired", "pending", "removed", "active",
    ] as const).map((status, index) => ({
      ...requestData,
      status,
      userId: individual.id,
      expiresAt: index === 6 ? new Date(0) : null,
    }))).returning();

  await t.test("email registration and legacy sessions require the full individual profile", async () => {
    const login = await send("/auth/supabase-login", "POST", {
      idToken: JSON.stringify({ uid: "profile-new", email: "new@example.test" }),
    });
    assert.equal(login.status, 200);
    assert.equal(login.body.user.email, "new@example.test");
    assert.equal(login.body.user.onboardingComplete, false);
    const me = () => send("/auth/me", "GET", undefined, individualHeaders);
    assert.equal((await me()).body.user.onboardingComplete, false);
    assert.equal((await send("/auth/me", "GET", undefined, ngoHeaders)).body.user.onboardingComplete, true);

    const path = "/auth/complete-profile";
    const name = { displayName: "Test Requester" };
    const details = { ...name, ...area, phone: "+961 70 123 456" };
    for (const invalid of [name, { ...details, phone: "not a phone" }, { ...details, district: "Halba" }]) {
      assert.equal((await send(path, "POST", invalid, individualHeaders)).status, 400);
    }
    assert.equal((await send(path, "POST", details, ngoHeaders)).status, 400);
    const saved = await send(path, "POST", { ...details, email: "not-the-login@example.test" }, individualHeaders);
    assert.equal(saved.status, 200);
    assert.equal(saved.body.user.onboardingComplete, true);
    assert.equal(saved.body.user.email, individual.email);
    assert.equal(saved.body.user.phone, "+96170123456");
    assert.equal(saved.body.user.displayName, name.displayName);
    assert.equal(saved.body.user.governorate, area.governorate);
    assert.equal(saved.body.user.district, area.district);
    assert.equal("mfaSecret" in saved.body.user, false);
    assert.deepEqual((await me()).body.user, saved.body.user);
  });

  await t.test("offer restrictions leave request creation and owner management available", async () => {
    for (const input of [offerData, { ...offerData, providerType: "ngo" }]) {
      const result = await send("/posts", "POST", input, individualHeaders);
      assert.equal(result.status, 403);
      assert.equal(result.body.code, "offer_referral_required");
      assert.match(result.body.error, /\/give.*[\u0600-\u06ff]/);
    }
    assert.equal((await send("/posts/draft", "POST", offerData)).body.code, "offer_referral_required");
    assert.equal((await db.select().from(postsTable)).length, 7);
    assert.equal((await db.select().from(ngosTable)).length, 6);

    const created = await send("/posts", "POST", requestData, individualHeaders);
    assert.equal(created.status, 201);
    assert.equal(created.body.contactInfo, null);
    assert.equal(created.body.contactMethod, null);
    const own = await send("/posts/me", "GET", undefined, individualHeaders);
    assert.equal(own.body.find((item: Post) => item.id === created.body.id).contactInfo, requestData.contactInfo);
    assert.equal((await send(`/posts/${request.id}`, "PATCH", { status: "resolved" }, ngoHeaders)).status, 404);
    for (const status of ["hidden", "resolved", "active"]) {
      assert.equal((await send(`/posts/${created.body.id}`, "PATCH", { status }, individualHeaders)).body.status, status);
    }
    assert.equal((await send(`/posts/${created.body.id}`, "DELETE", undefined, individualHeaders)).status, 204);

    const [legacyOffer] = await db.insert(postsTable).values({ ...offerData, userId: individual.id, status: "hidden" }).returning();
    const ownOffer = `/posts/${legacyOffer.id}`;
    assert.equal((await send(ownOffer, "PATCH", { status: "active" }, individualHeaders)).body.code, "offer_referral_required");
    assert.equal((await send(ownOffer, "PATCH", { title: "Edited offer" }, individualHeaders)).body.status, "hidden");
    assert.equal((await send(ownOffer, "PATCH", { status: "resolved" }, individualHeaders)).body.status, "resolved");
    assert.equal((await send(ownOffer, "DELETE", undefined, individualHeaders)).status, 204);
    assert.equal((await send("/posts", "POST", offerData, ngoHeaders)).status, 201);
  });

  await t.test("public history and detail expose only public statuses and omit private contact", async () => {
    const read = await send(`/posts/${request.id}`);
    assert.equal(read.status, 200);
    assert.equal(read.body.contactMethod, null);
    assert.equal(read.body.contactInfo, null);
    const publicPosts = [];
    for (let page = 1; ; page += 1) {
      const list = await send(`/posts?activeOnly=false&postType=need&page=${page}&limit=2`);
      assert.equal(list.status, 200);
      publicPosts.push(...list.body);
      if (list.body.length < 2) break;
    }
    assert.deepEqual(publicPosts.map(({ id }) => id).sort((a, b) => a - b),
      [request.id, resolvedRequest.id, expiredRequest.id, pastDueRequest.id]);
    assert.ok(publicPosts.every((post) => post.contactInfo === null && post.contactMethod === null));
    assert.deepEqual((await send("/posts?postType=need")).body.map((post: Post) => post.id), [request.id]);
    for (const post of [hiddenRequest, pendingRequest, removedRequest, expiredRequest, pastDueRequest]) {
      assert.equal((await send(`/posts/${post.id}`)).status, 404);
    }
    const volunteer = await send("/posts", "POST", {
      ...requestData, providerType: "ngo", category: "volunteers", contactInfo: "public@example.test",
    }, ngoHeaders);
    assert.equal(volunteer.status, 201);
    assert.equal((await send(`/posts/${volunteer.body.id}`)).body.contactInfo, "public@example.test");
  });

  await t.test("only eligible partners appear in read-only referrals and changes are audited", async () => {
    const listing = "/ngos/nearby?" + new URLSearchParams(area);
    const routeFor = (id: number) => `/admin/ngos/${id}/referral`;
    const snapshots = () => Promise.all([
      db.select().from(ngosTable), db.select().from(postsTable), db.select().from(usersTable),
      db.select().from(sessionsTable), db.select().from(contactAccessLogTable),
    ]);
    const before = await snapshots();
    const nearby = await send(listing);
    assert.deepEqual(nearby.body.distanceMatches, []);
    assert.deepEqual(nearby.body.areaMatches.map((ngo: { id: number }) => ngo.id), [areaNgo.id]);
    assert.deepEqual(await snapshots(), before);
    assert.equal((await send("/ngos/nearby?governorate=Beirut&district=Halba")).status, 400);
    assert.equal((await send("/ngos/nearby?governorate=Beirut")).status, 400);
    assert.equal((await send(routeFor(verifiedNgo.id), "PATCH", undefined, adminWithoutMfa)).status, 403);
    for (const ngo of [unverifiedNgo, noContact]) {
      assert.equal((await send(routeFor(ngo.id), "PATCH", undefined, adminHeaders)).status, 400);
    }

    const approved = await send(routeFor(verifiedNgo.id), "PATCH", undefined, adminHeaders);
    assert.equal(approved.status, 200);
    assert.ok(approved.body.referralApprovedAt);
    const referrals = (await send(listing)).body;
    assert.deepEqual(referrals.distanceMatches.map((ngo: { id: number }) => ngo.id), [verifiedNgo.id]);
    assert.equal(referrals.distanceMatches[0].match.distanceKm, 0);
    assert.ok(referrals.areaMatches.every((ngo: { id: number }) => ngo.id !== distantAreaNgo.id));
    assert.equal("referralApprovedAt" in (await send("/ngos")).body[0], false);

    await send(routeFor(verifiedNgo.id), "DELETE", undefined, adminHeaders);
    assert.equal((await send(listing)).body.distanceMatches.length, 0);
    await send(routeFor(verifiedNgo.id), "PATCH", undefined, adminHeaders);
    const unverify = await send(`/admin/ngos/${verifiedNgo.id}/verify`, "DELETE", undefined, adminHeaders);
    assert.equal(unverify.body.referralApprovedAt, null);
    assert.equal(unverify.body.verifiedAt, null);
    assert.equal((await send(listing)).body.distanceMatches.length, 0);
    assert.deepEqual((await db.select().from(adminActionsTable)).map(({ action }) => action), [
      "referral:approve", "referral:revoke", "referral:approve", "referral:revoke",
    ]);
    assert.equal((await send(`/admin/ngos/${verifiedNgo.id}/verify`, "PATCH", undefined, adminHeaders)).status, 200);
  });

  await t.test("contact reads require an active verified organization and a successful audit write", async () => {
    const access = `/posts/${request.id}/contact-access`;
    for (const [headers, expected] of [
      [undefined, 401],
      [individualHeaders, 403],
      [unverifiedHeaders, 403],
      [hiddenHeaders, 403],
      [{ Cookie: ngoHeaders.Cookie }, 403],
    ] as const) {
      const denied = await send(access, "POST", undefined, headers);
      assert.equal(denied.status, expected);
      assert.equal(denied.headers.get("cache-control"), "no-store");
      assert.equal(denied.body.contactInfo, undefined);
    }
    const nonIndividualPosts = await db.select().from(postsTable).where(eq(postsTable.userId, ngoUser.id));
    for (const post of [hiddenRequest, resolvedRequest, expiredRequest, pastDueRequest, ...nonIndividualPosts]) {
      assert.equal((await send(`/posts/${post.id}/contact-access`, "POST", undefined, ngoHeaders)).status, 404);
    }
    assert.equal((await db.select().from(contactAccessLogTable)).length, 0);
    const viewed = await send(access, "POST", undefined, ngoHeaders);
    assert.equal(viewed.status, 200);
    assert.equal(viewed.headers.get("cache-control"), "no-store");
    assert.deepEqual(viewed.body, { postId: request.id, contactMethod: requestData.contactMethod, contactInfo: requestData.contactInfo });
    const audit = await db.select().from(contactAccessLogTable);
    assert.equal(audit.length, 1);
    assert.equal(audit[0].viewerUserId, ngoUser.id);
    assert.equal(audit[0].ngoId, verifiedNgo.id);
    assert.equal(audit[0].postId, request.id);
    assert.ok(audit[0].accessedAt instanceof Date);

    await db.execute(sql`ALTER TABLE contact_access_log ADD CONSTRAINT test_refuse_log CHECK (false) NOT VALID`);
    try {
      const failed = await send(access, "POST", undefined, ngoHeaders);
      assert.equal(failed.status, 500);
      assert.equal(failed.body.contactInfo, undefined);
      assert.equal(failed.headers.get("cache-control"), "no-store");
      assert.deepEqual(await db.select().from(contactAccessLogTable), audit);
    } finally {
      await db.execute(sql`ALTER TABLE contact_access_log DROP CONSTRAINT test_refuse_log`);
    }
    const adminPosts = await send("/admin/posts", "GET", undefined, adminHeaders);
    assert.equal(adminPosts.body.find((post: Post) => post.id === request.id).contactInfo, requestData.contactInfo);
  });

  await t.test("request drafts still activate while legacy offer drafts return the referral area", async () => {
    const draft = await send("/posts/draft", "POST", requestData);
    assert.equal(draft.status, 201);
    const [pending, removed] = await db.insert(postsTable).values([
      { ...offerData, status: "pending", draftToken: "test-pending-offer" },
      { ...offerData, status: "removed", draftToken: "test-removed-offer" },
    ]).returning();
    const login = (draftToken: string) => send("/auth/supabase-login", "POST", {
      idToken: JSON.stringify({ uid: individual.supabaseUid, email: individual.email }),
      draftToken,
    });
    const claimed = await login(draft.body.draftToken);
    assert.equal(claimed.status, 200);
    assert.equal(claimed.body.referral, undefined);
    assert.deepEqual(claimed.body.claimedPost, { id: draft.body.postId, postType: "need" });
    assert.equal((await login(draft.body.draftToken)).body.claimedPost, undefined);
    const [claimedRequest] = await db.select().from(postsTable).where(eq(postsTable.id, draft.body.postId));
    assert.equal(claimedRequest.status, "active");
    assert.equal(claimedRequest.userId, individual.id);
    assert.equal(claimedRequest.contactInfo, requestData.contactInfo);

    for (const offer of [pending, removed]) {
      const result = await login(offer.draftToken!);
      assert.equal(result.status, 200);
      assert.match(result.headers.get("set-cookie") ?? "", /maakon_sid=/);
      assert.deepEqual(result.body.referral, area);
      assert.equal(result.body.claimedPost, undefined);
      const [after] = await db.select().from(postsTable).where(eq(postsTable.id, offer.id));
      assert.equal(after.status, offer.status);
      assert.equal(after.userId, null);
      assert.equal(after.draftToken, offer.draftToken);
    }
  });

  const run = promisify(execFile);
  const maintenance = async (name: string, ...args: string[]) => (await run(process.execPath, [
    "--import=./scripts/node_modules/tsx/dist/loader.mjs", `./scripts/src/${name}.ts`, ...args,
  ], { cwd: workspace, timeout: 15000 })).stdout;

  await t.test("reviewed approval and retirement scripts are audited and repeatable", async () => {
    await assert.rejects(() => maintenance("approve-referral-partners", String(verifiedNgo.id), String(noContact.id)));
    const [unapproved] = await db.select().from(ngosTable).where(eq(ngosTable.id, verifiedNgo.id));
    assert.equal(unapproved.referralApprovedAt, null);
    assert.match(await maintenance("approve-referral-partners", String(verifiedNgo.id)), /Approved 1/);
    assert.match(await maintenance("approve-referral-partners", String(verifiedNgo.id)), /Approved 0/);

    const [live, expired, previouslyHidden, draft] = await db.insert(postsTable).values([
      { ...offerData, userId: individual.id, status: "active" },
      { ...offerData, userId: individual.id, status: "active", expiresAt: new Date(0) },
      { ...offerData, userId: individual.id, status: "hidden" },
      { ...offerData, status: "pending", draftToken: "test-retired-draft" },
    ]).returning();
    const statuses = async () => new Map((await db.select().from(postsTable)).map((post) => [post.id, post.status]));
    const before = await statuses();
    assert.match(await maintenance("retire-individual-offers"), /Would hide individual offers: 2/);
    assert.deepEqual(await statuses(), before);
    assert.match(await maintenance("retire-individual-offers", "--apply"), /Hid individual offers: 2/);
    const changed = await statuses();
    assert.equal(changed.get(live.id), "hidden");
    assert.equal(changed.get(expired.id), "hidden");
    assert.equal(changed.get(draft.id), "removed");
    const [removedDraft] = await db.select().from(postsTable).where(eq(postsTable.id, draft.id));
    assert.equal(removedDraft.draftToken, draft.draftToken);
    assert.match(await maintenance("retire-individual-offers", "--apply"), /Hid individual offers: 0/);
    assert.match(await maintenance("retire-individual-offers", "--rollback"), /Restored active offers: 1/);
    const restored = await statuses();
    assert.equal(restored.get(live.id), "active");
    assert.equal(restored.get(expired.id), "hidden");
    assert.equal(restored.get(draft.id), "pending");
    assert.equal(restored.get(previouslyHidden.id), "hidden");
    const [ngoOffer] = await db.select().from(postsTable).where(eq(postsTable.userId, ngoUser.id));
    assert.equal(restored.get(ngoOffer.id), "active");
    const audit = (await db.select().from(adminActionsTable)).filter(({ note }) => note?.startsWith("release-a:retire-individual-offers"));
    assert.deepEqual(audit.filter(({ targetId }) => targetId === live.id).map(({ action }) => action), ["status:hidden", "status:active"]);
    assert.equal(audit.filter(({ note }) => note === "release-a:retire-individual-offers").length, 4);
  });
});

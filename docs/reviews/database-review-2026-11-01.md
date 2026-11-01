# Database review — 1 November 2026

Remediation update: the TLS portion of DB-01 has since been implemented and verified
with a read-only TLS 1.3 connection and server-certificate validation. The connection
still uses `postgres`; runtime-role restrictions and the other findings remain open.
See the [current checkpoint](D:/Maakon/docs/reviews/code-review-progress.md).
The evidence and live counts below describe the original audit snapshot.

The database has the core entities needed for the current application, but it is **not ready for production approval**. The most serious problems are a connection without TLS, exposure of non-public posts, bypassable moderation, and disclosure of MFA secrets through profile responses. The live tables and the Drizzle model agree on columns and nullability; that agreement does not establish that the application handles data safely.

This is the database phase of the requested code review. It includes every database schema file, connection/configuration code, migration/seed/synchronization scripts, API database operations, and the corresponding frontend data flows. It is not a claim that every frontend line or every page's UI has been audited. The accompanying inventory records the remaining work.

## Evidence and limits

- Inspected the configured Supabase PostgreSQL database using `BEGIN READ ONLY`; inspected catalogs and aggregate counts, and tested read visibility under `anon` and `authenticated` roles.
- Database version: PostgreSQL 17.6. Connection role: `postgres`, with `BYPASSRLS`. Client TLS: **false**, checked on the client's connection stream, separately from backend SSL metadata.
- Saved the catalog, policies, constraints, indexes, and aggregate checks in [database-catalog-2026-11-01.json](D:/Maakon/docs/reviews/database-catalog-2026-11-01.json). No credentials, session tokens, MFA secrets, contact details, or individual user records were included.
- Compared all eight Drizzle tables with live column names and nullability: no discrepancies. Reviewed the live enum values, foreign keys, unique constraints, and indexes separately. `waitlist` is an additional live table outside the Drizzle model.
- The root `pnpm.cmd run typecheck` passed for the libraries, web app, API, and scripts present when it ran.
- Local handler probes with synthetic data reproduced the public-list bypass, unrestricted owner reactivation, profile-secret serialization, validation mismatches, and report partial-write behavior. A control probe confirmed that the default public-list query does apply active/expiry filters. These are handler-level reproductions with a stubbed database, not end-to-end production requests. Results: [database-behavior-results.json](D:/Maakon/docs/reviews/database-behavior-results.json).
- No live data, schema, permissions, or application source was changed. No migrations or seed scripts were executed.
- During the review, the `artifacts/waitlist` directory was removed in the working tree by separate activity. Its prior database integration was checked through the tracked version; its removal was preserved. Existing changes to `.env.example`, `MapPage.tsx`, and image assets were also preserved.

## Live database snapshot

| Table | Rows | Assessment |
| --- | ---: | --- |
| `users` | 6 | Core identity/profile fields present; response secrecy and auth lifecycle need fixes. |
| `posts` | 1 | Core need/offer fields present; visibility, moderation, deletion, and validation need fixes. |
| `ngos` | 0 | Missing one-profile-per-user constraint; verification workflow is inconsistent. |
| `reports` | 0 | Cannot identify/deduplicate reporters; count writes are not atomic. |
| `sessions` | 24 | 21 were expired; raw bearer tokens are stored. |
| `admin_actions` | 0 | Structure exists; most administrative mutations do not write an audit event. |
| `ngo_verification_requests` | 0 | Structure exists but no application route writes or reviews it. |
| `feedbacks` | 1 | Basic storage works; workflow and validation are minimal. |
| `waitlist` | 4 | Live table remains outside the checked-in Drizzle model. |

All nine public tables have RLS enabled. There is one public policy: an unrestricted `INSERT` policy on `waitlist`. The other eight tables have no row policies. Anonymous reads returned zero users, posts, sessions, and waitlist rows. The authenticated role without JWT claims also saw zero users, posts, and sessions. Because there are no policies on those eight tables, normal role access is denied; the API's `postgres` connection bypasses that protection. Enabled RLS is therefore not a substitute for the API's authorization rules. [PostgreSQL RLS documentation](https://www.postgresql.org/docs/17/ddl-rowsecurity.html)

At the snapshot, no report-count mismatches, duplicate NGO owner groups, duplicate draft-token groups, orphaned Supabase identities among linked application users, overdue active posts, or vulnerable need posts with stored exact coordinates were found. The NGO and report checks covered empty tables. With one post, this is a consistency snapshot, not evidence of load capacity or historical correctness.

## Findings

P1 means resolve before production approval. P2 means a functional or integrity gap that should be addressed in the database hardening work. Findings derived from code are distinguished from observed live data.

### DB-01 · P1 · The configured database connection has no TLS and uses an RLS-bypassing owner role

**Evidence:** [connection pool](D:/Maakon/lib/db/src/index.ts:13); live `clientTls=false`, `current_user=postgres`, and `rolbypassrls=true`. All public tables are owned by `postgres`.

**Impact:** Traffic on the audited client-to-pooler connection is unencrypted. The API connection can bypass table RLS, so mistakes such as DB-02 are not contained by those policies. This observation applies to the checked local configuration; the deployed API's environment was not independently inspected.

**Fix:** Require TLS with certificate verification for remote connections and provision a dedicated runtime role with explicit necessary privileges. Keep schema-owner credentials for migrations. Design grants/policies to match this server-session architecture: its database queries do not currently carry each user's Supabase JWT identity. Simply enabling owner enforcement or switching roles without an access design could break all queries. [node-postgres TLS configuration](https://node-postgres.com/features/ssl)

### DB-02 · P1 · A public query parameter exposes hidden, removed, and unclaimed draft content

**Evidence:** [public listing filters](D:/Maakon/artifacts/api-server/src/routes/posts.ts:135), [boolean parsing](D:/Maakon/lib/api-zod/src/generated/api.ts:29), [map toggle](D:/Maakon/artifacts/maakon-web/src/pages/MapPage.tsx:754).

**Reproduction:** `GET /api/posts?activeOnly=false` parses successfully and omits both status and expiry restrictions. The synthetic handler probe returned a hidden post and its `contactInfo`. Pending drafts, removed posts, and other statuses are eligible for the same query. Private coordinate/address fields and draft tokens are excluded by the public serializer, but titles, descriptions, and contact details are still exposed.

**Fix:** Apply an unconditional public-visibility rule. If expired/resolved public history is a desired feature, define the allowed public statuses explicitly. Keep drafts and moderation-hidden/removed content restricted to authorized owners/admins.

### DB-03 · P1 · Owners can undo moderation by reactivating their posts

**Evidence:** [owner update](D:/Maakon/artifacts/api-server/src/routes/posts.ts:313), [accepted status values](D:/Maakon/lib/api-zod/src/generated/api.ts:258), [owner status action](D:/Maakon/artifacts/maakon-web/src/pages/MyPosts.tsx:119).

**Reproduction:** The handler accepts `{ "status": "active" }` and updates using only post ID and owner ID. It does not exclude an admin-removed or admin-hidden current state. The synthetic probe confirmed the generated predicate has no current-status condition.

**Fix:** Specify allowed state transitions and enforce them atomically in the update predicate. Distinguish an owner's voluntary hiding from moderation hiding, using separate moderation state or an explicit moderation lock. Preserve moderator decisions until an authorized review reverses them.

### DB-04 · P1 · Profile completion returns stored MFA secrets

**Evidence:** [individual profile response](D:/Maakon/artifacts/api-server/src/routes/auth.ts:382), [NGO profile response](D:/Maakon/artifacts/api-server/src/routes/auth.ts:436), [MFA secret storage](D:/Maakon/lib/db/src/schema/users.ts:37).

**Reproduction:** Both responses serialize the full row returned by the user update. A synthetic individual-profile request returned `mfaSecret` and `supabaseUid`. The endpoint requires ordinary authentication, which is also available to an admin session before MFA verification. An attacker holding such a session could obtain the secret and generate MFA codes.

**Fix:** Use an explicit safe user-response serializer everywhere, including onboarding responses. Never return the stored MFA secret through profile endpoints. Protect the TOTP secret at rest with application-level encryption and key separation; verify whether any real secret was exposed before deciding on rotation.

### DB-05 · P1 · Database setup and security cannot be reproduced from versioned migrations

**Evidence:** [Drizzle configuration](D:/Maakon/lib/db/drizzle.config.ts:8), [database package scripts](D:/Maakon/lib/db/package.json:11), [migration script](D:/Maakon/scripts/src/migrate.ts:13), [deployment configuration](D:/Maakon/render.yaml:5).

**Observed:** The repository relies on `drizzle-kit push` plus an idempotent script containing only two enum additions and one NGO column addition. It has no checked-in baseline/versioned migration history for all tables, grants, RLS policies, or the live `rls_auto_enable` function. The live Supabase migration table lists five changes, including waitlist and MFA changes, whose SQL is not present here. The live `waitlist` table is not modeled in Drizzle.

**Impact:** A fresh environment or recovery can produce different structures/security from the existing database. The deployment configuration does not run a controlled migration step. The small migration script alone cannot initialize an empty database.

**Fix:** Capture a reviewed baseline, reconcile existing environments without recreating live data, and check in ordered migrations for schema and security. Separate migration credentials from runtime credentials. Verify fresh installation and upgrades on a disposable database. Include or explicitly retire the waitlist schema rather than leaving ownership ambiguous.

### DB-06 · P2 · Deleting a reported post fails its foreign key

**Evidence:** [report foreign key](D:/Maakon/lib/db/src/schema/reports.ts:11), [owner delete](D:/Maakon/artifacts/api-server/src/routes/posts.ts:348). The live foreign key is `FOREIGN KEY (post_id) REFERENCES posts(id)` with no delete action.

**Failure path:** Once any report references a post, the owner endpoint attempts to hard-delete only the post. PostgreSQL rejects that deletion; the user receives a server error. This was established from the live constraint and code, without deleting a real row.

**Fix:** Choose a retention policy. Soft deletion is suitable if reports must remain available as moderation evidence. If hard deletion is required, explicitly handle dependent reports in a transaction or a reviewed cascading relationship. PostgreSQL defaults to `NO ACTION` when no foreign-key deletion action is specified. [Foreign-key behavior](https://www.postgresql.org/docs/17/ddl-constraints.html#DDL-CONSTRAINTS-FK)

### DB-07 · P2 · Related writes and identity deletion can leave partial results

**Evidence:** [report insert/counter update](D:/Maakon/artifacts/api-server/src/routes/reports.ts:54), [NGO onboarding](D:/Maakon/artifacts/api-server/src/routes/auth.ts:417), [user deletion](D:/Maakon/artifacts/api-server/src/routes/admin.ts:339), [moderation update/audit](D:/Maakon/artifacts/api-server/src/routes/admin.ts:225), [NGO verification propagation](D:/Maakon/artifacts/api-server/src/routes/admin.ts:538).

**Failure paths:** Report insertion can succeed while the counter update fails; the synthetic fault probe reproduced that sequencing. NGO creation can succeed while user onboarding fails, after which retries are rejected as an existing NGO. User deletion removes reports/posts/actions/user in separate statements; a later failure leaves earlier deletions committed. Supabase Auth deletion errors are only logged, so the endpoint can report success while the auth identity remains and can register a new application user on its next login.

**Fix:** Wrap each related set of PostgreSQL writes in one transaction. Use a durable deletion/retry or tombstone workflow for Supabase Auth, which cannot join the PostgreSQL transaction. Make retries idempotent and block re-registration while deletion is pending. Use transactional writes for verification, MFA setup completion, and audit events as appropriate. The existing transaction in authenticated post creation is a useful starting pattern.

### DB-08 · P2 · NGO ownership and verification do not have a consistent source of truth

**Evidence:** [NGO owner column](D:/Maakon/lib/db/src/schema/ngos.ts:8), [verification request table](D:/Maakon/lib/db/src/schema/ngo_verification_requests.ts:18), [onboarding writes](D:/Maakon/artifacts/api-server/src/routes/auth.ts:417), [verification/unverification](D:/Maakon/artifacts/api-server/src/routes/admin.ts:538), [NGO deletion](D:/Maakon/artifacts/api-server/src/routes/admin.ts:515), [creation and join](D:/Maakon/artifacts/api-server/src/routes/posts.ts:213).

**Gaps:**

- `ngos.user_id` is neither unique nor indexed. Check-then-insert onboarding and auto-creation can produce multiple NGOs for the same user under concurrency. Joining posts to NGOs by user ID then duplicates posts and distorts pagination.
- Onboarding says a verification request was submitted but never inserts `ngo_verification_requests`; no route reviews those records.
- Admin verification updates `ngos.verified_at` and post badges but never updates `users.ngo_verification_status`. Those values can disagree permanently.
- Hiding/deleting an NGO does not clear its posts' verification badges; new authenticated posts check `verifiedAt` without checking NGO operational status.
- Draft claiming activates an NGO-typed post without the NGO creation/verification logic used by authenticated post creation.

**Fix:** If one account represents one NGO, enforce unique non-null `ngos.user_id` and use an idempotent insert/upsert. Either wire up the verification request lifecycle with reviewer/time/outcome or remove the unused parallel model. Derive current verification from one authoritative record or synchronize cached badges transactionally across every relevant transition. Consider an explicit `posts.ngo_id` if a post must retain a specific organization relationship.

### DB-09 · P2 · Reports lose the reporter's identity and cannot enforce one report per person

**Evidence:** [report schema](D:/Maakon/lib/db/src/schema/reports.ts:9), [authenticated report submission](D:/Maakon/artifacts/api-server/src/routes/reports.ts:17).

Authentication is required, but its user ID is not saved. The same user can repeatedly report one post, inflate `report_count`, and create indistinguishable reports. IP rate limits do not establish uniqueness. The counter is also maintained separately from report insertion, as covered by DB-07.

**Fix:** Save an appropriate reporter identifier and define a duplicate-report rule enforced by a unique constraint. Define whether the displayed count means all reports, unresolved reports, or distinct reporters. Then derive it consistently or maintain it in the same transaction. Decide explicitly what happens to reporter identity when an account is deleted.

### DB-10 · P2 · Domain constraints and API validation permit invalid stored data

**Evidence:** [post schema](D:/Maakon/lib/db/src/schema/posts.ts:14), [NGO status](D:/Maakon/lib/db/src/schema/ngos.ts:18), [API create validation](D:/Maakon/lib/api-zod/src/generated/api.ts:97), [draft validation](D:/Maakon/lib/api-zod/src/auth.ts:32), [shared domain values](D:/Maakon/lib/locations/src/index.ts:13).

The live schema has no CHECK constraints. Category/provider/contact/badge values are unrestricted text; public API validation accepts unknown category/provider/contact values. Latitude/longitude ranges and paired coordinates, nonnegative report counts, useful text bounds, and timestamp relationships lack database checks. The authenticated and draft payloads enforce different text limits. IDs and pagination numbers lack integer/positive bounds in several generated validators.

**Fix:** Put stable finite domains in database enums/CHECK constraints or lookup tables and reuse the definitions in API validation. Validate coordinate pairs and finite ranges, text lengths/nonblank content, counters, timestamps, integer identifiers, and pagination. Clean existing records before adding constraints. Keep governorate/district relationships consistent with the shared location model; current runtime validation is helpful but is not a database guarantee.

### DB-11 · P2 · Session/secret storage and retention need hardening

**Evidence:** [session token column](D:/Maakon/lib/db/src/schema/sessions.ts:15), [session creation](D:/Maakon/artifacts/api-server/src/lib/session.ts:37), [expiry handling](D:/Maakon/artifacts/api-server/src/lib/session.ts:73), [draft token column](D:/Maakon/lib/db/src/schema/posts.ts:43), [draft claiming](D:/Maakon/artifacts/api-server/src/routes/auth.ts:149).

Session cookies have appropriate HTTP-only and production-secure settings, and generated tokens have strong randomness. However, the database stores the bearer tokens themselves. A read of that table exposes reusable sessions. Expired sessions are removed only when presented again; **21 of 24 stored sessions were expired** at the snapshot. Draft tokens are also stored directly, are not unique/indexed, and claiming checks neither ownership-nullness nor expiry.

**Fix:** Store a cryptographic digest of high-entropy session/draft tokens; retain raw values only in the client handoff. Add expiry indexes and scheduled bounded cleanup. Enforce unique draft-token digests and atomic claim conditions covering unowned, pending, and unexpired records. Add an explicit draft retention policy. Protect MFA secrets as described in DB-04.

### DB-12 · P2 · Administrative history is incomplete and can disappear

**Evidence:** [audit table](D:/Maakon/lib/db/src/schema/admin_actions.ts:6), [post moderation audit](D:/Maakon/artifacts/api-server/src/routes/admin.ts:236), [account deletion removes actions](D:/Maakon/artifacts/api-server/src/routes/admin.ts:354).

Only post status changes write `admin_actions`. Report decisions, NGO create/edit/delete/verify/unverify, user deletion, and cleanup do not. Existing audit rows do not store before/after state or a durable actor snapshot; deletion code deletes actions authored by a removed user. The live table was empty, so historical completeness cannot be established.

**Fix:** Define mandatory audit events and write them atomically with each mutation. Preserve actor attribution when identities are removed, and retain enough before/after information to explain what changed. Grant the runtime only the audit permissions it needs; ordinary code should not rewrite or erase history.

### DB-13 · P2 · Indexes and bounded reads are insufficient for growth

**Evidence:** Live catalog contains only primary-key and unique-constraint indexes; no workload/FK indexes. [public feed](D:/Maakon/artifacts/api-server/src/routes/posts.ts:141), [owner feed](D:/Maakon/artifacts/api-server/src/routes/posts.ts:279), [NGO listing](D:/Maakon/artifacts/api-server/src/routes/ngos.ts:44), [admin listing](D:/Maakon/artifacts/api-server/src/routes/admin.ts:202), [map request](D:/Maakon/artifacts/maakon-web/src/pages/MapPage.tsx:278).

**Implications:** Public filtering/sorting, owner post lookup, report joins, and session cleanup lack supporting indexes beyond primary keys. Admin/owner/NGO reads are unbounded, with NGO governorate filtering performed after loading all active NGOs. The map requests a single default page of 20 posts and has no pagination loop, so additional matching posts are omitted from the displayed result. No load benchmark was run; the current one-post dataset cannot validate scale.

**Fix candidates:** Validate representative query plans before choosing final indexes. Start with owner/date and active-feed/date indexes on posts, report post/status/date indexes, NGO owner uniqueness and status/location indexes, and session user/expiry indexes. Add deterministic ordering with an ID tie-breaker and explicit pagination/viewport loading. Bound administrative lists too. PostgreSQL does not automatically index the referencing side of a foreign key. [Indexing and foreign keys](https://www.postgresql.org/docs/17/ddl-constraints.html#DDL-CONSTRAINTS-FK)

### DB-14 · P2 · The API contract and onboarding forms disagree with stored data rules

**Evidence:** [OpenAPI post statuses](D:/Maakon/lib/api-spec/openapi.yaml:352), [generated response validator](D:/Maakon/lib/api-zod/src/generated/api.ts:167), [NGO form defaults](D:/Maakon/artifacts/maakon-web/src/components/auth/NgoProfileStep.tsx:43), [server phone validation](D:/Maakon/lib/api-zod/src/auth.ts:25).

The database and UI use `hidden` and `resolved`, but response contracts omit them; `/posts/me` and updates can return values the generated types/validators reject. The NGO form sends an optional phone as an empty string, while the server's optional phone regex rejects an empty string. The synthetic schema probe confirmed the latter mismatch.

**Fix:** Update the OpenAPI source and regenerate clients/validators so all legitimate statuses are represented. Normalize blank optional inputs to absent values and share validation conventions between the form and API. Fix source contracts rather than editing generated output.

## Is the model sufficient for the existing pages?

| Route | Data requirements traced | Database assessment |
| --- | --- | --- |
| `/` | Authentication and navigation | No additional page-specific table indicated by the API-reference scan. |
| `/map` | Public posts, NGOs, metadata, report submission | Existing tables cover the feature; visibility, completeness beyond 20 posts, verification, and reporting need fixes. |
| `/need/new` | Need/draft creation and post-auth claim | Core fields exist. NGO volunteer count/contact person/notes are packed into free text, limiting later filtering or matching. |
| `/offer/new` | Offer/draft creation and location/contact fields | Core fields exist; draft/authenticated behavior and backend validation need consistency. |
| `/my-posts` | Owner/private post list, edit, hide, resolve, delete | Core fields exist; moderation state and deletion policy need correction. |
| `/auth/callback` and onboarding | Auth identity, application user, session, optional draft and NGO | Core entities exist; secret serialization, transactional onboarding, and NGO verification are incomplete. |
| `/admin` | Moderation, reports, users, NGOs, statistics, cleanup | Core entities exist; audit, state transitions, deletion, and verification are incomplete. |
| `/contact` | Feedback submission | Basic storage exists. No feedback review/status/resolution workflow is implemented; add one if the admin must manage feedback in-app. |
| `/about`, `/faq`, `/support`, fallback | Static content and navigation | No additional page-specific table indicated by the API-reference scan. Full page/content review remains pending. |
| Prior waitlist app | Anonymous signup | Live table and public insert policy exist; app directory is currently removed in the working tree. Decide how to retain or retire its four records. |

Structured volunteer requirements, quantity/capacity, matching, assignments, messaging, fulfillment history, multi-member organizations, and uploaded verification documents are **not** modeled. They are scope decisions, not automatic requirements for today's posting/directory app. The current volunteer form serializes fields into a description/contact string; add typed fields if those values must be searched, counted, or acted on later.

## Recommended remediation order

1. Fix DB-02, DB-03, and DB-04, and require verified TLS for remote database access.
2. Define and implement post/account deletion, NGO verification, report uniqueness, and transactional write rules.
3. Establish a reproducible migration baseline, runtime database role, explicit grants/policies, and reviewable schema/security upgrades.
4. Add constraints, token protection/retention, audit coverage, and workload indexes; repair API contracts and form normalization.
5. Validate on a disposable database: fresh install, upgrade from a copy, RLS/role matrix, forbidden reads, moderation transitions, reported-post deletion, concurrent signup/onboarding/reporting, fault rollback, and representative query plans.
6. Verify hosted backup retention, point-in-time recovery availability, and a restore drill. These provider/account settings cannot be established from this repository or these SQL checks. Also verify the deployed API's connection/TLS settings and runtime role separately.

No new database engine is indicated. PostgreSQL and Drizzle are suitable for the current feature set. The immediate work is to make access, state transitions, integrity, migrations, and operations reliable.

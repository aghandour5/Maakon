import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq } from "drizzle-orm";
import { generateDrizzleJson, generateMigration } from "drizzle-kit/api";
import * as schema from "../src/schema";
import { assertRuntimeDatabaseRole } from "../src/runtime-role";

const testUrl = process.env.MAAKON_ROLE_TEST_DATABASE_URL;

test(
  "runtime permissions against disposable PostgreSQL",
  { skip: !testUrl },
  async (t) => {
    let url: URL;
    try {
      url = new URL(testUrl!);
    } catch {
      throw new Error("Use a valid loopback test URL; credentials omitted.");
    }
    assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(url.hostname));
    assert.equal(
      url.username,
      "db02_test_owner",
      "Use a dedicated test cluster owner",
    );
    assert.equal(url.pathname, "/postgres");
    assert.equal(url.search, "", "Test URL overrides are not permitted");

    const root = new pg.Client({
      connectionString: testUrl,
      connectionTimeoutMillis: 5000,
    });
    await root.connect();
    try {
      assert.equal(
        (await root.query("SELECT current_user AS name")).rows[0].name,
        "db02_test_owner",
      );
      const existing = await root.query(
        "SELECT rolname FROM pg_roles WHERE rolname IN ('maakon_api','db02_schema_owner','anon','authenticated')",
      );
      assert.equal(
        existing.rowCount,
        0,
        "Refuse to reuse or modify existing roles",
      );
    } catch (error) {
      await root.end();
      throw error;
    }

    const database = `maakon_role_test_${randomBytes(6).toString("hex")}`;
    let databaseCreated = false;
    let owner: pg.Client | undefined;
    let runtime: pg.Client | undefined;
    let ownerPool: pg.Pool | undefined;
    let runtimePool: pg.Pool | undefined;
    try {
      // Match Supabase's schema owner: CREATEROLE/CREATEDB/BYPASSRLS, not superuser.
      await root.query(
        "CREATE ROLE db02_schema_owner LOGIN CREATEROLE CREATEDB BYPASSRLS NOSUPERUSER",
      );
      await root.query(
        "CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN",
      );
      await root.query("GRANT anon, authenticated TO db02_schema_owner");
      await root.query(`CREATE DATABASE ${database} OWNER db02_schema_owner`);
      databaseCreated = true;
      const ownerUrl = new URL(testUrl!);
      ownerUrl.username = "db02_schema_owner";
      ownerUrl.pathname = `/${database}`;
      owner = new pg.Client({ connectionString: ownerUrl.toString() });
      await owner.connect();
      ownerPool = new pg.Pool({
        connectionString: ownerUrl.toString(),
        max: 1,
      });

      const statements = await generateMigration(
        generateDrizzleJson({}),
        generateDrizzleJson(schema),
      );
      for (const sql of statements) await owner.query(sql);
      for (const table of [
        "users",
        "posts",
        "ngos",
        "reports",
        "sessions",
        "admin_actions",
        "feedbacks",
        "ngo_verification_requests",
      ]) {
        await owner.query(
          `ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`,
        );
      }
      await owner.query(`
      CREATE SCHEMA auth;
      CREATE TABLE auth.users (id text PRIMARY KEY);
      CREATE TABLE public.waitlist (id serial PRIMARY KEY, email text NOT NULL);
      ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
      CREATE POLICY waitlist_insert ON public.waitlist FOR INSERT TO PUBLIC WITH CHECK (true);
      GRANT USAGE ON SCHEMA public TO anon, authenticated;
      GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;
    `);
      const configuration = await readFile(
        new URL("../sql/runtime-role.sql", import.meta.url),
        "utf8",
      );
      const apply = async () => {
        try {
          await owner!.query(configuration);
        } catch (error) {
          await owner!.query("ROLLBACK");
          throw error;
        }
      };

      await t.test(
        "unsafe PUBLIC schema privileges abort without creating a role",
        async () => {
          await owner!.query("GRANT CREATE ON SCHEMA public TO PUBLIC");
          await assert.rejects(
            apply,
            /Inherited database\/schema CREATE privileges/,
          );
          assert.equal(
            (
              await owner!.query(
                "SELECT 1 FROM pg_roles WHERE rolname='maakon_api'",
              )
            ).rowCount,
            0,
          );
          await owner!.query("REVOKE CREATE ON SCHEMA public FROM PUBLIC");
        },
      );

      await t.test(
        "non-superuser schema owner can configure a restricted NOLOGIN role",
        async () => {
          await apply();
          const row = (
            await owner!.query(
              "SELECT rolcanlogin,rolsuper,rolinherit,rolcreatedb,rolcreaterole,rolreplication,rolbypassrls FROM pg_roles WHERE rolname='maakon_api'",
            )
          ).rows[0];
          assert.deepEqual(Object.values(row), [
            false,
            false,
            false,
            false,
            false,
            false,
            false,
          ]);
        },
      );

      // Activation is test-only. Production configuration intentionally does not do this.
      await owner.query(
        "ALTER ROLE maakon_api LOGIN PASSWORD 'synthetic-test-only-password'",
      );
      const runtimeUrl = new URL(ownerUrl);
      runtimeUrl.username = "maakon_api";
      runtimeUrl.password = "synthetic-test-only-password";
      runtime = new pg.Client({ connectionString: runtimeUrl.toString() });
      await runtime.connect();
      runtimePool = new pg.Pool({
        connectionString: runtimeUrl.toString(),
        max: 1,
      });
      const db = drizzle(runtime, { schema });
      let userId: number;
      let postId: number;

      await t.test(
        "runtime guard accepts the API login and rejects the owner",
        async () => {
          await assertRuntimeDatabaseRole(runtimePool!);
          await assert.rejects(
            () => assertRuntimeDatabaseRole(ownerPool!),
            /non-owner database role/,
          );
        },
      );

      await t.test(
        "login, session lookup, and post creation work under RLS",
        async () => {
          const [user] = await db
            .insert(schema.usersTable)
            .values({
              email: "runtime@example.test",
              supabaseUid: "synthetic-runtime-user",
            })
            .returning();
          userId = user.id;
          await db.insert(schema.sessionsTable).values({
            userId,
            token: "synthetic-session",
            expiresAt: new Date(Date.now() + 60000),
          });
          const sessions = await db
            .select({ id: schema.usersTable.id })
            .from(schema.sessionsTable)
            .innerJoin(
              schema.usersTable,
              eq(schema.usersTable.id, schema.sessionsTable.userId),
            );
          assert.equal(sessions[0].id, userId);
          const [post] = await db.transaction(async (tx) =>
            tx
              .insert(schema.postsTable)
              .values({
                userId,
                postType: "need",
                title: "Role test",
                description: "Synthetic test post",
                category: "food",
                governorate: "Beirut",
                status: "active",
              })
              .returning(),
          );
          postId = post.id;
          assert.equal(
            (await db.select().from(schema.postsTable))[0].id,
            postId,
          );
        },
      );

      await t.test(
        "NGOs, reports, moderation updates, and audit writes work",
        async () => {
          await db
            .insert(schema.ngosTable)
            .values({ userId, name: "Synthetic NGO", governorate: "Beirut" });
          const [report] = await db
            .insert(schema.reportsTable)
            .values({ postId, reason: "spam" })
            .returning();
          await db
            .update(schema.reportsTable)
            .set({ status: "reviewed" })
            .where(eq(schema.reportsTable.id, report.id));
          await db
            .update(schema.postsTable)
            .set({ status: "hidden" })
            .where(eq(schema.postsTable.id, postId));
          const [action] = await db
            .insert(schema.adminActionsTable)
            .values({
              adminId: userId,
              targetType: "post",
              targetId: postId,
              action: "status:hidden",
            })
            .returning();
          assert.equal(action.adminId, userId);
          await db
            .delete(schema.adminActionsTable)
            .where(eq(schema.adminActionsTable.id, action.id));
          await db
            .delete(schema.reportsTable)
            .where(eq(schema.reportsTable.id, report.id));
        },
      );

      await t.test("feedback is insert-only", async () => {
        await db
          .insert(schema.feedbacksTable)
          .values({ type: "general", message: "Synthetic feedback" });
        for (const sql of [
          "SELECT * FROM feedbacks",
          "UPDATE feedbacks SET message='changed'",
          "DELETE FROM feedbacks",
        ]) {
          await assert.rejects(() => runtime!.query(sql), { code: "42501" });
        }
      });

      await t.test(
        "referential cleanup works without access to unused verification requests",
        async () => {
          await owner!.query(
            "INSERT INTO ngo_verification_requests (user_id,org_name) VALUES ($1,'Synthetic NGO')",
            [userId],
          );
          await db
            .delete(schema.postsTable)
            .where(eq(schema.postsTable.id, postId));
          await db
            .delete(schema.usersTable)
            .where(eq(schema.usersTable.id, userId));
          assert.equal(
            (
              await owner!.query(
                "SELECT count(*)::int AS n FROM ngo_verification_requests",
              )
            ).rows[0].n,
            0,
          );
          assert.equal(
            (await owner!.query("SELECT count(*)::int AS n FROM sessions"))
              .rows[0].n,
            0,
          );
        },
      );

      for (const [label, sql] of [
        [
          "persistent table creation",
          "CREATE TABLE public.forbidden_table (id int)",
        ],
        ["schema creation", "CREATE SCHEMA forbidden_schema"],
        [
          "schema alterations",
          "ALTER TABLE users ADD COLUMN forbidden_column int",
        ],
        ["table deletion", "DROP TABLE feedbacks"],
        ["truncate", "TRUNCATE feedbacks"],
        ["role creation", "CREATE ROLE forbidden_role"],
        ["owner role switching", "SET ROLE db02_schema_owner"],
        ["audit rewriting", "UPDATE admin_actions SET action='forged'"],
        ["sequence resets", "SELECT setval('users_id_seq',99999)"],
        ["unused verification data", "SELECT * FROM ngo_verification_requests"],
        ["Supabase auth data", "SELECT * FROM auth.users"],
        ["unrelated waitlist reads", "SELECT * FROM waitlist"],
        [
          "unrelated waitlist inserts",
          "INSERT INTO waitlist (email) VALUES ('forbidden@example.test')",
        ],
      ]) {
        await t.test(`denies ${label}`, async () => {
          await assert.rejects(() => runtime!.query(sql), { code: "42501" });
        });
      }

      await t.test(
        "anonymous and authenticated browser roles gain no access",
        async () => {
          await owner!.query(
            "INSERT INTO users (email) VALUES ('private@example.test')",
          );
          for (const role of ["anon", "authenticated"]) {
            await owner!.query(`SET ROLE ${role}`);
            try {
              assert.equal(
                (await owner!.query("SELECT * FROM users")).rowCount,
                0,
              );
            } finally {
              await owner!.query("RESET ROLE");
            }
          }
        },
      );

      await t.test(
        "reapplying permissions preserves activation and unrelated policies",
        async () => {
          await apply();
          assert.equal(
            (
              await owner!.query(
                "SELECT rolcanlogin FROM pg_roles WHERE rolname='maakon_api'",
              )
            ).rows[0].rolcanlogin,
            true,
          );
          assert.equal(
            (
              await owner!.query(
                "SELECT 1 FROM pg_policies WHERE tablename='waitlist' AND policyname='waitlist_insert'",
              )
            ).rowCount,
            1,
          );
          assert.equal(
            (await runtime!.query("SELECT current_user AS name")).rows[0].name,
            "maakon_api",
          );
          await assertRuntimeDatabaseRole(runtimePool!);
        },
      );

      await t.test(
        "the maintenance CLI uses only its explicit admin connection",
        async () => {
          const workspace = fileURLToPath(
            new URL("../../../", import.meta.url),
          );
          const run = promisify(execFile);
          const args = [
            "--import=./scripts/node_modules/tsx/dist/loader.mjs",
            "./scripts/src/configure-runtime-role.ts",
          ];
          const environment: NodeJS.ProcessEnv = {
            ...process.env,
            DATABASE_ADMIN_URL: ownerUrl.toString(),
          };
          const { stdout } = await run(process.execPath, args, {
            cwd: workspace,
            env: environment,
            timeout: 10000,
          });
          assert.deepEqual(JSON.parse(stdout), {
            role: "maakon_api",
            permissionsConfigured: true,
            loginEnabled: true,
            passwordChanged: false,
          });
          delete environment.DATABASE_ADMIN_URL;
          environment.DATABASE_URL = ownerUrl.toString();
          await assert.rejects(
            () =>
              run(process.execPath, args, {
                cwd: workspace,
                env: environment,
                timeout: 10000,
              }),
            (error: unknown) => {
              assert.ok(
                typeof error === "object" &&
                  error !== null &&
                  "stderr" in error,
              );
              assert.match(
                String(error.stderr),
                /DATABASE_ADMIN_URL must be set/,
              );
              return true;
            },
          );
        },
      );

      await t.test(
        "production guard detects newly inherited PUBLIC privileges",
        async () => {
          await owner!.query("GRANT CREATE ON SCHEMA public TO PUBLIC");
          await assert.rejects(
            () => assertRuntimeDatabaseRole(runtimePool!),
            /non-owner database role/,
          );
          await owner!.query("REVOKE CREATE ON SCHEMA public FROM PUBLIC");
        },
      );
    } finally {
      await runtime?.end();
      await runtimePool?.end();
      await owner?.end();
      await ownerPool?.end();
      if (databaseCreated)
        await root.query(`DROP DATABASE ${database} WITH (FORCE)`);
      for (const role of [
        "maakon_api",
        "db02_schema_owner",
        "anon",
        "authenticated",
      ]) {
        await root.query(`DROP ROLE IF EXISTS ${role}`);
      }
      await root.end();
    }
  },
);

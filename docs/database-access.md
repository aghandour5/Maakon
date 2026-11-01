# Database connections and runtime role

The Express API uses `DATABASE_URL`. Schema changes and maintenance scripts use
`DATABASE_ADMIN_URL` through `@workspace/db/admin`. There is no fallback between
the two. Keep the owner URL in `lib/db/.env` or a maintenance job's secret store;
do not provide it to the API process. Remote URLs retain the verified-TLS policy
and need a trusted CA path where the provider uses a private CA.

In production, the API checks the connected role before listening for requests.
An owner, administrative role, role member, or login that can create objects in
the public schema is rejected. Local development remains usable before a role
has been provisioned; use the restricted login there too once it is available.

## Runtime privileges

The API does not attach Supabase JWT claims to SQL sessions. Express middleware
and route conditions enforce individual ownership, administrator access, and
public visibility. The database role represents this trusted backend service,
not an individual browser user. Its RLS policies deliberately allow the rows
needed by that service. DB-02 and DB-03 still require route/state-transition fixes.

| Object | Runtime access |
| --- | --- |
| `users`, `posts`, `ngos`, `reports`, `sessions` | SELECT, INSERT, UPDATE, DELETE |
| `admin_actions` | SELECT, INSERT, DELETE; no UPDATE |
| `feedbacks` | INSERT only |
| The seven corresponding serial sequences | USAGE only; no sequence resets |
| `ngo_verification_requests`, `waitlist`, future tables | No grants |
| Supabase `auth` and `storage` schemas | No grants |
| Persistent schema changes, TRUNCATE, role management, RLS bypass | No grants or capabilities |

Audit deletion is retained because the current user-deletion route uses it.
DB-12 tracks the separate change to durable audit retention. Existing Supabase
Auth administrative HTTP calls still use their server-only service key; this
change restricts the direct PostgreSQL connection.

PostgreSQL normally grants temporary-table creation and CONNECT to PUBLIC.
This setup leaves those shared defaults unchanged. It does not grant CREATE on
the database or public schema, grant options, other role memberships, or default
access to future tables. Add new table access deliberately when features need it.

## Prepare and review the configuration

The versioned SQL is [runtime-role.sql](../lib/db/sql/runtime-role.sql). Run it
only after the application schema exists, using the schema owner. It configures
`maakon_api`, creates new roles as **NOLOGIN**, and neither sets a password nor
changes an existing login/password. It is transactional and can be reapplied.

From the repository root, with `DATABASE_ADMIN_URL` in `lib/db/.env`:

```powershell
node --env-file=lib/db/.env --import=./scripts/node_modules/tsx/dist/loader.mjs ./scripts/src/configure-runtime-role.ts
```

The SQL resets only this managed role's public-table and sequence grants. It
does not alter grants to anonymous/authenticated browser roles or drop their
policies. It refuses an unmanaged role with the same name, an elevated managed
role, role memberships, relation ownership, or inherited schema/database CREATE
privileges. Review such conflicts rather than removing shared permissions
automatically.

## Activate an environment

Treat these as a separate live rollout after reviewing and authorizing the SQL:

1. Apply the role configuration using the owner connection.
2. Assign a strong unique password through a secure administrator session and
   enable LOGIN. Do not commit or print the password.
3. Build a candidate runtime URL and verify its TLS connection, actual role,
   production role check, and necessary reads before changing application config.
4. Set only the API's `DATABASE_URL` to the runtime URL and restart the API, or
   configure it in the deployment's secret store before deployment. Keep the
   existing owner URL in the separate maintenance environment.

For Supabase's shared pooler, the username is `maakon_api.<project-ref>`; direct
connections use `maakon_api`. Keep the existing project, host, port, database,
and CA path. This username convention is documented in
[Supabase's connection guide](https://supabase.com/docs/guides/database/connecting-to-postgres).

If candidate validation fails, leave API credentials unchanged and disable the
new login while investigating. Do not automatically drop the role, alter other
roles, or change production policies to force a connection through. After an
application cutover, roll back code and credentials together: the new production
startup check intentionally refuses an owner login.

## Maintenance commands

The package scripts also work with an already exported `DATABASE_ADMIN_URL`.
These root-level commands explicitly load the local maintenance environment:

```powershell
pnpm --filter @workspace/db exec node --env-file=.env ./node_modules/drizzle-kit/bin.cjs push --config ./drizzle.config.ts
node --env-file=lib/db/.env --import=./scripts/node_modules/tsx/dist/loader.mjs ./scripts/src/migrate.ts
node --env-file=lib/db/.env --import=./scripts/node_modules/tsx/dist/loader.mjs ./scripts/src/seed.ts
node --env-file=lib/db/.env --import=./scripts/node_modules/tsx/dist/loader.mjs ./scripts/src/sync-ngos.ts
```

Seeding deletes existing application data. Use the seed command only on an
intended sample-data database; role configuration never runs it.

## Permission integration test

The test generates the application schema from Drizzle on an isolated local
PostgreSQL cluster, then uses a non-superuser schema owner to configure the role.
It checks allowed application DML, RLS behavior, denied administrative operations,
unchanged browser-role access, and safe reapplication. It drops its generated
test database and roles afterward.

Opt in only against a disposable cluster with a superuser named `db02_test_owner`
and no existing `maakon_api`, `db02_schema_owner`, `anon`, or `authenticated`
roles. The runner refuses non-loopback URLs, URL query overrides, and other
initial usernames/databases. The local verification used PostgreSQL 18;
the live server is PostgreSQL 17.6 and has not had the configuration applied.

```powershell
$env:MAAKON_ROLE_TEST_DATABASE_URL = 'postgresql://db02_test_owner@127.0.0.1:55437/postgres'
node --import=./scripts/node_modules/tsx/dist/loader.mjs --test ./lib/db/test/runtime-role.integration.test.ts
```

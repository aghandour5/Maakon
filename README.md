# Maakon

![Mobile-first](https://img.shields.io/badge/Mobile-first-FF6B6B?style=flat-square&logo=mobile)
![Arabic-first](https://img.shields.io/badge/Arabic-first-00A651?style=flat-square)
![React 19](https://img.shields.io/badge/React-19.0.0-61DAFB?style=flat-square&logo=react&logoColor=white)
![Express 5](https://img.shields.io/badge/Express-5.0.0-000000?style=flat-square&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-316192?style=flat-square&logo=postgresql&logoColor=white)

A mobile-first, Arabic-first crisis-response web app for Lebanon.

## Stack

| Layer | Tech |
|-------|------|
| Monorepo | pnpm workspaces |
| Frontend | React 19 + Vite + Tailwind CSS v4 + shadcn/ui |
| Backend | Express 5 + TypeScript |
| Database | PostgreSQL + Drizzle ORM |
| Validation | Zod |
| Maps | Leaflet + React Leaflet + clustering |
| i18n | react-i18next (Arabic default / RTL, English secondary) |

## Prerequisites

- Node.js 22+
- pnpm (`npm install -g pnpm`)
- PostgreSQL running locally or via Docker

## Quick Start

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

Copy the root `.env.example` into the package directories that need runtime configuration:

```powershell
Copy-Item .env.example artifacts/api-server/.env
Copy-Item .env.example artifacts/maakon-web/.env
Copy-Item .env.example lib/db/.env
```

Adjust values per package:

- `artifacts/api-server/.env`: `DATABASE_URL` for the API runtime login, `PORT=3001`, Supabase keys, and session settings
- `artifacts/maakon-web/.env`: `PORT=5173`, `BASE_PATH`, `API_URL`, `VITE_SUPABASE_*`
- `lib/db/.env`: `DATABASE_ADMIN_URL` for the schema owner; remove `DATABASE_URL` from this file

The production API rejects owner or administrative database logins at startup.
Keep the owner URL in the maintenance environment only. See
[database access and runtime-role setup](docs/database-access.md) before the first
production deployment or when switching an existing environment to the new role.

Remote database connections require TLS with certificate and hostname verification.
Loopback connections such as `localhost` can use a local database without TLS.

For hosted Supabase, the public root CA is included at
`lib/db/certs/supabase-prod-ca-2021.crt`. It comes from the
[certificate URL published by Supabase's dashboard source](https://github.com/supabase/supabase/blob/a05e7ec1d79e67cba65e3871b7caf105db27f8b1/apps/studio/hooks/custom-content/custom-content.json).
The certificate expires on 26 April 2031; replace it when Supabase rotates its CA.

Append `sslrootcert` to the runtime and admin database URLs. Its value
must be a URL-encoded absolute path to the certificate **on the machine running
the command**. For example, `D:/Maakon/lib/db/certs/supabase-prod-ca-2021.crt`
becomes `D%3A%2FMaakon%2Flib%2Fdb%2Fcerts%2Fsupabase-prod-ca-2021.crt`.
Use `?sslrootcert=...` when the URL has no query string, or `&sslrootcert=...`
when it already has one. Deployment paths will differ from local paths.
For another database provider, use its CA if the system trust store does not
already trust its certificate. See [Supabase's SSL setup](https://supabase.com/docs/guides/platform/ssl-enforcement).

> `DEV_SUPABASE_BYPASS=true` is only for local development and should never be enabled in production.

### 3. Prepare the database

```bash
pnpm --filter @workspace/db exec node --env-file=.env ./node_modules/drizzle-kit/bin.cjs push --config ./drizzle.config.ts
```

For an existing installation, apply the reviewed [migration](scripts/src/migrate.ts)
before deploying the updated API and website (see [database maintenance](docs/database-access.md#maintenance-commands)).
It adds nullable profile fields without replacing existing accounts. After email
sign-in, individuals missing details are asked for their full name, governorate
(district optional), and international phone number; their verified email is
already filled in. Individual help requests use the saved location and only
the chosen contact detail. The full name is not attached to the post. NGO
registration remains separate.

### 4. Seed sample data (optional)

```bash
node --env-file=lib/db/.env --import=./scripts/node_modules/tsx/dist/loader.mjs ./scripts/src/seed.ts
```

### 5. Run development servers

Run frontend and API together:

```bash
pnpm dev
```

Run packages individually:

```bash
pnpm dev:api                  # Express API -> http://localhost:3001
pnpm dev:web                  # Vite web app -> http://localhost:5173
```

### 6. Build for production

```bash
pnpm build
```

## Project Structure

```text
Maakon/
├── artifacts/
│   ├── api-server/       # Express 5 API
│   └── maakon-web/       # React + Vite frontend
├── lib/
│   ├── api-client-react/ # Generated React hooks from OpenAPI
│   ├── api-spec/         # OpenAPI spec + Orval codegen config
│   ├── api-zod/          # Shared Zod schemas
│   └── db/               # Drizzle schema + DB connection
├── scripts/              # DB migrate + seed scripts
├── .env.example          # Env template for package-level config
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

## Available npm Scripts

From the repository root:

```bash
pnpm install
pnpm dev
pnpm dev:api
pnpm dev:web
pnpm build
pnpm run typecheck
```

Package-specific scripts:

- `pnpm --filter @workspace/api-server run dev`
- `pnpm --filter @workspace/maakon-web run dev`
- `pnpm --filter @workspace/api-spec run codegen`
- `pnpm --filter @workspace/db run push`
- `pnpm --filter @workspace/scripts run migrate`
- `pnpm --filter @workspace/scripts run seed`

## API Routes

All routes are mounted under `/api`.

Public routes:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/healthz` | Health check |
| GET | `/api/metadata` | Filter options |
| GET | `/api/posts` | List public posts with private contact fields redacted. `activeOnly=false` includes resolved and expired posts |
| GET | `/api/posts/:id` | Public detail for an open post |
| GET | `/api/ngos` | NGO list |
| GET | `/api/ngos/nearby?governorate=&district=` | List approved referral organizations ranked from the selected district |
| POST | `/api/posts/draft` | Create an unauthenticated request draft |

Authenticated routes:

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/supabase-login` | Exchange Supabase token for session |
| POST | `/api/auth/complete-profile` | Complete user onboarding |
| POST | `/api/auth/complete-ngo-profile` | Complete NGO onboarding |
| POST | `/api/auth/logout` | Logout current session |
| GET | `/api/auth/me` | Current user |
| POST | `/api/auth/mfa-setup` | Admin MFA setup |
| POST | `/api/auth/mfa-verify` | Admin MFA verification |
| POST | `/api/auth/mfa-challenge` | Admin MFA challenge |
| POST | `/api/posts` | Create a request or publish an offer with an organization account |
| GET | `/api/posts/me` | Current user's posts |
| PATCH | `/api/posts/:id` | Update own post. Activating an offer requires an organization account |
| POST | `/api/posts/:id/contact-access` | Retrieve and audit private contact details for an open request. Requires a verified, active linked NGO and a CSRF token |
| DELETE | `/api/posts/:id` | Delete own post |
| POST | `/api/reports` | Report a post |
| POST | `/api/feedback` | Submit feedback |

Admin routes:

| Method | Path |
|--------|------|
| GET | `/api/admin/stats` |
| GET | `/api/admin/posts` |
| PATCH | `/api/admin/posts/:id/status` |
| GET | `/api/admin/reports` |
| PATCH | `/api/admin/reports/:id/status` |
| GET | `/api/admin/users` |
| DELETE | `/api/admin/users/:id` |
| GET | `/api/admin/ngos` |
| POST | `/api/admin/ngos` |
| PATCH | `/api/admin/ngos/:id` |
| DELETE | `/api/admin/ngos/:id` |
| PATCH | `/api/admin/ngos/:id/verify` |
| DELETE | `/api/admin/ngos/:id/verify` |
| PATCH | `/api/admin/ngos/:id/referral` |
| DELETE | `/api/admin/ngos/:id/referral` |
| POST | `/api/admin/cleanup` |

Admin routes require an `admin` role, an active session, and MFA. In production they are additionally guarded by subdomain and optional IP whitelist checks.

## Database Scripts

These aliases require `DATABASE_ADMIN_URL` in the shell environment. For commands
that load `lib/db/.env` explicitly, see [database access](docs/database-access.md).

```bash
pnpm --filter @workspace/db run push          # push schema to DB
pnpm --filter @workspace/scripts run migrate  # idempotent migration
pnpm --filter @workspace/scripts run seed     # seed sample data
```

For Release A, run the additive migration before applying the runtime-role grants.
Use `pnpm --filter @workspace/scripts run approve:referrals <id> [<id> ...]`
to approve the organizations reviewed for launch. The admin console also supports
approval and revocation for individual organizations.

`pnpm --filter @workspace/scripts run retire:offers` lists the individual offers
and pending offer drafts that would be retired. Pass `--apply` after the offer
restriction is live to retire and audit those posts. Pass `--rollback` to restore
eligible posts from the audited changes.

`pnpm --filter @workspace/scripts run set:sole-admin <email>` lists the admins
that would lose access and whether the email would be promoted. Pass `--apply`
to make that email the only admin; the changes are audited in `admin_actions`.
If the email has no account yet, an admin row is created and linked on first sign-in.

### Verify Release A locally

Point the development API and maintenance command at a local database. Run the
migration, start `pnpm dev`, and open `/give`. Use the admin console or
`approve:referrals` to approve a test organization and see it in the results.

The API integration suite uses an empty database named `maakon_release_a_test`
with the current schema on a disposable loopback PostgreSQL cluster. Set
`MAAKON_API_TEST_DATABASE_URL` to its `db02_test_owner` connection. The suite uses
synthetic users and clears its fixtures on exit. Without the test URL, the
command runs the unit tests.

```powershell
node --import=./scripts/node_modules/tsx/dist/loader.mjs --test ./lib/locations/test/geo.test.ts ./artifacts/api-server/test/*.test.ts
```

## PostgreSQL via Docker (optional)

If you do not have PostgreSQL installed:

```bash
docker run -d \
  --name maakon-pg \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=maakon \
  -p 5432:5432 \
  postgres:16-alpine
```

Use `postgresql://postgres:postgres@localhost:5432/maakon` as
`DATABASE_ADMIN_URL` for local maintenance. It can also serve as `DATABASE_URL`
during initial local development; production requires the restricted runtime login.

## Codegen (API client)

After changing the OpenAPI spec:

```bash
pnpm --filter @workspace/api-spec run codegen
```

## Licensing

The [Maakon Proprietary License](LICENSE) covers Maakon-owned material beginning
with the revision that introduces it. Third-party components retain their own
terms, including the [shadcn/ui MIT notice](artifacts/maakon-web/public/licenses/shadcn-ui.txt)
and [additional notices](artifacts/maakon-web/public/licenses/additional-notices.txt).
The production web build ships these notices and the generated dependency
manifest in `artifacts/maakon-web/dist/public/licenses/`.

## Manual review of help requests

After email confirmation, individual and NGO requests appear in the Console under **Pending review**. An admin can accept a request to publish it for the requested duration, freeze it for a later decision, or reject it with an audit reason. Requesters see pending and frozen requests as **Under review** in My posts. Changing the wording of an active or hidden request sends it back for approval.

Run `pnpm --filter @workspace/scripts run migrate` before deploying the API. Deploy promptly after migration so existing email links can claim their migrated drafts. Existing active requests stay published. NGO requests display only their designated public volunteer contact. Existing requester contact details become private.

To roll back, stop the new API and run `UPDATE posts SET status = 'pending' WHERE status IN ('draft', 'frozen');` before restarting the previous version. The added columns and enum values can stay. The previous API resumes its original publication and contact-visibility behavior.

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
Copy-Item .env.example artifacts/waitlist/.env
Copy-Item .env.example lib/db/.env
```

Adjust values per package:

- `artifacts/api-server/.env`: `DATABASE_URL`, `PORT=3001`, Supabase keys, and session settings
- `artifacts/maakon-web/.env`: `PORT=5173`, `BASE_PATH`, `API_URL`, `VITE_SUPABASE_*`
- `artifacts/waitlist/.env`: `NEXT_PUBLIC_SUPABASE_*`
- `lib/db/.env`: `DATABASE_URL`

> `DEV_FIREBASE_BYPASS=true` is only for local development and should never be enabled in production.

### 3. Prepare the database

```bash
pnpm --filter @workspace/db run push
```

### 4. Seed sample data (optional)

```bash
pnpm --filter @workspace/scripts run seed
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
pnpm --filter waitlist dev    # Next.js waitlist -> http://localhost:3000
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
│   ├── maakon-web/       # React + Vite frontend
│   └── waitlist/         # Next.js waitlist page
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
- `pnpm --filter waitlist dev`
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
| GET | `/api/posts` | List filtered posts |
| GET | `/api/posts/:id` | Post detail |
| GET | `/api/ngos` | NGO list |
| POST | `/api/posts/draft` | Create unauthenticated draft post |

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
| POST | `/api/posts` | Create need or offer |
| GET | `/api/posts/me` | Current user's posts |
| PATCH | `/api/posts/:id` | Update own post |
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
| POST | `/api/admin/cleanup` |

Admin routes require an `admin` role, an active session, and MFA. In production they are additionally guarded by subdomain and optional IP whitelist checks.

## Database Scripts

```bash
pnpm --filter @workspace/db run push          # push schema to DB
pnpm --filter @workspace/scripts run migrate  # idempotent migration
pnpm --filter @workspace/scripts run seed     # seed sample data
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

Then use `postgresql://postgres:postgres@localhost:5432/maakon` as `DATABASE_URL`.

## Codegen (API client)

After changing the OpenAPI spec:

```bash
pnpm --filter @workspace/api-spec run codegen
```

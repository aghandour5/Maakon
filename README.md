# Maakon — معكن

Mobile-first, Arabic-first crisis-response web app for Lebanon.

## Stack

| Layer | Tech |
|-------|------|
| Monorepo | pnpm workspaces |
| Frontend | React 19 + Vite + Tailwind CSS v4 + Shadcn UI |
| Backend | Express 5 + TypeScript |
| Database | PostgreSQL + Drizzle ORM |
| Validation | Zod v3 |
| Maps | Leaflet + React Leaflet + clustering |
| i18n | react-i18next (Arabic default / RTL, English secondary) |
| Forms | react-hook-form + Zod |

## Prerequisites

- **Node.js 22+**
- **pnpm** (`npm install -g pnpm`)
- **PostgreSQL** running locally (or via Docker — see below)

## Quick Start

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

Copy and edit the env files:

```
artifacts/api-server/.env   → set DATABASE_URL + PORT
artifacts/maakon-web/.env   → PORT + BASE_PATH (defaults fine)
lib/db/.env                 → set DATABASE_URL for drizzle-kit CLI
```

See `.env.example` at the root for all variables.

### 3. Push DB schema

```bash
pnpm --filter @workspace/db run push
```

### 4. Seed sample data (optional)

```bash
pnpm --filter @workspace/scripts run seed
```

### 5. Run in dev mode

```bash
# One command — starts API + frontend simultaneously
pnpm dev
```

Or individually:

```bash
pnpm dev:api   # Express API → http://localhost:3001
pnpm dev:web   # Vite frontend → http://localhost:5173
```

## Project Structure

```
Maakon/
├── artifacts/
│   ├── api-server/      # Express 5 API
│   └── maakon-web/      # React + Vite frontend
├── lib/
│   ├── api-client-react/ # Generated React Query hooks (from OpenAPI)
│   ├── api-spec/         # OpenAPI spec + Orval codegen config
│   ├── api-zod/          # Generated Zod schemas
│   └── db/              # Drizzle ORM schema + DB connection
├── scripts/             # DB migrate + seed scripts
├── .env.example         # All required env variables documented
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

## API Routes

All under `/api`:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/healthz` | Health check |
| GET | `/api/posts` | List filtered posts |
| POST | `/api/posts` | Create need or offer |
| GET | `/api/posts/:id` | Post detail |
| GET | `/api/ngos` | NGO list |
| POST | `/api/reports` | Report a post |
| GET | `/api/metadata` | Filter options |

Admin (Requires `admin` role and active session):

| Method | Path |
|--------|------|
| GET | `/api/admin/stats` |
| GET/PATCH | `/api/admin/posts` |
| GET/PATCH | `/api/admin/reports` |
| GET/POST/PATCH/DELETE | `/api/admin/ngos` |

## Database Scripts

```bash
pnpm --filter @workspace/db run push          # push schema to DB
pnpm --filter @workspace/scripts run migrate  # idempotent migration
pnpm --filter @workspace/scripts run seed     # seed sample data
```

## PostgreSQL via Docker (optional)

If you don't have PostgreSQL installed:

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

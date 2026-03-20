# Workspace — Maakon

## Overview

pnpm workspace monorepo using TypeScript. Contains the Maakon crisis-response web app for Lebanon.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + Tailwind CSS + Shadcn UI
- **Map**: Leaflet + React Leaflet + react-leaflet-cluster
- **i18n**: react-i18next (Arabic default, RTL; English secondary)
- **Forms**: react-hook-form + Zod validation

## Product — Maakon

Mobile-first, Arabic-first crisis-response web app for Lebanon.

### Routes
- `/` — Ultra-fast homepage: "I Need Help" + "I Want to Help" + "View Map" buttons
- `/map` — Full-screen Lebanon map with clustered markers (needs/offers/NGOs), filters, legend, speed-dial FAB
- `/need/new` — 3-step mobile form to post a need (with expiry presets + success screen)
- `/offer/new` — 3-step mobile form to post an offer (with expiry presets + success screen)
- `/admin` — Dev-only moderation panel: stats, post/report/NGO management

### Safety rules
- Need posts: ONLY fuzzed district-level coordinates (`publicLat`/`publicLng`) are stored and returned
- `privateLat`, `privateLng`, `exactAddressPrivate` are NEVER returned by any public API endpoint
- Only `active`, non-expired posts are returned on the public map endpoint
- Admin endpoint exposes `exactAddressPrivate` for moderation context, but NEVER exposes `privateLat`/`privateLng`

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server
│   └── maakon-web/         # React + Vite frontend (Arabic-first)
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
│   └── src/seed.ts         # Seed script: 14 posts + 6 NGOs
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Database Schema

Tables:
- `users` — id, name, email, role (user/admin/moderator), createdAt
- `posts` — full post schema with public/private coordinate split, expiry, status (`pending|active|hidden|resolved|expired|removed`), reportCount
- `ngos` — verified NGO listings with exact coordinates (allowed); `status` column + `verifiedAt` timestamp
- `reports` — post reports (reason: fake/scam/unsafe/outdated/spam/other); status: `pending|reviewed|dismissed|actioned`
- `admin_actions` — audit log of admin moderation actions

Post safety:
- `publicLat`/`publicLng`: fuzzed district-level coordinates (returned in API)
- `privateLat`/`privateLng`: exact coordinates (never returned in public API)
- `exactAddressPrivate`: exact address (never returned in public API)

## API Endpoints

All at `/api`:
- `GET /api/healthz` — health check
- `GET /api/posts` — filtered list (postType, category, governorate, district, urgency, activeOnly, verifiedNgoOnly)
- `POST /api/posts` — create need or offer
- `GET /api/posts/:id` — post detail (no private fields)
- `GET /api/ngos` — verified NGO list (governorate filter)
- `POST /api/reports` — report a post
- `GET /api/metadata` — filter options (categories, governorates, districts, urgencyLevels, etc.)

Admin/moderation (dev-only, no auth):
- `GET /api/admin/stats` — counts for posts/reports/NGOs by status
- `GET /api/admin/posts` — all posts with `exactAddressPrivate` (never coords)
- `PATCH /api/admin/posts/:id/status` — set post status (active/hidden/resolved/expired/removed)
- `GET /api/admin/reports` — all reports with joined post info
- `PATCH /api/admin/reports/:id/status` — set report status
- `GET /api/admin/ngos` — all NGOs
- `POST /api/admin/ngos` — create NGO
- `PATCH /api/admin/ngos/:id` — update NGO fields
- `PATCH /api/admin/ngos/:id/verify` — mark verified
- `DELETE /api/admin/ngos/:id/verify` — unverify
- `POST /api/admin/cleanup` — expire stale posts past their expiresAt date

## Scripts

- `pnpm --filter @workspace/scripts run migrate` — idempotent DB migration (adds new enum values/columns)
- `pnpm --filter @workspace/scripts run seed` — seed with 19 posts (mixed statuses), 8 NGOs, 5 reports

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

- **Always typecheck from the root** — run `pnpm run typecheck`
- **`emitDeclarationOnly`** — only emit `.d.ts` files during typecheck

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references
- `pnpm --filter @workspace/db run push` — push Drizzle schema to DB
- `pnpm --filter @workspace/scripts run seed` — seed DB with sample data
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API client + Zod schemas

## Workflows

- `artifacts/api-server: API Server` — Express API on assigned port
- `artifacts/maakon-web: web` — Vite dev server at `/`

## Logging

The API server uses `pino` for structured JSON logging. Use `req.log` inside route handlers, `logger` from `lib/logger.ts` for non-request code.

# Maakon Development Setup Guide

A mobile-first, Arabic-first crisis-response web app for Lebanon.

## Prerequisites

Before you start, ensure you have:

- **Node.js 22+** — [Download](https://nodejs.org/)
- **pnpm** — Install globally with `npm install -g pnpm`
- **PostgreSQL 15+** — [Download](https://www.postgresql.org/) or use [Docker](#using-docker)
- **Git** — [Download](https://git-scm.com/)

### Check Your Setup

```bash
node --version        # Should be 22+
pnpm --version        # Should be latest
psql --version        # Should be 15+
git --version         # Any recent version
```

---

## Quick Start (5 minutes)

### 1. Clone the Repository

```bash
git clone https://github.com/aghandour5/Maakon.git
cd Maakon
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Setup Environment Variables

Copy `.env.example` to each package:

**On Windows (PowerShell):**
```powershell
Copy-Item .env.example artifacts/api-server/.env
Copy-Item .env.example artifacts/maakon-web/.env
Copy-Item .env.example lib/db/.env
```

**On macOS/Linux:**
```bash
cp .env.example artifacts/api-server/.env
cp .env.example artifacts/maakon-web/.env
cp .env.example lib/db/.env
```

### 4. Configure Environment Variables

#### Get Supabase Credentials

1. Go to [Supabase](https://supabase.com/)
2. Create or access your project
3. Go to **Settings** → **API**
4. Copy your `Project URL` and `anon public key`

#### Configure Each .env File

**`artifacts/api-server/.env`:**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/maakon"
PORT=3001
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
NODE_ENV=development
LOG_LEVEL=info
CORS_ORIGINS="http://localhost:5173,http://localhost:5174"
JSON_BODY_LIMIT="100kb"
URLENCODED_BODY_LIMIT="100kb"
DEV_SUPABASE_BYPASS="false"
```

**`artifacts/maakon-web/.env`:**
```env
PORT=5173
BASE_PATH=/
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"
VITE_CARTO_API_KEY="your-carto-api-key"
```

**`lib/db/.env`:**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/maakon"
```

⚠️ **Never commit `.env` files!** They contain secrets and are in `.gitignore` for security.

### 5. Setup Database

```bash
pnpm --filter @workspace/db run push
```

This creates all database tables using Drizzle ORM.

### 6. (Optional) Seed Sample Data

```bash
pnpm --filter @workspace/scripts run seed
```

This populates the database with sample posts, users, and NGOs for testing.

### 7. Start Development Servers

**Both frontend and API together:**
```bash
pnpm dev
```

This starts:
- **Frontend:** http://localhost:5173 (or 5174 if 5173 is busy)
- **API:** http://localhost:3001

**Or run individually:**
```bash
pnpm dev:api    # API only → http://localhost:3001
pnpm dev:web    # Frontend only → http://localhost:5173
```

### 8. Verify It Works

1. Open **http://localhost:5173** in your browser
2. You should see the Maakon app loading
3. Check the console (F12) for any errors

---

## Using Docker

If you don't have PostgreSQL installed locally, use Docker:

### Option 1: Docker Compose

Create a `docker-compose.yml` in the project root:

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: maakon
      POSTGRES_PASSWORD: maakon-dev
      POSTGRES_DB: maakon
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

Start it:
```bash
docker-compose up -d
```

Then update your `.env` files with:
```env
DATABASE_URL="postgresql://maakon:maakon-dev@localhost:5432/maakon"
```

### Option 2: Docker CLI

```bash
docker run -d \
  --name maakon-postgres \
  -e POSTGRES_USER=maakon \
  -e POSTGRES_PASSWORD=maakon-dev \
  -e POSTGRES_DB=maakon \
  -p 5432:5432 \
  postgres:15-alpine
```

---

## Project Structure

```text
Maakon/
├── artifacts/
│   ├── api-server/            # Express 5 backend API
│   │   ├── src/
│   │   │   ├── routes/        # API endpoints
│   │   │   ├── middleware/    # CORS, auth, rate limiting
│   │   │   └── index.ts       # Server entry point
│   │   └── package.json
│   │
│   └── maakon-web/            # React + Vite frontend
│       ├── src/
│       │   ├── pages/         # Page components (Map, Posts, Admin)
│       │   ├── components/    # Reusable React components
│       │   ├── hooks/         # Custom React hooks
│       │   ├── contexts/      # React Context for state
│       │   └── main.tsx       # App entry point
│       ├── vite.config.ts
│       └── package.json
│
├── lib/
│   ├── db/                    # Drizzle ORM schemas and migrations
│   │   ├── src/schema.ts      # Database schema
│   │   └── drizzle.config.ts
│   │
│   ├── api-spec/              # OpenAPI specification
│   ├── api-zod/               # Shared validation schemas
│   └── api-client-react/      # Auto-generated React hooks from OpenAPI
│
├── scripts/
│   └── db/
│       ├── seed.ts            # Database seeding script
│       └── migrate.ts         # Migration runner
│
├── .env.example               # Environment template (copy to each package)
├── pnpm-workspace.yaml        # Workspace configuration
├── tsconfig.base.json         # TypeScript base config
├── README.md                  # Project overview
└── SETUP.md                   # This file
```

---

## Available Commands

### Root Level

```bash
pnpm install                    # Install all dependencies
pnpm dev                        # Start frontend + API
pnpm dev:api                    # Start API only
pnpm dev:web                    # Start frontend only
pnpm build                      # Build all packages for production
pnpm run typecheck              # TypeScript type checking
pnpm --filter @workspace/db run push      # Update database schema
pnpm --filter @workspace/scripts run seed # Seed sample data
```

### Frontend Only

```bash
cd artifacts/maakon-web
pnpm dev                        # Start dev server
pnpm build                      # Build for production
pnpm preview                    # Preview production build
pnpm run lint                   # Run ESLint
pnpm run type-check             # Type checking
```

### API Only

```bash
cd artifacts/api-server
pnpm dev                        # Start development server
pnpm build                      # Build for production
pnpm start                      # Run production build
```

---

## Troubleshooting

### Port Already in Use

If port 5173 or 3001 is busy:

**Frontend (maakon-web):** Edit `artifacts/maakon-web/.env` and change `PORT`
```env
PORT=5174
```

**API (api-server):** Edit `artifacts/api-server/.env` and change `PORT`
```env
PORT=3002
```

Then update `artifacts/maakon-web/.env` with the new API URL:
```env
API_URL="http://localhost:3002"
```

### Database Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:** Make sure PostgreSQL is running.

**Check if running:**
```bash
psql -U postgres -c "SELECT 1"
```

**Start PostgreSQL:**
- **Windows:** Open Services and start PostgreSQL
- **macOS:** `brew services start postgresql`
- **Linux:** `sudo systemctl start postgresql`
- **Docker:** `docker-compose up -d`

### Supabase Connection Error

Verify your Supabase credentials in `.env` files:
- `VITE_SUPABASE_URL` should be like `https://xxxxx.supabase.co`
- `VITE_SUPABASE_ANON_KEY` should be a long string

Check at [Supabase Dashboard](https://app.supabase.com/) → Settings → API

### Dependencies Not Installing

```bash
# Clear pnpm cache and reinstall
pnpm store prune
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### TypeScript Errors

Ensure you have TypeScript intellisense enabled in VS Code:
- Install extension: **TypeScript Vue Plugin (Volar)**
- Press `Ctrl+Shift+P` and run **TypeScript: Restart TS Server**

---

## Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Your Changes

Edit files, run `pnpm dev` to test locally.

### 3. Commit Your Changes

```bash
git add .
git commit -m "Add your feature description"
```

### 4. Push to GitHub

```bash
git push origin feature/your-feature-name
```

### 5. Open a Pull Request

Go to GitHub and create a PR for review.

### 6. After Merge

```bash
git checkout main
git pull origin main
pnpm install  # If dependencies changed
```

---

## Key Technologies

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19 + Vite + TypeScript |
| **Backend** | Express 5 + TypeScript |
| **Database** | PostgreSQL 15+ + Drizzle ORM |
| **Maps** | Leaflet + React Leaflet + CARTO tiles |
| **UI Components** | shadcn/ui + Tailwind CSS v4 |
| **Form Validation** | Zod |
| **Internationalization** | react-i18next (Arabic/English, RTL) |
| **Authentication** | Supabase Auth + Sessions |
| **API Documentation** | OpenAPI + Orval codegen |
| **Monorepo** | pnpm workspaces |

---

## Common Tasks

### Add a New Page

1. Create component in `artifacts/maakon-web/src/pages/YourPage.tsx`
2. Add route in `artifacts/maakon-web/src/App.tsx`
3. Add navigation link in `artifacts/maakon-web/src/components/layout/`

### Add an API Endpoint

1. Create handler in `artifacts/api-server/src/routes/`
2. Add to OpenAPI spec in `lib/api-spec/`
3. Run `pnpm --filter @workspace/api-spec run codegen` to generate React hooks
4. Use generated hook in frontend component

### Add a Database Table

1. Add schema to `lib/db/src/schema.ts`
2. Run `pnpm --filter @workspace/db run push`
3. Drizzle ORM generates migrations automatically

### Add Environment Variable

1. Add to `.env.example` with documentation
2. Add to each package's `.env` file
3. For frontend: prefix with `VITE_` to expose to browser

---

## Getting Help

- **Project README:** [README.md](README.md)
- **GitHub Issues:** Report bugs or ask questions
- **Git Log:** `git log --oneline` to see recent changes
- **Code Comments:** Look for `// TODO` and `// FIXME` notes

---

## Next Steps

After setup, check out:
1. **Main features:** Map, posting needs/offers, search filters
2. **Admin dashboard:** http://localhost:5173/admin (requires auth)
3. **Database schema:** `lib/db/src/schema.ts`
4. **API routes:** `artifacts/api-server/src/routes/`

---

**Happy coding! 🚀**

Questions? Open an issue on GitHub or reach out to the team.

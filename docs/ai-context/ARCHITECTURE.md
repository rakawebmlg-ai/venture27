# Architecture

## System Overview
The application is a full-stack programmatic SEO content generator built as a Monorepo. It splits responsibilities between a Next.js frontend (for UI and API endpoints) and an Express backend (for background worker processes).

## Application Structure
Monorepo using NPM Workspaces.

## Folder Structure
```text
programmatic-venture27/
├── apps/
│   ├── frontend/         # Next.js UI only (no API routes - see below)
│   └── backend/          # Express REST API + BullMQ Worker
├── packages/
│   └── database/         # Prisma Schema & Shared Client (+ portable helpers in lib/)
├── docs/                 # Documentation & AI Context
├── docker-compose.yml    # Postgres & Redis infrastructure
└── package.json          # Root workspace config
```

## Frontend Architecture
- **Framework**: Next.js 16 (App Router).
- **Pages**: `/`, `/master-data`, `/generate-content`, `/settings`, `/history`, `/import`, `/services/{city,community,county}`, `/login`, `/result-guide`, plus the public `/{type}/services/{value}/{service}/{heading}` route.
- **API Routes**: NONE live in the frontend anymore (moved to the Express backend, 2026-08-02 - see the "Decision: Move API Routes to Express Backend" entry in DECISIONS.md). `apps/frontend/next.config.mjs`'s `rewrites()` proxies `/api/:path*` to the backend (`BACKEND_URL`, defaults to `http://localhost:3001`) - a real server-side rewrite, not a client-side redirect, so `proxy.ts` (the Edge Runtime auth gate, formerly `middleware.ts`) still runs on every `/api/*` request before it's forwarded, and `Set-Cookie` headers the backend issues still reach the browser normally.

## Backend Architecture
- **Framework**: Express.js.
- **Core Role**: Hosts the entire REST API (`apps/backend/src/routes/{auth,masterData,generate,jobs,overview,prompts,publish,settings}.ts`) AND the BullMQ Worker (`apps/backend/src/worker.ts`, connects to Redis and listens to the `generate-content` queue via a shared connection in `apps/backend/src/queue.ts`). `apps/backend/src/index.ts` is just the Express app bootstrap - `express.json()` middleware, one `app.use()` per route module, `/health`.
- **AI Processing**: `worker.ts` calls the Anthropic/OpenAI/Google SDKs directly (not the Vercel AI SDK) to prompt external LLMs, using per-request API keys read from the `Settings` table. Updates the database via the shared `@venture27/database` package.
- **Auth note**: this API is never exposed directly to the internet (only reachable from the frontend container/process via the rewrite above), so no CORS setup exists and none is needed - the frontend's `proxy.ts` is the only auth boundary.

## Routing
- Next.js App Router for frontend navigation.

## Component Architecture
- React Server Components (RSC) and Client Components (`'use client'`).
- UI heavily relies on standard CSS, avoiding complex utility frameworks unless explicitly requested.
- Client Components and `proxy.ts` (Edge Runtime) must import shared `@venture27/database` helpers via workspace subpaths (`@venture27/database/lib/location`, not the barrel `@venture27/database`) - the barrel's top-level `new PrismaClient()` would otherwise get pulled into their bundles, since ESM tree-shaking doesn't eliminate side-effecting top-level statements in a module just because only one of its named exports is used. Server Components may safely use the barrel.

## State Management
- React `useState` and `useEffect` for local component state and data fetching.

## API Architecture
- Frontend communicates with `/api/*`, which Next.js's `rewrites()` transparently forwards to the Express backend (see Frontend Architecture above) - from the browser's perspective it's still same-origin.
- Express routes query Postgres via Prisma (`@venture27/database`) or enqueue jobs to Redis via BullMQ (`apps/backend/src/queue.ts`).

## Database Architecture
- **Type**: PostgreSQL (RDBMS).
- **ORM**: Prisma.
- **Tables**: `Settings`, `Category`, `Location`, `Service`, `MasterData`, `Job`.
- `MasterData` is a junction table storing combinations of `Location` and `Service` and the resulting generated `content`.

## Authentication Flow
- Single shared-password login (no per-user accounts, matches this app's single-tenant design elsewhere). `apps/frontend/proxy.ts` (Edge Runtime, Next.js 16's renamed `middleware.ts`) gates every route except an explicit public-asset allowlist, checking a `jose`-signed session cookie via `@venture27/database/lib/session`. The login/logout endpoints themselves now live in the Express backend (`apps/backend/src/routes/auth.ts`), reached through the same `/api/*` rewrite as every other API call - `proxy.ts` still verifies the cookie itself locally (no round-trip to the backend needed for that check) since the signing secret (`SESSION_SECRET`) is shared between both apps' env files.

## Data Flow
1. User uploads CSVs in Next.js UI.
2. Browser calls `/api/master-data`, which Next.js's `rewrites()` forwards to the Express backend's `masterData.ts` route, which creates `Category`, `Location`, `Service`, and combinatorial `MasterData` records (Status: 'pending').
3. User starts generation in UI.
4. Browser calls `/api/generate` → forwarded to `apps/backend/src/routes/generate.ts`, which creates a `Job` record and pushes a job to BullMQ (Redis) via `queue.ts`.
5. `apps/backend/src/worker.ts`'s BullMQ Worker picks up the job.
6. Worker pulls `MasterData` items, injects variables into `prompt.md`, calls LLM.
7. Worker updates `MasterData` (Status: 'generated') and `Job` (Progress %).
8. UI polls `/api/generate?jobId=X` (→ backend) to show progress.

## External Integrations
- OpenAI API
- Anthropic API
- Google Gemini API

## Deployment Architecture
- Docker Compose is used to orchestrate Postgres and Redis locally.
- Next.js and Express servers are run via standard Node/NPM scripts.

## Important Architectural Patterns
- **Shared DB Package**: Prisma client is centralized in `packages/database` and imported into both apps as `@venture27/database` to avoid generating multiple Prisma clients.
- **Decoupled Background Processing**: Next.js is not responsible for AI generation. It strictly offloads to BullMQ.

## Architecture Constraints
- Must remain a Monorepo.
- Must use PostgreSQL and Redis.
- Backend background processing must remain decoupled from the Next.js lifecycle.

# Technical Decisions

## Decision: Monorepo Architecture
Date: 2026-07-23
Status: Active
Decision: Split the project into `apps/frontend` (Next.js), `apps/backend` (Express), and `packages/database` (Prisma) using NPM Workspaces.
Reason: The user explicitly requested a Monorepo structure to separate the UI from the background processing tasks while sharing the database schema.
Evidence: Root `package.json`, `apps/`, `packages/` directories.
Impact: Requires `npm install` at root. Requires running multiple dev servers concurrently.
Do Not Change Without Approval: Do not merge backend and frontend back into a single Next.js app.

## Decision: BullMQ for Background Jobs
Date: 2026-07-23
Status: Active
Decision: Use BullMQ with Redis instead of `pg-boss` or native Next.js API routes.
Reason: AI generation tasks are long-running and prone to timeouts if processed synchronously in API routes. BullMQ offers robust retries, pausing, and concurrency control.
Evidence: `docker-compose.yml` (redis), `apps/backend/src/worker.ts`, `apps/backend/src/queue.ts`.
Impact: Requires Redis to be running locally via Docker.
Do Not Change Without Approval: Do not switch back to `pg-boss` or synchronous API endpoints. (The stray `apps/frontend/worker.ts` dead pg-boss file this note used to warn about was deleted in a prior session - nothing left to clean up there.)

## Decision: Move All API Routes From Next.js to Express Backend
Date: 2026-08-02
Status: Active (implemented locally, not yet pushed - see SESSION_HANDOVER.md Current Objective item -11)
Decision: Every Next.js API Route Handler under `apps/frontend/app/api/` was moved into new Express routers under `apps/backend/src/routes/`. The frontend reaches them via `next.config.mjs`'s `rewrites()` (`/api/:path*` → `${BACKEND_URL}/api/:path*`), a real server-side reverse proxy, not a client-side redirect.
Reason: The user explicitly asked for backend logic to be physically separated out of the frontend app folder ("ada folder api yang isinya code untuk backend mungkin ini bisa di pisah saja dan masukkan ke dalam folder backend yg menggunakan express").
Evidence: `apps/backend/src/routes/*.ts`, `apps/backend/src/index.ts`, `apps/frontend/next.config.mjs`.
Impact: Local dev now requires the backend (`tsx`, no watch mode) to be running for ANY API call to work, not just for generation - `apps/frontend` alone can no longer serve `/api/*` at all. `apps/backend/.env` (gitignored) must exist locally with `DASHBOARD_USERNAME`/`DASHBOARD_PASSWORD`/`SESSION_SECRET` matching the frontend's, since `tsx` doesn't auto-load `.env.local` the way Next.js does (`dotenv/config` is now the first import in `apps/backend/src/index.ts` to cover this). Client Components and `proxy.ts` must import shared `@venture27/database` helpers via workspace subpaths, not the barrel, to avoid pulling `PrismaClient` into the Edge Runtime/browser bundle.
Do Not Change Without Approval: Do not move API logic back into `apps/frontend/app/api/` - this was a deliberate, requested restructure. Do not push this refactor to `main` without explicit confirmation from the user first (it was done "jangan di push dulu" - the standing instruction stays in force until lifted).

## Decision: Shared Prisma Package
Date: 2026-07-23
Status: Active
Decision: Create `@venture27/database` to house Prisma schema and client.
Reason: Prevents issues with multiple Prisma clients being generated and out of sync in a monorepo environment.
Evidence: `packages/database/schema.prisma`.
Impact: Prisma schema modifications must be done inside `packages/database` followed by `npm run build --workspace=@venture27/database`.
Do Not Change Without Approval: Keep the Prisma schema centralized.

## Decision: Database-Stored Configuration
Date: 2026-07-23
Status: Active
Decision: API Keys (OpenAI, Anthropic, Gemini) and SMTP settings are stored in the `Settings` table in Postgres, NOT in `.env`.
Reason: Allows users to configure keys directly through the UI `/settings` without modifying deployment environment variables.
Evidence: `Prisma Schema -> Settings model`, `apps/frontend/app/settings/page.tsx`.
Impact: API Keys are fetched dynamically by the BullMQ worker before starting a job.
Do Not Change Without Approval: Do not hardcode API keys into `.env` requiring a server restart.

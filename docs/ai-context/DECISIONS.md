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
Evidence: `docker-compose.yml` (redis), `apps/backend/src/index.ts`.
Impact: Requires Redis to be running locally via Docker.
Do Not Change Without Approval: Do not switch back to `pg-boss` or synchronous API endpoints.

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

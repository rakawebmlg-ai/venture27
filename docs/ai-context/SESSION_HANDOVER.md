# Session Handover

## Last Updated
2026-07-24

## Current Objective
Fix the "Generate Master Data" flow on `/master-data`: uploading Locations + Core Services CSVs appeared to not work, and `{{City}}`/`{{Province}}` placeholders in Service CSV columns (Meta Title, Meta Description, Heading, Subheading) were never rendered.

## Current Task
Done for this session. Awaiting user's next command (deploy/push, or continue with Pending items below).

## What Has Been Completed
- Monorepo Migration.
- Redis + BullMQ integration.
- Next.js UI completion.
- AI Context documentation creation.
- Master Data generate bug fixes (see below).

## What Is Currently In Progress
- None.

## What Has Not Been Started
- CSV Export for Master Data. (Note: `page.tsx` already has an `exportCSV` button per category group — verify if this counts as done or still needs backend-driven export.)
- Real SMTP Email dispatch logic in the BullMQ worker.
- Result Guide page UI.

## Files Modified Recently
- `apps/frontend/app/api/master-data/route.ts` — GET now renders `{{City}}`/`{{Province}}` placeholders per row; POST now updates an existing Service's meta template on re-upload instead of ignoring it, trims CSV header/value whitespace + BOM, and returns `skippedLocationRows` / `skippedServiceRows` / `skippedExistingCombos` counts.
- `apps/frontend/app/master-data/page.tsx` — `executeCombine` now surfaces a specific alert (created count, or the reason zero rows were created) instead of a generic success/failure message.

## Important Context
- The project is a Monorepo. Use npm workspaces (`npm run dev --workspace=@venture27/frontend`).
- The Database Prisma Client is shared via `packages/database`.
- AI generation is decoupled into `apps/backend` running a BullMQ worker.
- `Service` rows are meta-template placeholders keyed uniquely by `name` (shared across every Location that pairs with it via `MasterData`). Rendering of `{{City}}`/`{{Province}}` happens at read-time in `GET /api/master-data` (per `MasterData` row, using its `location`), not stored on the DB — no schema/migration change was needed for this fix.
- Root-level `.gitignore` now excludes `node_modules/`, `.env*`, `.next/`, etc. `packages/database/.env` (holds `DATABASE_URL`) is intentionally not committed.
- Repo is pushed to `https://github.com/rakawebmlg-ai/venture27.git` (branch `main`).

## Technical Decisions Made
- Use BullMQ for background jobs instead of pg-boss or standard API routes. (Note: `apps/frontend/worker.ts` is stray dead code using `pg-boss` against a different queue system than the real BullMQ worker in `apps/backend/src/index.ts` — it will never receive jobs enqueued by `apps/frontend/app/api/generate/route.ts`. Not touched this session since it's unrelated to the Master Data bug, but flagged for cleanup.)
- Store API keys in the PostgreSQL `Settings` table, not `.env`.
- Meta title/description/heading/subheading placeholders are rendered on read (in the API layer), not persisted per-row, to avoid a schema migration and keep the Service template as the single source of truth.

## Problems Encountered
- `Move-Item` locked folders during monorepo migration (Resolved).
- Hydration Mismatch error caused by browser extensions in Next.js (Resolved by adding `suppressHydrationWarning` to `<body>`).
- Master Data generate looked broken because: (a) placeholders were never interpolated, (b) re-uploading a Service CSV silently no-op'd if the service name already existed, (c) zero-rows-created gave no explanation. All three fixed this session and verified live against the running Docker Postgres (`venture27-db`) + `npm run dev` frontend on port 3000.
- `npx prisma db push` in `packages/database` throws `EPERM` renaming the query engine `.dll` while the dev servers are running (file lock) — harmless; schema was already in sync and the already-generated client still matches (no schema changes were made). Stop the dev server first if a real `prisma generate` is ever needed.

## Current Blockers
- None.

## Exact Next Step
- Wait for user instruction. Recommend implementing CSV Export or SMTP Notifications, or cleaning up the dead `apps/frontend/worker.ts` (pg-boss, wrong queue system).

## Recommended Next Actions
1. Implement `nodemailer` in `apps/backend/src/index.ts` to dispatch completion emails based on the `Settings` table.
2. Build the UI for the `/result-guide` page.
3. Remove or fix `apps/frontend/worker.ts` (pg-boss) since it's dead code that can never run against the BullMQ queue used by `apps/frontend/app/api/generate/route.ts` + `apps/backend/src/index.ts`.

## Instructions For The Next AI
- Continue from the current project state.
- Do not restart completed work.
- Do not redesign existing architecture without explicit approval.
- Do not change the technology stack without explicit approval.
- Inspect existing implementation before creating new code.
- Reuse existing components and utilities when possible.
- Keep changes focused on the current task.
- Before finishing your task, YOU MUST update this `SESSION_HANDOVER.md` file and the `CURRENT_STATE.md` file!

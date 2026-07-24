# Current State

## Last Updated
2026-07-24

## Current Project Phase
Active Development / Polishing

## Current Objective
Fixed the Master Data CSV generate flow (`/master-data`): `{{City}}`/`{{Province}}` placeholders in Service CSV meta columns now render per-location, and re-uploading a Service CSV updates its stored template instead of being silently ignored.

## Completed
- Next.js UI pages (`/`, `/master-data`, `/generate-content`, `/settings`).
- Database schema and PostgreSQL integration via Prisma.
- Monorepo restructuring (`apps/frontend`, `apps/backend`, `packages/database`).
- Redis and BullMQ integration for background AI processing.
- Dynamic prompt injection (`{{city}}`, `{{province}}`, `{{service_name}}`, `{{category}}`).
- Job Pause/Resume/Stop logic.
- Master Data generate: `{{City}}`/`{{Province}}` interpolation in Meta Title/Description/Heading/Subheading, service-template refresh on re-upload, tolerant CSV header parsing (whitespace/BOM), and clear zero-result feedback in the UI.
- Repo pushed to GitHub: `https://github.com/rakawebmlg-ai/venture27.git` (`main`), with root `.gitignore` excluding `node_modules/`, `.env*`, `.next/`.

## In Progress
- None.

## Pending
- Authentication system (if required).
- Deployment pipeline to production (Netlify/Vercel/Docker).
- Real SMTP email dispatch upon job completion (currently setting is saved but email is not actually sent).
- Dead code cleanup: `apps/frontend/worker.ts` uses `pg-boss` against a queue the real BullMQ worker (`apps/backend/src/index.ts`) never talks to — it can never receive jobs from `apps/frontend/app/api/generate/route.ts`.

## Blocked
- None.

## Recently Modified Areas
- `apps/frontend/app/api/master-data/route.ts` (placeholder rendering, service template upsert, CSV parsing robustness, richer POST response).
- `apps/frontend/app/master-data/page.tsx` (informative post-generate alert).

## Current Technical Context
- The project successfully runs via `docker compose up -d` (for DB/Redis) followed by `npm run dev --workspace=@venture27/frontend` and `npm run dev --workspace=@venture27/backend`.
- Verified locally this session: Docker containers `venture27-db` (Postgres) and `venture27-redis` were already running; frontend dev server on port 3000, backend health server on port 3001. Master Data generate flow was tested end-to-end via direct API calls (upload CSVs with `{{City}}`/`{{Province}}` placeholders → confirmed per-location rendering in `GET /api/master-data`, confirmed service-template refresh on re-upload, confirmed skip-reason counts on a bad-header CSV). Test data was cleaned up from the DB afterward.

## Current Errors
- None known.

## Known Problems
- The `generate-content` UI polls for job progress. WebSockets could be more efficient in the future.
- `npx prisma db push` / `prisma generate` in `packages/database` fails with `EPERM` on the query engine `.dll` while dev servers are running (Windows file lock). Stop `npm run dev` first if you need to regenerate the Prisma client after a schema change.

## Next Recommended Action
- Implement the actual SMTP email sending logic in the BullMQ worker when a job reaches 100%.
- Build out `/result-guide`.
- Consider removing `apps/frontend/worker.ts` (dead pg-boss code) to avoid future confusion.

## Important Notes For The Next AI
- The codebase was just refactored into a Monorepo. Do NOT attempt to move it back to a standard structure.
- Always run `npm install` at the root, and make sure Prisma client is generated (`npm run build --workspace=@venture27/database`) — but stop any running dev servers first on Windows or `prisma generate` will EPERM.

# Current State

## Last Updated
2026-07-24

## Current Project Phase
Active Development / Polishing

## Current Objective
0. Fixed real AI generation: the Generate Content dropdown's model values ('claude-3-5-sonnet', 'gemini-1-5-pro') were never valid provider model IDs, so every generation call failed and rows silently sat at status 'error'. Also discovered mid-fix that Google had fully retired `gemini-1.5-pro` - replaced it with `-latest` alias options ("Gemini Flash" / "Gemini Pro") verified working against the user's real key.
1. Fixed the Master Data CSV generate flow (`/master-data`): `{{City}}`/`{{Province}}` placeholders in Service CSV meta columns now render per-location, re-uploading a Service CSV updates its stored template instead of being silently ignored, and rows/categories can now be deleted.
2. Added a batch "Limit" to `/generate-content` so a run can be capped to N rows and continued later; fixed two BullMQ worker bugs that were blocking that (per-batch progress, a job-completion update that referenced a non-existent field). Also added a Category picker so the user chooses which category to generate instead of it being implicit.
3. Added `MasterData.published`/`publishedAt` and a publish workflow, split into two menus per the user's explicit request: `/import` (generated content not yet published, with import actions) and `/services` (published content, browsed via a "Select Service" dropdown, with a preview-only Slug column previewing the eventual `/{city}/services/{category}/{service-name}` URL structure). Both share `GET/POST /api/publish`.

## Completed
- Next.js UI pages (`/`, `/master-data`, `/generate-content`, `/settings`).
- Database schema and PostgreSQL integration via Prisma.
- Monorepo restructuring (`apps/frontend`, `apps/backend`, `packages/database`).
- Redis and BullMQ integration for background AI processing.
- Dynamic prompt injection (`{{city}}`, `{{province}}`, `{{service_name}}`, `{{category}}`).
- Job Pause/Resume/Stop logic.
- Master Data generate: `{{City}}`/`{{Province}}` interpolation in Meta Title/Description/Heading/Subheading, service-template refresh on re-upload, tolerant CSV header parsing (whitespace/BOM), and clear zero-result feedback in the UI.
- Master Data delete: per-row and per-category deletion, both API (`DELETE /api/master-data`) and UI.
- Generate Content batch limit: cap a run to the next N pending rows via a new "Limit" field; Start button becomes "Continue Generation (N remaining)" for subsequent batches. Backend worker batches deterministically (`orderBy: id asc` + `take: limit`) and reports progress per-batch.
- Generate Content category picker: dropdown showing pending/total per category, drives the same start/limit/continue flow.
- Publish workflow, split across two menus (both use `GET/POST /api/publish`; `MasterData` gained `published`/`publishedAt` columns):
  - `/import` — generated-but-unpublished content, grouped by category, with per-row/per-category/all import and a content preview modal.
  - `/services` — published content, filtered via a "Select Service" dropdown, grouped by category, with per-row unpublish, CSV export, and a preview-only "Slug" column (`app/lib/slug.ts`) showing `/{city}/services/{category}/{service-name}` - not a live route.
  - The original combined `/publish-content` page was removed in favor of this split (explicit user request).
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
- `apps/frontend/app/api/master-data/route.ts` (placeholder rendering, service template upsert, CSV parsing robustness, richer POST response, DELETE endpoint; placeholder renderer factored out to `app/lib/placeholders.ts`).
- `apps/frontend/app/master-data/page.tsx` (informative post-generate alert, delete UI).
- `apps/frontend/app/generate-content/page.tsx` (Limit input, Continue-labeled button, Category picker).
- `apps/frontend/app/api/generate/route.ts` ('start' now accepts/forwards `limit`).
- `apps/backend/src/index.ts` (batched, deterministic pending-item fetch; per-batch progress; fixed job-completion update).
- `apps/backend/src/index.ts` (`MODEL_IDS` map translates the UI's short `aiModel` value to the real provider model ID for all three providers; Gemini options updated to `-latest` aliases).
- `apps/frontend/app/generate-content/page.tsx` (AI Model dropdown: "Gemini 1.5 Pro" replaced with "Gemini Flash" + "Gemini Pro", both `-latest`).
- `packages/database/prisma/schema.prisma` (added `MasterData.published` / `publishedAt`).
- New: `apps/frontend/app/import/page.tsx`, `apps/frontend/app/services/page.tsx`, `apps/frontend/app/api/publish/route.ts`, `apps/frontend/app/lib/placeholders.ts`, `apps/frontend/app/lib/slug.ts`.
- `apps/frontend/app/components/Sidebar.tsx` (added "Import" and "Service" nav items under Post-Generation; the earlier single "Publish Content" entry no longer exists).
- Removed `apps/frontend/app/publish-content/page.tsx` (split into `/import` + `/services`).

## Current Technical Context
- The project successfully runs via `docker compose up -d` (for DB/Redis) followed by `npm run dev --workspace=@venture27/frontend` and `npm run dev --workspace=@venture27/backend`.
- Verified locally this session: Docker containers `venture27-db` (Postgres) and `venture27-redis` were already running; frontend dev server on port 3000, backend health server on port 3001. Master Data generate/delete flows and the Generate Content batch-limit flow were all tested end-to-end via direct API calls against the live DB, using throwaway test categories and (for the AI generation test) a deliberately invalid OpenAI key so no real spend occurred. Test data and the temporary key were cleaned up afterward; the user's real 260-row "Service 1" category was untouched throughout.

## Current Errors
- None known.

## Known Problems
- The `generate-content` UI polls for job progress. WebSockets could be more efficient in the future.
- `npx prisma db push` / `prisma generate` in `packages/database` fails with `EPERM` on the query engine `.dll` while dev servers are running (Windows file lock). Stop `npm run dev` first if you need to regenerate the Prisma client after a schema change.
- `apps/backend`'s `npm run dev` (`tsx src/index.ts`, no watch mode) does not hot-reload on save - must be manually restarted after editing `apps/backend/src/index.ts`.
- Pause/Resume on `/generate-content` is still broken (`resume` never re-enqueues a BullMQ job - see SESSION_HANDOVER.md). The new Limit/Continue flow avoids relying on it.
- `apps/backend/src/index.ts` line ~4 has a pre-existing (not caused by recent work) TS error: `import { prisma, MasterData } from '@venture27/database'` - `MasterData` has no exported member. Harmless at runtime (`tsx` doesn't type-check), but worth cleaning up (unused import).
- The `gemini-pro-latest` model hit a 429 (quota exceeded) on the free tier when tested directly against Google's API; `gemini-flash-latest` did not. If a user picks "Gemini Pro" and hits persistent errors, it may just be free-tier quota, not a bug.

## Next Recommended Action
- Implement the actual SMTP email sending logic in the BullMQ worker when a job reaches 100%.
- Build out `/result-guide`.
- Consider removing `apps/frontend/worker.ts` (dead pg-boss code) to avoid future confusion.
- Fix or remove the Pause/Resume buttons on `/generate-content` since Resume is currently a no-op.

## Important Notes For The Next AI
- The codebase was just refactored into a Monorepo. Do NOT attempt to move it back to a standard structure.
- Always run `npm install` at the root, and make sure Prisma client is generated (`npm run build --workspace=@venture27/database`) — but stop any running dev servers first on Windows or `prisma generate` will EPERM.

# Current State

## Last Updated
2026-07-24

## Current Project Phase
Active Development / Polishing

## Current Objective
-6. SEO + sitemap + robots.txt for the public single-service page, per explicit request. Public page gained canonical/OG/Twitter/robots meta (via `metadataBase` now set in root layout, env var `SITE_URL`) and a JSON-LD `Service` block. New chunked sitemap: `app/lib/sitemap.ts#getSitemapChunks()` groups published rows by slug type (city/community/county) into <=10,000-URL chunks named `{type}-{start}-{end}.xml`; `GET /sitemap-index.xml` lists them, `GET /sitemaps/{filename}` serves one. `app/robots.ts` disallows everything except `/city/`, `/community/`, `/county/` and points at the sitemap index.
-5. Restructured Service navigation and the public slug format, per explicit follow-up ("rubah saja menjadi sub... slugnya akan disesuaikan"). `/services` no longer exists as one page with in-page grouping - it's now three sidebar sub-menu items (`/services/city`, `/services/community`, `/services/county`, each a thin wrapper around new `app/components/ServiceListPage.tsx`), and `/services` itself redirects to `/services/city`. The public page slug changed from `/{place}/services/{category}/{service}` to `/{type}/services/{value}/{service-name}/{heading}` (type = whichever of city/community/county is primary - see `lib/location.ts#primaryLocationType` - Category dropped, a rendered Heading segment added). The old `app/[city]/services/[category]/[service]/page.tsx` route was deleted and replaced by `app/[type]/services/[value]/[service]/[heading]/page.tsx`. One real published row had an old-format slug; migrated it with a one-off script (not part of the app) - see SESSION_HANDOVER.md.
-4. `/services` gained a "Group by" tab row (Category / City / Community / County) - switching it re-groups the same table by that field instead of always Category, so each city/community/county shows up as its own expandable "sub service" section, per explicit user request.
-3. `Location.city` is now ALSO optional (was required), per explicit follow-up request - a Location just needs a Province plus at least one of City/Community/County, since generation is meant to combine "whichever of them is set". New `app/lib/location.ts` (`combineLocationName`, `primaryLocationName`) centralizes the "pick/combine whichever fields are set" logic, used for slugs, prompts (backend), confirm dialogs, modal titles, and the public page. Found and fixed a real bug during verification: `renderPlaceholders` (`app/lib/placeholders.ts`) rendered `{{City}}` as the literal text "null" on a row with no city set (JS stringifies `null` when passed to `.replace()`) - now defaults every field to `''`.
-2. Location gained separate `community`/`county` columns (both optional) alongside `city`/`province`, per explicit user request ("pisahkan kolom table untuk city, comunity dan county"). Every table showing location data (`/master-data`, `/generate-content`, `/import`, `/services`) now has 3 separate City/Community/County columns instead of a combined one; CSV upload, search, CSV export, and prompt variable substitution (`{{community}}`/`{{county}}`) all updated to match.
-1. Programmatic pages are now REAL public routes, not just an internal status. `MasterData.slug` (unique) is computed and persisted at import time; `/[city]/services/[category]/[service]/page.tsx` serves the actual page (real `<title>`/meta description via `generateMetadata`, renders stored HTML content), 404s for anything not published. The admin Sidebar/TopHeader are hidden specifically for that URL shape via a new `AppShell` component wrapping `layout.tsx`. This supersedes the earlier "publish is internal-only, no public route" note below - the user explicitly asked for real pages this time.
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
- Publish workflow, split across two menus (both use `GET/POST /api/publish`; `MasterData` gained `published`/`publishedAt`/`slug` columns):
  - `/import` — generated-but-unpublished content, grouped by category, with per-row/per-category/all import and a content preview modal.
  - `/services` — published content, filtered via a "Select Service" dropdown (defaults to "All Services"), grouped by category, with per-row unpublish, CSV export, and a "Slug"/"View Page" link to the real programmatic page (see below).
  - The original combined `/publish-content` page was removed in favor of this split (explicit user request).
- Programmatic pages are real routes now: `app/[city]/services/[category]/[service]/page.tsx` looks up `MasterData` by its stored `slug` (must be `published`), 404s otherwise, sets `<title>`/meta description from the rendered Meta Title/Description, and renders the stored HTML `content`. `AppShell` (`app/components/AppShell.tsx`) hides the dashboard Sidebar/TopHeader specifically for that URL pattern; every other route keeps the normal dashboard chrome.
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
- `apps/frontend/app/generate-content/page.tsx` (AI Model dropdown: "Gemini 1.5 Pro" replaced with "Gemini Flash" + "Gemini Pro", both `-latest`; Preview Content wired up; error messages surfaced; prompt textarea always editable; per-row/per-category Reset buttons).
- `apps/frontend/app/api/master-data/route.ts` (new `PATCH` action `'reset'`).
- New `PromptTemplate` model (`packages/database/prisma/schema.prisma`) + `apps/frontend/app/api/prompts/route.ts` (GET/POST upsert-by-name/DELETE); `/generate-content` gained a Saved Prompts dropdown + Save/Delete.
- `MasterData.slug` (unique) + `app/[city]/services/[category]/[service]/page.tsx` (new public page route) + `app/components/AppShell.tsx` (new) + `apps/frontend/app/layout.tsx` (now just wraps `<AppShell>`) + `apps/frontend/app/lib/slug.ts` (`buildSlugPreview` renamed to `buildSlug`) + `apps/frontend/app/api/publish/route.ts` (import now computes/persists a slug per row instead of a single `updateMany`).
- `packages/database/prisma/schema.prisma` (added `MasterData.published` / `publishedAt`).
- New: `apps/frontend/app/import/page.tsx`, `apps/frontend/app/services/page.tsx`, `apps/frontend/app/api/publish/route.ts`, `apps/frontend/app/lib/placeholders.ts`, `apps/frontend/app/lib/slug.ts`.
- `apps/frontend/app/components/Sidebar.tsx` (added "Import" and "Service" nav items under Post-Generation; the earlier single "Publish Content" entry no longer exists).
- Removed `apps/frontend/app/publish-content/page.tsx` (split into `/import` + `/services`).
- `packages/database/prisma/schema.prisma` (`Location.community`/`county` added, then `Location.city` made optional too - all three are now individually optional, only `province` is required).
- New `apps/frontend/app/lib/location.ts` (`combineLocationName`, `primaryLocationName`); `apps/frontend/app/lib/placeholders.ts` bug fix (null City no longer renders as literal "null"); City/Community/County split into separate columns on `/master-data`, `/generate-content`, `/import`, `/services`.

## Current Technical Context
- The project successfully runs via `docker compose up -d` (for DB/Redis) followed by `npm run dev --workspace=@venture27/frontend` and `npm run dev --workspace=@venture27/backend`.
- Verified locally this session: Docker containers `venture27-db` (Postgres) and `venture27-redis` were already running; frontend dev server on port 3000, backend health server on port 3001. Master Data generate/delete flows and the Generate Content batch-limit flow were all tested end-to-end via direct API calls against the live DB, using throwaway test categories and (for the AI generation test) a deliberately invalid OpenAI key so no real spend occurred. Test data and the temporary key were cleaned up afterward; the user's real 260-row "Service 1" category was untouched throughout.

## Current Errors
- None known. If a user reports a "View Page" / published slug 404ing, check whether it predates the `/{type}/services/{value}/{service}/{heading}` slug format (item -5 above) - anything published before that change has an old-format slug that needs recomputing (see the one-off migration approach in SESSION_HANDOVER.md; there's no in-app "recompute slug" button, would need a similar throwaway script or a real migration endpoint if this recurs often). Confirmed (user asked why Overview showed "20 locations, 13 core services" with empty data): `Location`/`Service` rows are orphaned - 0 of the 20 Location rows and 0 of the 13 Service rows are referenced by any `MasterData` row, and `MasterData` itself is 0 rows. Fixed the Overview stat to count only in-use rows (see Known Problems below). The orphaned rows themselves are still there (not deleted, by design - Delete Category never touches Location/Service) and can be reused the next time a CSV with the same City/Province/Service Name is uploaded. Root cause of the original data loss is still just a strong guess (most likely the user's own "Delete Category" click on their live SEO category) - never confirmed with the user, not fixed/reverted (there's no undo).

## Known Problems (fixed this session, kept for context)
- Content Preview List's "Preview Content" button used to be a dead stub with no `onClick` - now opens a modal (meta title/description/content).
- Error rows used to just say "Error" with no reason - `MasterData.errorMessage` now stores the caught error (cleared on a successful retry) and the UI surfaces it via a badge tooltip + the preview modal ("View Error").
- There was no way to regenerate a row short of editing the DB directly (which is what earlier fixes in this session did manually). `PATCH /api/master-data` (action 'reset') plus per-row/"Reset Errors"/"Reset Category" buttons on `/generate-content` now do this from the UI.
- The prompt.md input only accepted a file upload and then hid the content - replaced with an always-visible, always-editable textarea (file upload still works, just populates it).
- Content Preview List's columns/headers now match the Master Data table exactly (City/Community, Province, Service Name, Meta Title, Heading, Content, Image) instead of a condensed "Service & Location" + "Content Status"/"Image Status".
- Prompts weren't saved anywhere - every session meant re-uploading or retyping. New `PromptTemplate` model + `/api/prompts` (upsert-by-name) let you save a prompt under a name and reload it later via a dropdown on `/generate-content`; uploading a .md/.txt file auto-saves it under its filename.
- Generated content looked incomplete/garbled in preview. Two causes, both fixed in `apps/backend/src/index.ts`: (a) `maxTokens: 1500` was too low once Gemini's "thinking" models started spending most of that budget on invisible reasoning tokens (confirmed live: 1208/1500 spent on thinking, response cut off mid-sentence) - raised to 8000. (b) the worker only substituted `{{city}}`/`{{province}}`/`{{service_name}}`/`{{category}}`, but real-world prompt.md files use `{{City/Community}}`, `{{Service Name}}`, `{{Meta Title}}`, `{{Meta Description}}`, `{{Heading}}`, `{{Subheading}}`, `{{No}}` - unmatched variables were passed to the AI model literally, producing confused output. Added substitutions for all of them.
- Generation could hang at "running"/0% forever with no explanation if the worker failed before the per-item loop started (e.g. selected provider's API key not configured) - the throw only reached BullMQ's internal logging, never the Job DB row. Now wrapped in try/catch that sets `Job.status = 'failed'` + `Job.errorLogs`, surfaced to the user via an alert on the frontend poll.
- `/services` used to auto-select the alphabetically-first service name once data loaded, so after importing content spanning many services, only one of them showed by default - looked like "Import All" had dropped most of the content when everything had actually imported fine. Now defaults to "All Services".

## Known Problems
- The `generate-content` UI polls for job progress. WebSockets could be more efficient in the future.
- `npx prisma db push` / `prisma generate` in `packages/database` fails with `EPERM` on the query engine `.dll` while dev servers are running (Windows file lock). Stop `npm run dev` first if you need to regenerate the Prisma client after a schema change.
- `apps/backend`'s `npm run dev` (`tsx src/index.ts`, no watch mode) does not hot-reload on save - must be manually restarted after editing `apps/backend/src/index.ts`.
- `Location`/`Service` rows persist as reusable templates even after all their `MasterData` combinations are deleted (Delete Category, Reset, etc. never touch them) - by design, so re-uploading the same City/Province/Service Name later reuses the row instead of duplicating. This means `Location.count()`/`Service.count()` alone can overstate what's actually in use; `/api/overview` now filters to `data: { some: {} } }` for that reason - keep that pattern in mind for any other place that might naively count these tables.
- Pause/Resume on `/generate-content` is still broken (`resume` never re-enqueues a BullMQ job - see SESSION_HANDOVER.md). The new Limit/Continue flow avoids relying on it.
- Force-killing the backend process mid-job (e.g. `Stop-Process -Force` to apply a code change while a generation was running) causes BullMQ's stalled-job recovery to redeliver that job on the next worker start, which re-runs `runGeneration` from the top - `Job.status` gets reset to `'running'` unconditionally at the start of that function, so a job the user had explicitly clicked "Stop" on can come back to life after a backend restart, and progress can visibly regress (recalculated against the shrinking pending pool each redelivery) before catching back up. Observed directly while testing this session; not fixed (edge case tied to killing the dev process mid-run, not something that happens in normal use) - if it recurs, the fix is to check `Job.status !== 'stopped'` before that reset.
- `apps/backend/src/index.ts` line ~4 has a pre-existing (not caused by recent work) TS error: `import { prisma, MasterData } from '@venture27/database'` - `MasterData` has no exported member. Harmless at runtime (`tsx` doesn't type-check), but worth cleaning up (unused import).
- The `gemini-pro-latest` model has `limit: 0` free-tier quota on the user's key (confirmed via the real API - `generativelanguage.googleapis.com` quota metric for `model: gemini-3.1-pro` is 0); `gemini-flash-latest` works fine and is what the free tier actually supports. If a user picks "Gemini Pro" and every row errors, that's expected on a free-tier key, not a bug - the error message (now shown in the UI) will say "quota exceeded" when this is the cause.

## Next Recommended Action
- Implement the actual SMTP email sending logic in the BullMQ worker when a job reaches 100%.
- `/result-guide` is now doubly stale: it was already a static mockup describing a different URL shape, and item -6 above just implemented a REAL sitemap/robots.txt system that makes that page's hardcoded "sitemap-index.xml, state-1-10000.xml, ..." example content redundant/inconsistent with what's actually being served. Worth rewriting it to describe the real, current system instead of a fictional one.
- Consider removing `apps/frontend/worker.ts` (dead pg-boss code) to avoid future confusion.
- Fix or remove the Pause/Resume buttons on `/generate-content` since Resume is currently a no-op.
- Set a real `SITE_URL` env var before deploying anywhere other than localhost, or canonical/OG URLs and metadataBase-resolved links will point at `http://localhost:3000`.

## Important Notes For The Next AI
- The codebase was just refactored into a Monorepo. Do NOT attempt to move it back to a standard structure.
- Always run `npm install` at the root, and make sure Prisma client is generated (`npm run build --workspace=@venture27/database`) — but stop any running dev servers first on Windows or `prisma generate` will EPERM.

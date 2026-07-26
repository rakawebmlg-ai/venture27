# Known Issues

## Issue: UI Polling Overhead
Status: Investigating
Description: The `generate-content` page polls the `/api/generate` route every 2 seconds while a job is running to fetch progress. 
Impact: Minor overhead on the Next.js server and database.
Evidence: `apps/frontend/app/generate-content/page.tsx` inside the `useEffect` interval.
Possible Cause: Standard approach for MVP.
Current Workaround: Polling is restricted to only occur when `isGenerating === true`.
Recommended Next Action: Implement WebSockets or Server-Sent Events (SSE) for real-time progress updates.

## Issue: Backend Restart Silently Resumes Real (Running) Jobs
Status: Open, Reconfirmed 2026-07-25
Description: `runGeneration` in `apps/backend/src/index.ts` unconditionally sets `Job.status = 'running'` at its start. If the backend process is restarted (dev restart, deploy, crash recovery) while a Job was `status: 'running'`, BullMQ's stalled-job recovery redelivers it and `runGeneration` picks up right where it left off - with no confirmation, warning, or way to tell in advance. If the job had actually been `stopped`/`paused` by the user just before a kill mid-request, that status can get clobbered back to `running` by the same reset.
Impact: A restart can resume real AI generation using the user's real, possibly rate-limited API key without them asking for it - confirmed live 2026-07-25 when restarting the backend to test an unrelated frontend fix silently resumed a real 255-row Gemini job and burned into its free-tier daily quota before anyone noticed.
Evidence: `apps/backend/src/index.ts`, `runGeneration()`, the `await prisma.job.update({ where: { id: jobId }, data: { status: 'running' } })` near its start.
Possible Cause: The reset was written assuming a fresh 'start' every time, without accounting for BullMQ redelivering an already-in-flight job after a restart.
Current Workaround: Before restarting the backend during development, check `SELECT id, status FROM "Job" WHERE status IN ('running','paused')` first - if anything is `running`, either let it finish or `UPDATE` it to `'stopped'` first so the restart doesn't silently resume it.
Recommended Next Action: Guard the reset with `Job.status !== 'stopped'` (and probably `!== 'paused'`) before overwriting it to `'running'`, so only jobs that were genuinely still `running` at kill-time auto-resume.

## Issue: SMTP Emails Not Actually Sent
Status: Open
Description: The UI allows the user to check "Enable Email Report" and configure SMTP in settings, but the BullMQ worker does not actually dispatch an email yet.
Impact: Users do not receive completion notifications.
Evidence: `apps/backend/src/index.ts` completes the job but lacks `nodemailer` or equivalent email dispatch code.
Possible Cause: Feature pending implementation.
Current Workaround: Monitor dashboard UI for completion.
Recommended Next Action: Implement `nodemailer` in the BullMQ worker completion block.

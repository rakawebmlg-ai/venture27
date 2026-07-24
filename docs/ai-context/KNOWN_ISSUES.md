# Known Issues

## Issue: UI Polling Overhead
Status: Investigating
Description: The `generate-content` page polls the `/api/generate` route every 2 seconds while a job is running to fetch progress. 
Impact: Minor overhead on the Next.js server and database.
Evidence: `apps/frontend/app/generate-content/page.tsx` inside the `useEffect` interval.
Possible Cause: Standard approach for MVP.
Current Workaround: Polling is restricted to only occur when `isGenerating === true`.
Recommended Next Action: Implement WebSockets or Server-Sent Events (SSE) for real-time progress updates.

## Issue: SMTP Emails Not Actually Sent
Status: Open
Description: The UI allows the user to check "Enable Email Report" and configure SMTP in settings, but the BullMQ worker does not actually dispatch an email yet.
Impact: Users do not receive completion notifications.
Evidence: `apps/backend/src/index.ts` completes the job but lacks `nodemailer` or equivalent email dispatch code.
Possible Cause: Feature pending implementation.
Current Workaround: Monitor dashboard UI for completion.
Recommended Next Action: Implement `nodemailer` in the BullMQ worker completion block.

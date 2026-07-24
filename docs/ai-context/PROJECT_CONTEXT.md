# Project Context

## Project Overview
Venture 27 is a Programmatic SEO (pSEO) Dashboard system designed to generate large volumes of localized web content. It takes CSV inputs for locations and services, combines them into master data, and uses background AI workers to generate unique content for each combination.

## Project Goals
- To automate the creation of thousands of SEO-optimized pages for different service + location combinations.
- To provide a robust, non-blocking UI to manage generation jobs, pause/resume them, and configure AI models.

## Current Product Scope
- Uploading Core Services and Locations CSVs.
- Generating cross-product "Master Data" combinations.
- Prompt template configuration.
- Background generation via AI APIs (OpenAI, Anthropic, Gemini).
- Dashboard overview and statistics.

## Target Users
- SEO specialists and marketing teams who need to scale localized landing pages.

## Core Features
1. **Master Data Generation**: Upload CSVs and create thousands of combinations automatically.
2. **Content Generation Queue**: Run long-running AI content generation in the background without UI blocking or timeout issues.
3. **Settings**: Configurable AI model API Keys and SMTP settings.
4. **Dashboard**: Real-time stats and job tracking.

## Technology Stack
- **Frontend**: Next.js 14 (App Router), React 18, Tailwind CSS / Vanilla CSS.
- **Backend (Worker)**: Node.js, Express, BullMQ, Vercel AI SDK.
- **Database**: PostgreSQL (via Docker), Prisma ORM.
- **Queue/Cache**: Redis (via Docker).
- **Package Manager**: NPM (Workspaces / Monorepo).

## Development Environment
- Monorepo using NPM Workspaces.
- Docker required for Postgres and Redis.

## Frontend
- Resides in `apps/frontend/`.
- Next.js App Router.
- Uses `papaparse` for client-side CSV processing.

## Backend
- Resides in `apps/backend/`.
- Express server that primarily boots a BullMQ Worker to process the `generate-content` queue.
- Uses Vercel AI SDK to interact with LLMs.

## Database
- Resides in `packages/database/`.
- Shared Prisma Client exported to both frontend and backend.

## Authentication
- Currently UNKNOWN / NEEDS CONFIRMATION (Looks like a local tool with no explicit login implemented yet).

## Third-Party Services
- OpenAI (GPT-4o)
- Anthropic (Claude 3.5 Sonnet)
- Google (Gemini 1.5 Pro)

## Deployment
- Expected to run via Docker or traditional Node environments. Not yet fully configured for production.

## Coding Conventions
- TypeScript used across all workspaces.
- Prisma for all database interactions.
- BullMQ for all asynchronous background tasks.

## UI/UX Conventions
- Dark mode/glassmorphism aesthetic.
- Accordion-style grouped tables for Master Data.
- Real-time progress bars for generation jobs.

## Important Constraints
- AI generation is slow and rate-limited. It MUST run in the background via BullMQ. The Next.js API routes must never block waiting for AI completion.
- API keys are stored in the local database, not strictly `.env` files (for user configurability).

## Things AI Must Not Change Without Explicit Approval
- The Monorepo structure (`apps/frontend`, `apps/backend`, `packages/database`).
- The BullMQ architecture for background jobs.
- The Prisma Database Schema.
- The use of Vercel AI SDK for LLM generation.

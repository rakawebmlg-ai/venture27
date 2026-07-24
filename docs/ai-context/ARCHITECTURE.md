# Architecture

## System Overview
The application is a full-stack programmatic SEO content generator built as a Monorepo. It splits responsibilities between a Next.js frontend (for UI and API endpoints) and an Express backend (for background worker processes).

## Application Structure
Monorepo using NPM Workspaces.

## Folder Structure
```text
programmatic-venture27/
├── apps/
│   ├── frontend/         # Next.js UI & API
│   └── backend/          # Express & BullMQ Worker
├── packages/
│   └── database/         # Prisma Schema & Shared Client
├── docs/                 # Documentation & AI Context
├── docker-compose.yml    # Postgres & Redis infrastructure
└── package.json          # Root workspace config
```

## Frontend Architecture
- **Framework**: Next.js 14 (App Router).
- **Pages**: `/`, `/master-data`, `/generate-content`, `/settings`, `/history`.
- **API Routes**: Next.js App Router API (`/api/master-data`, `/api/generate`, `/api/settings`, `/api/overview`).

## Backend Architecture
- **Framework**: Express.js.
- **Core Role**: Hosts the BullMQ Worker. It connects to Redis and listens to the `generate-content` queue.
- **AI Processing**: Uses the Vercel AI SDK to prompt external LLMs. Updates the database via the shared `@venture27/database` package.

## Routing
- Next.js App Router for frontend navigation.

## Component Architecture
- React Server Components (RSC) and Client Components (`'use client'`).
- UI heavily relies on standard CSS, avoiding complex utility frameworks unless explicitly requested.

## State Management
- React `useState` and `useEffect` for local component state and data fetching.

## API Architecture
- Frontend communicates with internal Next.js API routes (`/api/*`).
- Next.js API routes query Postgres via Prisma or enqueue jobs to Redis via BullMQ.

## Database Architecture
- **Type**: PostgreSQL (RDBMS).
- **ORM**: Prisma.
- **Tables**: `Settings`, `Category`, `Location`, `Service`, `MasterData`, `Job`.
- `MasterData` is a junction table storing combinations of `Location` and `Service` and the resulting generated `content`.

## Authentication Flow
- UNKNOWN / NEEDS CONFIRMATION. No authentication middleware currently enforced.

## Data Flow
1. User uploads CSVs in Next.js UI.
2. Next.js API `/api/master-data` creates `Category`, `Location`, `Service`, and combinatorial `MasterData` records (Status: 'pending').
3. User starts generation in UI.
4. Next.js API `/api/generate` creates a `Job` record and pushes a job to BullMQ (Redis).
5. BullMQ Worker in `apps/backend` picks up the job.
6. Worker pulls `MasterData` items, injects variables into `prompt.md`, calls LLM.
7. Worker updates `MasterData` (Status: 'generated') and `Job` (Progress %).
8. UI polls `/api/generate?jobId=X` to show progress.

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

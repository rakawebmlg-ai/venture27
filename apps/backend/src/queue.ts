import Redis from 'ioredis';
import { Queue } from 'bullmq';

// Shared by the Worker (worker.ts) and the /api/generate route (which
// enqueues jobs) - both now live in this same process, so one connection
// covers both instead of the two separate ones the old split
// frontend/backend setup needed.
export const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null
});

export const generateQueue = new Queue('generate-content', { connection: redis });

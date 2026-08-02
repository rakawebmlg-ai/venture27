// Must run before any other import - `worker`/the route modules pull in
// @venture27/database's session helper, which reads SESSION_SECRET from
// process.env at module-load time. In production the container's shell
// already has DASHBOARD_USERNAME/PASSWORD/SESSION_SECRET exported (see
// deploy/entrypoint.sh), so this is a no-op there; in local dev, nothing
// else loads apps/backend/.env the way Next.js auto-loads the frontend's
// .env.local, so without this, login (now handled here, not in Next.js)
// would always fail with "not configured".
import 'dotenv/config';
import express from 'express';
import { worker } from './worker';
import authRoutes from './routes/auth';
import masterDataRoutes from './routes/masterData';
import generateRoutes from './routes/generate';
import jobsRoutes from './routes/jobs';
import overviewRoutes from './routes/overview';
import promptsRoutes from './routes/prompts';
import publishRoutes from './routes/publish';
import settingsRoutes from './routes/settings';

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());

// Reachable only from the frontend container/process (apps/frontend's
// next.config.mjs rewrites /api/:path* here) - never exposed directly to
// the internet, so no CORS setup is needed. Auth is enforced upstream by
// apps/frontend/proxy.ts before a request ever reaches this rewrite.
app.use('/api/auth', authRoutes);
app.use('/api/master-data', masterDataRoutes);
app.use('/api/generate', generateRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/overview', overviewRoutes);
app.use('/api/prompts', promptsRoutes);
app.use('/api/publish', publishRoutes);
app.use('/api/settings', settingsRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', worker: worker.isRunning() });
});

app.listen(port, () => {
  console.log(`Backend Server running on port ${port}`);
  console.log('BullMQ Worker is listening for jobs on "generate-content"...');
});

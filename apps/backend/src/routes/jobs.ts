import { Router } from 'express';
import { prisma } from '@venture27/database';

const router = Router();

// Lists past/current generation jobs for the History page. Capped at the
// most recent 200 - Job rows accumulate over time and there's no need to
// ship the entire table on every load.
router.get('/', async (req, res) => {
  try {
    const jobs = await prisma.job.findMany({
      orderBy: { id: 'desc' },
      take: 200
    });
    res.json(jobs);
  } catch (error) {
    console.error('Failed to fetch jobs:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;

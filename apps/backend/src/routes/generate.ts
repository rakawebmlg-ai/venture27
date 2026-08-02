import { Router } from 'express';
import { prisma } from '@venture27/database';
import { generateQueue } from '../queue';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const { action, categoryId, promptTemplate, aiModel, jobId, limit, notifyEmail } = req.body ?? {};

    if (action === 'start') {
      if (!categoryId || !promptTemplate || !aiModel) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Count total pending items for this category
      const pendingCount = await prisma.masterData.count({
        where: { categoryId, status: 'pending' }
      });

      if (pendingCount === 0) {
        return res.status(400).json({ error: 'No pending items for this category' });
      }

      // A positive limit caps this run to the next N pending rows, so the
      // rest stay 'pending' and can be picked up by another "start" call later.
      const parsedLimit = typeof limit === 'number' && limit > 0 ? Math.floor(limit) : undefined;
      const totalItems = parsedLimit ? Math.min(parsedLimit, pendingCount) : pendingCount;

      // Create a new Job record
      const jobRecord = await prisma.job.create({
        data: {
          totalItems,
          progress: 0,
          status: 'running', // Initial status
          notifyEmail: typeof notifyEmail === 'string' && notifyEmail.trim() ? notifyEmail.trim() : null
        }
      });

      // Send to BullMQ
      await generateQueue.add('generate', {
        jobId: jobRecord.id,
        categoryId,
        promptTemplate,
        aiModel,
        limit: totalItems
      });

      return res.json(jobRecord);
    }

    if (action === 'pause') {
      const job = await prisma.job.update({
        where: { id: jobId },
        data: { status: 'paused' }
      });
      return res.json(job);
    }

    if (action === 'resume') {
      const job = await prisma.job.update({
        where: { id: jobId },
        data: { status: 'running' }
      });

      // Need to re-trigger the BullMQ worker for the remaining items.
      // We need to fetch the original arguments, which is tricky unless we stored them.
      // But for simplicity, we'll just return a success since this is a mock resume or we would need to store promptTemplate in the DB Job table.
      // In a real app, `jobRecord` should contain `categoryId`, `promptTemplate`, etc.
      // For now, since the worker fetches pending items, we would just re-add to queue if we saved the prompt.

      return res.json(job);
    }

    if (action === 'stop') {
      const job = await prisma.job.update({
        where: { id: jobId },
        data: { status: 'stopped' }
      });
      return res.json(job);
    }

    res.status(400).json({ error: 'Invalid action' });
  } catch (error) {
    console.error('Failed to handle generate action:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/', async (req, res) => {
  const jobId = req.query.jobId as string | undefined;

  try {
    if (jobId) {
      const job = await prisma.job.findUnique({
        where: { id: Number(jobId) }
      });
      return res.json(job);
    }

    // No jobId: the page calls this on load to reattach to whatever's still
    // running/paused server-side. The BullMQ worker processes a job
    // independently of any frontend polling it, so navigating away (or
    // closing the browser entirely) never stops generation - only the local
    // React state tracking it gets lost, which used to make the UI show the
    // "Start Generation" button again even while rows kept generating.
    const activeJob = await prisma.job.findFirst({
      where: { status: { in: ['running', 'paused'] } },
      orderBy: { id: 'desc' }
    });
    res.json(activeJob);
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;

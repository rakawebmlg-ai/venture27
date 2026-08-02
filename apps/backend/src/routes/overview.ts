import { Router } from 'express';
import { prisma } from '@venture27/database';

const router = Router();

router.get('/', async (req, res) => {
  try {
    // Location/Service rows are kept as reusable templates even after their
    // Master Data combinations are deleted (e.g. via "Delete Category"), so a
    // plain count() includes orphaned rows nothing currently references -
    // "20 locations" when Master Data is actually empty. Count only rows
    // that have at least one Master Data combination using them.
    const locationsCount = await prisma.location.count({ where: { data: { some: {} } } });
    const servicesCount = await prisma.service.count({ where: { data: { some: {} } } });
    const masterDataCount = await prisma.masterData.count();
    const generatedCount = await prisma.masterData.count({ where: { status: 'generated' } });

    const lastJob = await prisma.job.findFirst({
      orderBy: { id: 'desc' }
    });

    res.json({
      stats: {
        locations: locationsCount,
        coreServices: servicesCount,
        masterDataGenerated: masterDataCount,
        contentGenerated: generatedCount
      },
      lastJob: lastJob || null
    });
  } catch (error) {
    console.error('Failed to fetch overview data:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;

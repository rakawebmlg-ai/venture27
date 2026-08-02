import { Router } from 'express';
import { prisma } from '@venture27/database';

const router = Router();

router.get('/', async (req, res) => {
  try {
    let settings = await prisma.settings.findFirst();
    if (!settings) {
      settings = await prisma.settings.create({
        data: {},
      });
    }
    res.json(settings);
  } catch (error) {
    console.error('Failed to fetch settings:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const data = req.body ?? {};
    let settings = await prisma.settings.findFirst();

    if (settings) {
      settings = await prisma.settings.update({
        where: { id: settings.id },
        data,
      });
    } else {
      settings = await prisma.settings.create({
        data,
      });
    }

    res.json(settings);
  } catch (error) {
    console.error('Failed to save settings:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;

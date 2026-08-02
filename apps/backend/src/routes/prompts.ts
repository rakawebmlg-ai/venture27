import { Router } from 'express';
import { prisma } from '@venture27/database';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const prompts = await prisma.promptTemplate.findMany({
      orderBy: { updatedAt: 'desc' }
    });
    res.json(prompts);
  } catch (error) {
    console.error('Failed to fetch prompt templates:', error);
    res.status(500).json({ error: 'Failed to fetch prompt templates' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, content } = req.body ?? {};

    if (!name || !name.trim() || !content || !content.trim()) {
      return res.status(400).json({ error: 'Name and content are required' });
    }

    // Saving under a name that already exists updates it in place, so
    // re-uploading the same prompt.md just refreshes its saved copy.
    const prompt = await prisma.promptTemplate.upsert({
      where: { name: name.trim() },
      update: { content },
      create: { name: name.trim(), content }
    });

    res.json(prompt);
  } catch (error) {
    console.error('Failed to save prompt template:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.delete('/', async (req, res) => {
  try {
    const idParam = req.query.id as string | undefined;
    const id = Number(idParam);
    if (!idParam || Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }

    await prisma.promptTemplate.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to delete prompt template:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;

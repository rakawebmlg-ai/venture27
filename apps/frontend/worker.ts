import { PrismaClient } from '@prisma/client';
import { PgBoss } from 'pg-boss';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

const prisma = new PrismaClient();

async function startWorker() {
  const boss = new PgBoss(process.env.DATABASE_URL!);
  
  boss.on('error', error => console.error(error));
  
  await boss.start();
  console.log('Worker started. Listening for jobs...');

  await boss.work('generate-content', async (job) => {
    const { jobId, categoryId, promptTemplate, aiModel } = job.data as any;
    
    // Fetch settings for API Keys
    const settings = await prisma.settings.findFirst();
    if (!settings) throw new Error("Settings not found");

    let aiProvider;
    if (aiModel === 'gpt-4o' && settings.openaiKey) {
      const openai = createOpenAI({ apiKey: settings.openaiKey });
      aiProvider = openai('gpt-4o');
    } else if (aiModel === 'claude-3-5-sonnet' && settings.anthropicKey) {
      const anthropic = createAnthropic({ apiKey: settings.anthropicKey });
      aiProvider = anthropic('claude-3-5-sonnet-20240620');
    } else if (aiModel === 'gemini-1-5-pro' && settings.geminiKey) {
      const google = createGoogleGenerativeAI({ apiKey: settings.geminiKey });
      aiProvider = google('models/gemini-1.5-pro');
    } else {
      await prisma.job.update({ where: { id: jobId }, data: { status: 'stopped', errorLogs: 'Missing API Key' } });
      return;
    }

    let isCompleted = false;

    while (!isCompleted) {
      // Check Job State
      const currentJob = await prisma.job.findUnique({ where: { id: jobId } });
      if (!currentJob) return;

      if (currentJob.status === 'stopped') {
        console.log(`Job ${jobId} stopped by user.`);
        return;
      }
      if (currentJob.status === 'paused') {
        await new Promise(r => setTimeout(r, 2000)); // Sleep while paused
        continue;
      }

      // Fetch 1 pending item
      const item = await prisma.masterData.findFirst({
        where: { categoryId, status: 'pending' },
        include: { location: true, service: true, category: true }
      });

      if (!item) {
        // No more pending items for this category
        isCompleted = true;
        await prisma.job.update({ where: { id: jobId }, data: { status: 'completed', progress: 100 } });
        console.log(`Job ${jobId} completed.`);
        break;
      }

      try {
        let prompt = promptTemplate
          .replace(/{{city}}/g, item.location.city)
          .replace(/{{province}}/g, item.location.province)
          .replace(/{{service_name}}/g, item.service.name)
          .replace(/{{category}}/g, item.category.name);

        const { text } = await generateText({
          model: aiProvider,
          prompt: prompt,
        });

        await prisma.masterData.update({
          where: { id: item.id },
          data: {
            content: text,
            status: 'generated',
            image: `${item.location.city.toLowerCase()}-${item.service.name.toLowerCase().replace(/\\s+/g, '-')}.jpg`
          }
        });

        console.log(`Generated content for MasterData ID ${item.id}`);

        // Update Job Progress
        const generatedCount = await prisma.masterData.count({ where: { categoryId, status: 'generated' } });
        const progress = Math.min(100, Math.floor((generatedCount / currentJob.totalItems) * 100));
        
        await prisma.job.update({
          where: { id: jobId },
          data: { progress }
        });
        
        // Sleep to respect rate limits
        await new Promise(r => setTimeout(r, 1000));
        
      } catch (err: any) {
        console.error(`Error generating for ID ${item.id}:`, err);
        await prisma.masterData.update({
          where: { id: item.id },
          data: { status: 'error' }
        });
      }
    }
  });
}

startWorker().catch(console.error);

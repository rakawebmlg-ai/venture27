import express from 'express';
import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { prisma, MasterData } from '@venture27/database';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

const app = express();
const port = process.env.PORT || 3001;

// Redis Connection
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null
});

// AI Config Helper
async function getSettings() {
  let settings = await prisma.settings.findFirst();
  if (!settings) {
    settings = await prisma.settings.create({ data: {} });
  }
  return settings;
}

// Job Payload Types
interface GenerationJobPayload {
  jobId: number;
  categoryId: number;
  promptTemplate: string;
  aiModel: string;
  limit?: number;
}

// BullMQ Worker
const worker = new Worker<GenerationJobPayload>(
  'generate-content',
  async (job: Job<GenerationJobPayload>) => {
    const { jobId, categoryId, promptTemplate, aiModel, limit } = job.data;
    console.log(`[Job ${job.id}] Started AI Generation for Database Job ID: ${jobId}`);

    const settings = await getSettings();

    // Setup AI provider
    let aiProvider: any;
    if (aiModel === 'gpt-4o' || aiModel.startsWith('gpt-')) {
      if (!settings.openaiKey) throw new Error('OpenAI API Key not configured');
      const openai = createOpenAI({ apiKey: settings.openaiKey });
      aiProvider = openai(aiModel);
    } else if (aiModel === 'claude-3-5-sonnet') {
      if (!settings.anthropicKey) throw new Error('Anthropic API Key not configured');
      const anthropic = createAnthropic({ apiKey: settings.anthropicKey });
      aiProvider = anthropic(aiModel);
    } else if (aiModel === 'gemini-1-5-pro') {
      if (!settings.geminiKey) throw new Error('Gemini API Key not configured');
      const google = createGoogleGenerativeAI({ apiKey: settings.geminiKey });
      aiProvider = google(aiModel);
    } else {
      throw new Error(`Unsupported AI model: ${aiModel}`);
    }

    // Fetch pending combinations for this category, capped at `limit` so a run
    // only processes the next N rows and leaves the rest 'pending' for a later run.
    const pendingItems = await prisma.masterData.findMany({
      where: { categoryId, status: 'pending' },
      include: { location: true, service: true, category: true },
      orderBy: { id: 'asc' },
      ...(limit ? { take: limit } : {})
    });

    if (pendingItems.length === 0) {
      console.log('No pending items found.');
      await prisma.job.update({ where: { id: jobId }, data: { status: 'completed', progress: 100 } });
      return;
    }

    // Update job status to running
    await prisma.job.update({
      where: { id: jobId },
      data: { status: 'running' }
    });

    let attemptedCount = 0;
    let ranToCompletion = true;

    for (const item of pendingItems) {
      // Check if job was paused or stopped
      const currentJob = await prisma.job.findUnique({ where: { id: jobId } });
      if (!currentJob) { ranToCompletion = false; break; }
      if (currentJob.status === 'stopped') {
        console.log(`Job ${jobId} was stopped.`);
        ranToCompletion = false;
        break;
      }
      if (currentJob.status === 'paused') {
        console.log(`Job ${jobId} was paused. Worker will skip remaining items, to be resumed later.`);
        ranToCompletion = false;
        break; // Stop processing, resume will create a new worker run
      }

      try {
        console.log(`Processing MasterData ID ${item.id} - ${item.location.city} - ${item.service.name}`);

        // Inject variables into prompt
        let finalPrompt = promptTemplate;
        finalPrompt = finalPrompt.replace(/\{\{city\}\}/gi, item.location.city);
        finalPrompt = finalPrompt.replace(/\{\{province\}\}/gi, item.location.province);
        finalPrompt = finalPrompt.replace(/\{\{service_name\}\}/gi, item.service.name);
        finalPrompt = finalPrompt.replace(/\{\{category\}\}/gi, item.category?.name || '');

        // Call AI
        const { text } = await generateText({
          model: aiProvider,
          prompt: finalPrompt,
          maxTokens: 1500,
        });

        // Update Master Data
        await prisma.masterData.update({
          where: { id: item.id },
          data: {
            content: text,
            status: 'generated',
            image: `${item.location.city.toLowerCase()}-${item.service.name.toLowerCase().replace(/\s+/g, '-')}.jpg`
          }
        });
      } catch (err: any) {
        console.error(`Error generating for ID ${item.id}:`, err);
        await prisma.masterData.update({
          where: { id: item.id },
          data: { status: 'error' }
        });
      }

      // Progress is scoped to this run's batch (attempted, not just successful,
      // so a single failed item doesn't stall the bar or block completion) rather
      // than the whole category's lifetime generated count.
      attemptedCount++;
      const progress = Math.min(100, Math.floor((attemptedCount / pendingItems.length) * 100));
      await prisma.job.update({
        where: { id: jobId },
        data: { progress }
      });

      // Wait to avoid rate limits
      await new Promise(r => setTimeout(r, 1000));
    }

    // Only flip to 'completed' if the batch actually ran to the end (not paused/stopped
    // mid-way) and the job wasn't paused/stopped by the time we got here.
    const finalJob = await prisma.job.findUnique({ where: { id: jobId } });
    if (finalJob && finalJob.status === 'running' && ranToCompletion) {
      // Note: `completedAt` is not a field on the Job model - do not add it here
      // without a matching schema migration, or this update throws and the job
      // silently never reaches 'completed' status.
      await prisma.job.update({
        where: { id: jobId },
        data: { status: 'completed', progress: 100 }
      });
      console.log(`Job ${jobId} completed fully.`);
    }

  },
  { connection: redis, concurrency: 1 }
);

worker.on('failed', (job, err) => {
  console.error(`BullMQ Job ${job?.id} failed:`, err);
});

// Express endpoints
app.get('/health', (req, res) => {
  res.json({ status: 'ok', worker: worker.isRunning() });
});

app.listen(port, () => {
  console.log(`Backend Server running on port ${port}`);
  console.log('BullMQ Worker is listening for jobs on "generate-content"...');
});

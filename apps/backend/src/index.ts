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

// The <select> in the Generate Content UI sends these short values as
// `aiModel`, but the actual provider SDKs need their real, versioned model
// IDs (Anthropic requires a dated snapshot; Google's SDK here requires a
// `models/` prefix and dots, not hyphens, in the version number) - passing
// the short value straight through makes every request fail with a
// model-not-found error, so every row silently ends up 'error'.
// Renders {{City}}/{{Province}} inside a Service's meta template (metaTitle,
// heading, etc.) so the values injected into the prompt below are the actual
// per-location text, not the raw "{{City}}" placeholder.
function renderMetaField(text: string | null | undefined, city: string, province: string): string {
  if (!text) return '';
  return text.replace(/\{\{\s*city\s*\}\}/gi, city).replace(/\{\{\s*province\s*\}\}/gi, province);
}

// City/Community/County are all optional now - pick whichever is actually
// set (most specific first) as the "place" name for prompt text and
// filenames, instead of assuming city is always present.
function primaryLocationName(city?: string | null, community?: string | null, county?: string | null): string {
  return community || city || county || 'location';
}

const MODEL_IDS: Record<string, string> = {
  'gpt-4o': 'gpt-4o',
  'claude-3-5-sonnet': 'claude-3-5-sonnet-20240620',
  // 'gemini-1.5-pro' was retired by Google - '-latest' aliases always point
  // at Google's current recommended model for that tier, so these shouldn't
  // go stale the same way.
  'gemini-flash-latest': 'models/gemini-flash-latest',
  'gemini-pro-latest': 'models/gemini-pro-latest',
};

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

    // Everything below is wrapped so a setup failure (missing API key,
    // unsupported model, DB hiccup before the per-item loop) marks the Job
    // row 'failed' with a reason instead of leaving it stuck at 'running'/0%
    // forever - previously an unhandled throw here only reached BullMQ's own
    // logging (`worker.on('failed', ...)`) and never touched our Job row, so
    // the UI just spun indefinitely with no way to tell what happened.
    try {
      const settings = await getSettings();

      // Setup AI provider
      const modelId = MODEL_IDS[aiModel] || (aiModel.startsWith('gpt-') ? aiModel : undefined);
      if (!modelId) throw new Error(`Unsupported AI model: ${aiModel}`);

      let aiProvider: any;
      if (aiModel === 'gpt-4o' || aiModel.startsWith('gpt-')) {
        if (!settings.openaiKey) throw new Error('OpenAI API Key not configured');
        const openai = createOpenAI({ apiKey: settings.openaiKey });
        aiProvider = openai(modelId);
      } else if (aiModel === 'claude-3-5-sonnet') {
        if (!settings.anthropicKey) throw new Error('Anthropic API Key not configured');
        const anthropic = createAnthropic({ apiKey: settings.anthropicKey });
        aiProvider = anthropic(modelId);
      } else if (aiModel.startsWith('gemini-')) {
        if (!settings.geminiKey) throw new Error('Gemini API Key not configured');
        const google = createGoogleGenerativeAI({ apiKey: settings.geminiKey });
        aiProvider = google(modelId);
      } else {
        throw new Error(`Unsupported AI model: ${aiModel}`);
      }

      await runGeneration(jobId, categoryId, promptTemplate, limit, aiProvider);
    } catch (err: any) {
      console.error(`[Job ${job.id}] Setup failed for Database Job ID: ${jobId}:`, err);
      await prisma.job.update({
        where: { id: jobId },
        data: { status: 'failed', errorLogs: String(err?.message || err).slice(0, 1000) }
      }).catch((updateErr: any) => console.error(`Also failed to record the failure on Job ${jobId}:`, updateErr));
      throw err;
    }
  },
  { connection: redis, concurrency: 1 }
);

async function runGeneration(jobId: number, categoryId: number, promptTemplate: string, limit: number | undefined, aiProvider: any) {
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
        const place = primaryLocationName(item.location.city, item.location.community, item.location.county);
        console.log(`Processing MasterData ID ${item.id} - ${place} - ${item.service.name}`);

        // Inject variables into prompt. Supports both the short snake_case
        // names shown in the UI hint ({{city}}, {{service_name}}, ...) and
        // the longer names real-world prompt.md files tend to use
        // ({{City/Community}}, {{Service Name}}, {{Meta Title}}, ...) -
        // a prompt using a variable that isn't in this list passes through
        // unreplaced, which the AI model then sees as literal "{{...}}" text
        // and tends to echo back or get confused by. City/Community/County
        // are each individually optional, so {{city}} etc. can render blank
        // for a row that only has, say, a County set.
        const city = item.location.city || '';
        const province = item.location.province;
        const community = item.location.community || '';
        const county = item.location.county || '';
        const substitutions: [RegExp, string][] = [
          [/\{\{\s*city\s*\}\}/gi, city],
          [/\{\{\s*province\s*\}\}/gi, province],
          [/\{\{\s*community\s*\}\}/gi, community],
          [/\{\{\s*county\s*\}\}/gi, county],
          // City/Community historically meant "whichever local-area name
          // applies" - now that Community is its own field, prefer it when
          // set and fall back to City.
          [/\{\{\s*city\s*\/\s*community\s*\}\}/gi, community || city],
          [/\{\{\s*service[_\s]?name\s*\}\}/gi, item.service.name],
          [/\{\{\s*category\s*\}\}/gi, item.category?.name || ''],
          [/\{\{\s*meta[_\s]?title\s*\}\}/gi, renderMetaField(item.service.metaTitle, city, province)],
          [/\{\{\s*meta[_\s]?description\s*\}\}/gi, renderMetaField(item.service.metaDescription, city, province)],
          [/\{\{\s*heading\s*\}\}/gi, renderMetaField(item.service.heading, city, province)],
          [/\{\{\s*subheading\s*\}\}/gi, renderMetaField(item.service.subheading, city, province)],
          [/\{\{\s*no\s*\}\}/gi, String(item.id)],
        ];
        let finalPrompt = promptTemplate;
        for (const [pattern, value] of substitutions) {
          finalPrompt = finalPrompt.replace(pattern, value);
        }

        // Call AI. Newer Gemini models spend part of this budget on internal
        // "thinking" tokens before writing any visible text - at 1500 that
        // regularly ate ~1200 tokens of thinking alone, so the actual article
        // got cut off mid-sentence (finishReason: MAX_TOKENS) well short of
        // what was asked for. 8000 leaves enough room for both.
        const { text } = await generateText({
          model: aiProvider,
          prompt: finalPrompt,
          maxTokens: 8000,
        });

        // Update Master Data
        await prisma.masterData.update({
          where: { id: item.id },
          data: {
            content: text,
            status: 'generated',
            errorMessage: null,
            image: `${place.toLowerCase().replace(/\s+/g, '-')}-${item.service.name.toLowerCase().replace(/\s+/g, '-')}.jpg`
          }
        });
      } catch (err: any) {
        console.error(`Error generating for ID ${item.id}:`, err);
        const errorMessage = String(err?.message || err).slice(0, 1000);
        await prisma.masterData.update({
          where: { id: item.id },
          data: { status: 'error', errorMessage }
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
}

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

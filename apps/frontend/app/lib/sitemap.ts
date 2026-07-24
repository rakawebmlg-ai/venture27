import { prisma } from '@venture27/database';

// Google's sitemap protocol caps a single sitemap file at 50,000 URLs, but
// we cap tighter at 10,000 per the requested convention, split per URL
// "type" (city/community/county - the first segment of the slug) so each
// chunk file name reads like "city-1-10000.xml".
export const SITEMAP_CHUNK_SIZE = 10000;

export interface SitemapUrlEntry {
  loc: string;
  lastmod: string;
}

export interface SitemapChunk {
  filename: string;
  type: string;
  start: number;
  end: number;
  urls: SitemapUrlEntry[];
}

export async function getSitemapChunks(): Promise<SitemapChunk[]> {
  const rows = await prisma.masterData.findMany({
    where: { published: true, slug: { not: null } },
    select: { slug: true, updatedAt: true },
    orderBy: { id: 'asc' }
  });

  const byType = new Map<string, SitemapUrlEntry[]>();
  for (const row of rows) {
    if (!row.slug) continue;
    // '/city/services/...' -> ['', 'city', 'services', ...] -> segment 1
    const type = row.slug.split('/')[1] || 'pages';
    const list = byType.get(type) || [];
    list.push({ loc: row.slug, lastmod: row.updatedAt.toISOString() });
    byType.set(type, list);
  }

  const chunks: SitemapChunk[] = [];
  for (const [type, urls] of byType) {
    for (let i = 0; i < urls.length; i += SITEMAP_CHUNK_SIZE) {
      const slice = urls.slice(i, i + SITEMAP_CHUNK_SIZE);
      const start = i + 1;
      const end = i + slice.length;
      chunks.push({ filename: `${type}-${start}-${end}.xml`, type, start, end, urls: slice });
    }
  }
  return chunks;
}

export function getBaseUrl(req: Request): string {
  const host = req.headers.get('host') || 'localhost:3000';
  const proto = req.headers.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}

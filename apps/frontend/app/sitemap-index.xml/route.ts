import { getSitemapChunks, getBaseUrl } from '../lib/sitemapData';

export async function GET(req: Request) {
  const baseUrl = getBaseUrl(req);
  const chunks = await getSitemapChunks();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${chunks.map((c) => `  <sitemap>\n    <loc>${baseUrl}/sitemaps/${c.filename}</loc>\n  </sitemap>`).join('\n')}
</sitemapindex>
`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' }
  });
}

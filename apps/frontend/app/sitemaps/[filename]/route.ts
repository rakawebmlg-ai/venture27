import { getSitemapChunks, getBaseUrl } from '../../lib/sitemapData';

// Serves one chunk file, e.g. /sitemaps/city-1-10000.xml - filenames are
// computed by getSitemapChunks() (10,000 URLs max per file, named
// {type}-{start}-{end}.xml) and linked from /sitemap-index.xml.
export async function GET(req: Request, { params }) {
  const { filename } = await params;
  const baseUrl = getBaseUrl(req);
  const chunks = await getSitemapChunks();
  const chunk = chunks.find((c) => c.filename === filename);

  if (!chunk) {
    return new Response('Not found', { status: 404 });
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${chunk.urls.map((u) => `  <url>\n    <loc>${baseUrl}${u.loc}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n  </url>`).join('\n')}
</urlset>
`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' }
  });
}

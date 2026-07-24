import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';

// Only the public programmatic pages (/{type}/services/...) should be
// crawled - everything else here is the internal admin dashboard (data
// upload, generation controls, API routes) and has no business being
// indexed or linked to from search results.
export default async function robots(): Promise<MetadataRoute.Robots> {
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const proto = headersList.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https');
  const baseUrl = `${proto}://${host}`;

  return {
    rules: {
      userAgent: '*',
      // Disallow everything by default (the whole site is the internal admin
      // dashboard), then explicitly carve out the public programmatic page
      // prefixes - safer than an explicit disallow list that has to be kept
      // in sync with every admin route that gets added later.
      disallow: '/',
      allow: ['/city/', '/community/', '/county/'],
    },
    sitemap: `${baseUrl}/sitemap-index.xml`,
  };
}

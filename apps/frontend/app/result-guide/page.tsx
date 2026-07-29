import { prisma } from '@venture27/database';
import { headers } from 'next/headers';
import { getSitemapChunks } from '../lib/sitemap';
import { renderPlaceholders } from '../lib/placeholders';
import { combineLocationName } from '../lib/location';

export default async function ResultGuidePage() {
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const proto = headersList.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https');
  const baseUrl = `${proto}://${host}`;

  const [publishedCount, chunks, exampleRow] = await Promise.all([
    prisma.masterData.count({ where: { published: true } }),
    getSitemapChunks(),
    prisma.masterData.findFirst({
      where: { published: true, slug: { not: null } },
      include: { location: true, service: true, category: true },
      orderBy: { updatedAt: 'desc' }
    })
  ]);

  const totalSitemapUrls = chunks.reduce((sum, c) => sum + c.urls.length, 0);

  let exampleUrl: string | null = null;
  let exampleJsonLd: Record<string, any> | null = null;
  if (exampleRow) {
    exampleUrl = `${baseUrl}${exampleRow.slug}`;
    const locationLabel = combineLocationName(exampleRow.location.city, exampleRow.location.community, exampleRow.location.county);
    const metaDescription = renderPlaceholders(exampleRow.service.metaDescription, exampleRow.location);
    exampleJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: exampleRow.service.name,
      ...(metaDescription ? { description: metaDescription } : {}),
      areaServed: { '@type': 'Place', name: `${locationLabel}, ${exampleRow.location.province}` },
      ...(exampleRow.category?.name ? { category: exampleRow.category.name } : {}),
    };
  }

  return (
    <>
      <div className="page-title-section">
        <h1 className="page-title">Result Guide</h1>
        <p className="page-subtitle">How the public programmatic pages, sitemap, and robots.txt actually work in this app</p>
      </div>

      {/* Live Status Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(91, 235, 205, 0.1), rgba(34, 197, 94, 0.05))',
        border: '1px solid rgba(91, 235, 205, 0.2)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '24px',
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: 'rgba(34, 197, 94, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          flexShrink: 0,
        }}>{publishedCount > 0 ? '✅' : 'ℹ️'}</div>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {publishedCount > 0 ? 'Public pages are live' : 'No pages published yet'}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            {publishedCount} page{publishedCount === 1 ? '' : 's'} published • {chunks.length} sitemap file{chunks.length === 1 ? '' : 's'} • {totalSitemapUrls} URL{totalSitemapUrls === 1 ? '' : 's'} in the sitemap right now
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Step 1: URL Structure */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              <span style={{ color: 'var(--color-blue-400)', marginRight: '8px' }}>01</span>
              URL Structure
            </span>
          </div>
          <div className="card-body" style={{ lineHeight: 1.8 }}>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
              Each published page's URL is built from whichever location field (City, Community, or County) is the most specific one set on that row - that field becomes <code style={{ fontFamily: 'var(--font-mono)' }}>{'{type}'}</code>:
            </p>
            <div style={{
              background: 'var(--color-bg-primary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              padding: '16px',
              fontFamily: 'var(--font-mono)',
              fontSize: '13px',
              color: 'var(--color-blue-300)',
              lineHeight: 2,
            }}>
              <div>{baseUrl}/<span style={{ color: 'var(--color-blue-400)' }}>{'{type}'}</span>/services/<span style={{ color: 'var(--color-success)' }}>{'{value}'}</span>/<span style={{ color: 'var(--color-warning)' }}>{'{service}'}</span>/<span style={{ color: '#a855f7' }}>{'{heading}'}</span></div>
              <div style={{ marginTop: '4px', color: 'var(--color-text-muted)', fontSize: '11px' }}>
                type: city | community | county &middot; value: the location's slugified name &middot; service: the service name slug &middot; heading: the rendered page heading slug
              </div>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '12px' }}>
              {exampleUrl ? (
                <>Live example: <a href={exampleUrl} target="_blank" rel="noreferrer" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-blue-300)', background: 'rgba(91,235,205,0.08)', padding: '2px 6px', borderRadius: '3px', textDecoration: 'none' }}>
                {exampleUrl}
              </a></>
              ) : (
                'No published pages yet - publish a row on the Service page to see a live example here.'
              )}
            </p>
          </div>
        </div>

        {/* Step 2: Page Data */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              <span style={{ color: 'var(--color-blue-400)', marginRight: '8px' }}>02</span>
              Structured Data (JSON-LD)
            </span>
          </div>
          <div className="card-body">
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
              Every published page embeds this <code style={{ fontFamily: 'var(--font-mono)' }}>schema.org/Service</code> block in a <code style={{ fontFamily: 'var(--font-mono)' }}>{'<script type="application/ld+json">'}</code> tag - only fields with real data are included, nothing is invented:
            </p>
            {exampleJsonLd ? (
              <pre style={{
                background: 'var(--color-bg-primary)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                padding: '16px',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                color: 'var(--color-success)',
                lineHeight: 1.8,
                overflowX: 'auto',
                whiteSpace: 'pre',
              }}>
                {JSON.stringify(exampleJsonLd, null, 2)}
              </pre>
            ) : (
              <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>No published pages yet.</div>
            )}
          </div>
        </div>

        {/* Step 3: Sitemap & robots.txt */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              <span style={{ color: 'var(--color-blue-400)', marginRight: '8px' }}>03</span>
              Sitemap & robots.txt
            </span>
          </div>
          <div className="card-body" style={{ lineHeight: 1.8 }}>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
              <code style={{ fontFamily: 'var(--font-mono)' }}>/sitemap-index.xml</code> lists every chunk file below, generated on the fly from currently-published rows - chunked into groups of up to 10,000 URLs per <code style={{ fontFamily: 'var(--font-mono)' }}>{'{type}'}</code>. These are the chunks that exist right now:
            </p>
            {chunks.length > 0 ? (
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>File</th>
                      <th>URLs</th>
                      <th>Type</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>sitemap-index.xml</td>
                      <td>—</td>
                      <td><span className="badge badge-info">Index</span></td>
                      <td><span className="badge badge-success"><span className="badge-dot"></span> Live</span></td>
                    </tr>
                    {chunks.map((c) => (
                      <tr key={c.filename}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{c.filename}</td>
                        <td>{c.urls.length}</td>
                        <td><span className="badge badge-neutral">{c.type}</span></td>
                        <td><span className="badge badge-success"><span className="badge-dot"></span> Live</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>No sitemap chunks yet - they appear once at least one page is published.</div>
            )}

            <div style={{ marginTop: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                robots.txt (served live at {baseUrl}/robots.txt)
              </div>
              <div style={{
                background: 'var(--color-bg-primary)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                padding: '14px',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                color: 'var(--color-text-secondary)',
                lineHeight: 1.8,
              }}>
                <div>User-agent: *</div>
                <div>Disallow: /</div>
                <div>Allow: /city/</div>
                <div>Allow: /community/</div>
                <div>Allow: /county/</div>
                <div style={{ marginTop: '8px' }}>Sitemap: {baseUrl}/sitemap-index.xml</div>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '8px' }}>
                Everything is disallowed by default (this whole site is otherwise the internal admin dashboard), with only the public page prefixes explicitly allowed.
              </p>
            </div>
          </div>
        </div>

        {/* Step 4: Next Steps */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              <span style={{ color: 'var(--color-blue-400)', marginRight: '8px' }}>04</span>
              Deploying For Real
            </span>
          </div>
          <div className="card-body">
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
              There's no separate "marketing site" or proxy to set up - this Next.js app serves the public pages directly.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { text: <>Set a real <code style={{ fontFamily: 'var(--font-mono)' }}>SITE_URL</code> environment variable before deploying anywhere other than localhost - canonical/OG URLs and the sitemap currently resolve against {baseUrl}.</>, icon: '🌐' },
                { text: 'Deploy this app (apps/frontend) to your hosting/CDN of choice - it serves both the admin dashboard and the public pages.', icon: '🚀' },
                { text: 'Point your production domain\'s DNS at that deployment.', icon: '🔗' },
                { text: `Submit ${baseUrl}/sitemap-index.xml to Google Search Console.`, icon: '📤' },
                { text: 'Monitor indexing and search performance in Search Console.', icon: '📊' },
              ].map((step, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '14px 16px',
                  background: 'var(--color-bg-tertiary)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                }}>
                  <span style={{ fontSize: '20px' }}>{step.icon}</span>
                  <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>{step.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

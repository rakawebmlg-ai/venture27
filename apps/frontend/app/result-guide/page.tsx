export default function ResultGuidePage() {
  return (
    <>
      <div className="page-title-section">
        <h1 className="page-title">Result Guide</h1>
        <p className="page-subtitle">How to use the generated pages on your Marketing Site</p>
      </div>

      {/* Completion Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(34, 197, 94, 0.05))',
        border: '1px solid rgba(59, 130, 246, 0.2)',
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
        }}>✅</div>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Last Generation Completed Successfully
          </div>
          <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '2px' }}>
            156,240 pages generated across 5 services • 16 sitemap files created • Completed July 20, 2026
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
              Each generated page has a unique URL following this pattern:
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
              <div><span style={{ color: 'var(--color-text-muted)' }}>// Service + Province</span></div>
              <div>https://service.venture27.com/<span style={{ color: 'var(--color-blue-400)' }}>{'{service}'}</span>/<span style={{ color: 'var(--color-success)' }}>{'{province}'}</span></div>
              <br />
              <div><span style={{ color: 'var(--color-text-muted)' }}>// Service + Province + City</span></div>
              <div>https://service.venture27.com/<span style={{ color: 'var(--color-blue-400)' }}>{'{service}'}</span>/<span style={{ color: 'var(--color-success)' }}>{'{province}'}</span>/<span style={{ color: 'var(--color-warning)' }}>{'{city}'}</span></div>
              <br />
              <div><span style={{ color: 'var(--color-text-muted)' }}>// Full path with all levels</span></div>
              <div>https://service.venture27.com/<span style={{ color: 'var(--color-blue-400)' }}>{'{service}'}</span>/<span style={{ color: 'var(--color-success)' }}>{'{province}'}</span>/<span style={{ color: 'var(--color-warning)' }}>{'{city}'}</span>/<span style={{ color: '#a855f7' }}>{'{county}'}</span>/<span style={{ color: 'var(--color-info)' }}>{'{community}'}</span></div>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '12px' }}>
              Example: <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-blue-300)', background: 'rgba(91,235,205,0.08)', padding: '2px 6px', borderRadius: '3px' }}>
                https://service.venture27.com/plumbing-services/jawa-barat/bandung/coblong/dago
              </code>
            </p>
          </div>
        </div>

        {/* Step 2: Page Data Structure */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              <span style={{ color: 'var(--color-blue-400)', marginRight: '8px' }}>02</span>
              Page Data Structure
            </span>
          </div>
          <div className="card-body">
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
              Each generated page contains the following data fields:
            </p>
            <div style={{
              background: 'var(--color-bg-primary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              padding: '16px',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: 'var(--color-text-secondary)',
              lineHeight: 1.8,
            }}>
              <div>{'{'}</div>
              <div style={{ paddingLeft: '20px' }}><span style={{ color: 'var(--color-blue-300)' }}>"title"</span>: <span style={{ color: 'var(--color-success)' }}>"Plumbing Services in Bandung, Jawa Barat"</span>,</div>
              <div style={{ paddingLeft: '20px' }}><span style={{ color: 'var(--color-blue-300)' }}>"slug"</span>: <span style={{ color: 'var(--color-success)' }}>"plumbing-services/jawa-barat/bandung"</span>,</div>
              <div style={{ paddingLeft: '20px' }}><span style={{ color: 'var(--color-blue-300)' }}>"keywords"</span>: <span style={{ color: 'var(--color-success)' }}>"plumbing, bandung, jawa barat, services"</span>,</div>
              <div style={{ paddingLeft: '20px' }}><span style={{ color: 'var(--color-blue-300)' }}>"content"</span>: <span style={{ color: 'var(--color-success)' }}>"&lt;h1&gt;Professional Plumbing...&lt;/h1&gt;..."</span>,</div>
              <div style={{ paddingLeft: '20px' }}><span style={{ color: 'var(--color-blue-300)' }}>"service_ref"</span>: <span style={{ color: 'var(--color-success)' }}>"plumbing-services"</span>,</div>
              <div style={{ paddingLeft: '20px' }}><span style={{ color: 'var(--color-blue-300)' }}>"location_ref"</span>: <span style={{ color: 'var(--color-success)' }}>"jawa-barat/bandung"</span>,</div>
              <div style={{ paddingLeft: '20px' }}><span style={{ color: 'var(--color-blue-300)' }}>"generated_at"</span>: <span style={{ color: 'var(--color-success)' }}>"2026-07-20T16:45:22Z"</span>,</div>
              <div style={{ paddingLeft: '20px' }}><span style={{ color: 'var(--color-blue-300)' }}>"status"</span>: <span style={{ color: 'var(--color-success)' }}>"published"</span></div>
              <div>{'}'}</div>
            </div>
          </div>
        </div>

        {/* Step 3: Sitemap & SEO */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              <span style={{ color: 'var(--color-blue-400)', marginRight: '8px' }}>03</span>
              Sitemap & SEO Files
            </span>
          </div>
          <div className="card-body" style={{ lineHeight: 1.8 }}>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
              Sitemaps are automatically generated and chunked into files of max 10,000 URLs each.
            </p>
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
                    <td><span className="badge badge-success"><span className="badge-dot"></span> Ready</span></td>
                  </tr>
                  <tr>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>state-1-10000.xml</td>
                    <td>10,000</td>
                    <td><span className="badge badge-neutral">Province</span></td>
                    <td><span className="badge badge-success"><span className="badge-dot"></span> Ready</span></td>
                  </tr>
                  <tr>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>city-1-10000.xml</td>
                    <td>10,000</td>
                    <td><span className="badge badge-neutral">City</span></td>
                    <td><span className="badge badge-success"><span className="badge-dot"></span> Ready</span></td>
                  </tr>
                  <tr>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>city-10001-20000.xml</td>
                    <td>10,000</td>
                    <td><span className="badge badge-neutral">City</span></td>
                    <td><span className="badge badge-success"><span className="badge-dot"></span> Ready</span></td>
                  </tr>
                  <tr>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>county-1-10000.xml</td>
                    <td>10,000</td>
                    <td><span className="badge badge-neutral">County</span></td>
                    <td><span className="badge badge-success"><span className="badge-dot"></span> Ready</span></td>
                  </tr>
                  <tr>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>robots.txt</td>
                    <td>—</td>
                    <td><span className="badge badge-info">Robots</span></td>
                    <td><span className="badge badge-success"><span className="badge-dot"></span> Ready</span></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* robots.txt preview */}
            <div style={{ marginTop: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                robots.txt preview
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
                <div>Allow: /</div>
                <div style={{ marginTop: '8px' }}>Sitemap: https://service.venture27.com/sitemap-index.xml</div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 4: Next Steps */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              <span style={{ color: 'var(--color-blue-400)', marginRight: '8px' }}>04</span>
              Next Steps
            </span>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { num: '1', text: 'Deploy the Marketing Site proxy to your server or CDN', icon: '🚀' },
                { num: '2', text: 'Configure the proxy to fetch page data from the generation API', icon: '⚙️' },
                { num: '3', text: 'Point your domain DNS to the Marketing Site', icon: '🌐' },
                { num: '4', text: 'Submit sitemap-index.xml to Google Search Console', icon: '📤' },
                { num: '5', text: 'Monitor search engine indexing and page performance', icon: '📊' },
              ].map((step) => (
                <div key={step.num} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '14px 16px',
                  background: 'var(--color-bg-tertiary)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  transition: 'all 0.15s',
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

import { prisma } from '@venture27/database';
import { notFound } from 'next/navigation';
import { renderPlaceholders } from '../../../../lib/placeholders';

async function getPage(city: string, category: string, service: string) {
  const slug = `/${city}/services/${category}/${service}`;
  return prisma.masterData.findFirst({
    where: { slug, published: true },
    include: { location: true, service: true, category: true }
  });
}

export async function generateMetadata({ params }) {
  const { city, category, service } = await params;
  const item = await getPage(city, category, service);
  if (!item) return {};

  const metaTitle = renderPlaceholders(item.service.metaTitle, item.location) || item.service.name;
  const metaDescription = renderPlaceholders(item.service.metaDescription, item.location) || undefined;

  return {
    title: metaTitle,
    description: metaDescription,
  };
}

export default async function ProgrammaticPage({ params }) {
  const { city, category, service } = await params;
  const item = await getPage(city, category, service);
  if (!item) notFound();

  const { city: cityName, community, county, province } = item.location;
  const locationLabel = [cityName, community, county].filter(Boolean).join(', ');
  const heading = renderPlaceholders(item.service.heading, item.location) || item.service.name;
  const subheading = renderPlaceholders(item.service.subheading, item.location);

  return (
    <div style={{ minHeight: '100vh', background: '#0a0e14', color: '#e5e7eb' }}>
      <header style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '20px 24px' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'linear-gradient(135deg,#3b82f6,#22c55e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#0a0e14' }}>V27</div>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#9ca3af' }}>{item.category?.name}</span>
        </div>
      </header>

      <main style={{ maxWidth: '760px', margin: '0 auto', padding: '48px 24px 80px' }}>
        <div style={{ fontSize: '13px', color: '#3b82f6', fontWeight: 600, letterSpacing: '0.5px', marginBottom: '12px', textTransform: 'uppercase' }}>
          {locationLabel}, {province}
        </div>

        {/* If the generated content already includes its own <h1> (most
            prompts are instructed to), skip rendering a second one here. */}
        {!/<h1[\s>]/i.test(item.content || '') && (
          <>
            <h1 style={{ fontSize: '34px', fontWeight: 800, lineHeight: 1.25, margin: '0 0 12px', color: '#f9fafb' }}>{heading}</h1>
            {subheading && (
              <p style={{ fontSize: '17px', color: '#9ca3af', margin: '0 0 32px', lineHeight: 1.6 }}>{subheading}</p>
            )}
          </>
        )}

        <article
          className="programmatic-content"
          dangerouslySetInnerHTML={{ __html: item.content || '<p>Content coming soon.</p>' }}
        />

        <footer style={{ marginTop: '56px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: '12px', color: '#6b7280' }}>
          {item.service?.name} &middot; {locationLabel}, {province}
        </footer>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .programmatic-content { font-size: 16px; line-height: 1.75; color: #d1d5db; }
        .programmatic-content h1 { font-size: 34px; font-weight: 800; line-height: 1.25; color: #f9fafb; margin: 0 0 16px; }
        .programmatic-content h2 { font-size: 24px; font-weight: 700; color: #f3f4f6; margin: 40px 0 16px; }
        .programmatic-content h3 { font-size: 19px; font-weight: 700; color: #f3f4f6; margin: 28px 0 12px; }
        .programmatic-content p { margin: 0 0 18px; }
        .programmatic-content ul { margin: 0 0 18px; padding-left: 22px; }
        .programmatic-content li { margin-bottom: 8px; }
        .programmatic-content strong { color: #f3f4f6; }
      ` }} />
    </div>
  );
}

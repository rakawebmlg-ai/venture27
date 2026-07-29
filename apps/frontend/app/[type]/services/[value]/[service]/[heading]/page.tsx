import { prisma } from '@venture27/database';
import { notFound } from 'next/navigation';
import { renderPlaceholders } from '../../../../../lib/placeholders';
import { combineLocationName } from '../../../../../lib/location';

// [type] is 'city' | 'community' | 'county' (whichever was primary for this
// row at import time - see lib/location.ts#primaryLocationType), [value] is
// that field's slugified value. The full path is matched against the
// stored MasterData.slug rather than parsed apart, since that's the exact
// same string computed by /api/publish at import time.
async function getPage(type: string, value: string, service: string, heading: string) {
  const slug = `/${type}/services/${value}/${service}/${heading}`;
  return prisma.masterData.findFirst({
    where: { slug, published: true },
    include: { location: true, service: true, category: true }
  });
}

export async function generateMetadata({ params }) {
  const { type, value, service, heading } = await params;
  const item = await getPage(type, value, service, heading);
  if (!item) return {};

  const metaTitle = renderPlaceholders(item.service.metaTitle, item.location) || item.service.name;
  const metaDescription = renderPlaceholders(item.service.metaDescription, item.location) || undefined;
  const canonicalPath = item.slug as string;

  return {
    title: metaTitle,
    description: metaDescription,
    alternates: {
      canonical: canonicalPath,
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      url: canonicalPath,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: metaTitle,
      description: metaDescription,
    },
  };
}

// Nav items and footer link columns mirror the real venture27.com site
// (this pSEO tool has no public marketing site of its own - these
// programmatic pages are meant to sit alongside/link back into it), so
// they're real links to venture27.com, opened in a new tab since it's a
// different site entirely. Hrefs/labels copied directly from the live
// site's markup (2026-07) rather than guessed - e.g. the footer's Legal
// column really is just 2 items ("Privacy Policy"/"Terms Of Service", no
// Blog), and the top nav has no "Contact" item.
const SITE_URL = 'https://www.venture27.com';

const NAV_ITEMS = [
  { label: 'Home', href: `${SITE_URL}/` },
  { label: 'Services', href: `${SITE_URL}/services` },
  { label: 'Our Approach', href: `${SITE_URL}/detail` },
  { label: 'Why Choose Us', href: `${SITE_URL}/about` },
  { label: 'Recent work', href: `${SITE_URL}/#Recent-work` },
];

// Titles are cased exactly as authored on the real site, not force-uppercased
// - "SERVICES" really is all-caps in their source, but "Venture27"/"Legal"
// are plain title-case there (a previous version of this page forced all
// three through .toUpperCase(), which wrongly rendered "VENTURE27"/"LEGAL").
const FOOTER_COLUMNS = [
  {
    title: 'SERVICES',
    links: [
      ['Interface Design', '/interface-design'],
      ['Mobile App Development', '/mobile-app-development'],
      ['Web Application Development', '/web-application-development'],
      ['Custom Software Development', '/custom-software-development'],
      ['Digital Product Engineering', '/digital-product-engineering'],
      ['Digital Marketing', '/digital-marketing'],
      ['Search Engine Optimization', '/search-engine-optimization'],
      ['Websites That Convert', '/websites-that-convert'],
      ['Digital Commerce', '/digital-commerce'],
      ['Digital Transformation', '/digital-transformation'],
      ['Cloud & DevOps', '/cloud-devops'],
      ['Artificial Intelligence', '/artificial-intelligence'],
      ['Cybersecurity', '/cybersecurity'],
      ['ERP Systems', '/erp'],
      ['CRM Systems', '/crm-systems'],
    ].map(([label, path]) => ({ label, href: `${SITE_URL}${path}` })),
  },
  {
    title: 'Venture27',
    links: [
      { label: 'About', href: `${SITE_URL}/about` },
      { label: 'Contact', href: `${SITE_URL}/contact` },
      { label: 'Request A Call', href: 'https://calendly.com/venture27/discovery-call?month=2025-09' },
      { label: 'Request Estimate', href: `${SITE_URL}/` },
    ],
  },
  {
    title: 'Legal',
    links: [
      // The real site's own footer links to /Privacy-and-Policy and
      // /Terms-and-Conditions, but both 404 there (confirmed live) - its
      // sitemap.xml only lists /privacy-policy as a real page, so that's
      // used here instead of literally reproducing a dead link. No working
      // Terms page exists anywhere on the real site as of this writing, so
      // Terms still points at their (currently broken) URL - nothing better
      // to link to.
      { label: 'Privacy Policy', href: `${SITE_URL}/privacy-policy` },
      { label: 'Terms Of Service', href: `${SITE_URL}/Terms-and-Conditions` },
    ],
  },
];

export default async function ProgrammaticPage({ params }) {
  const { type, value, service, heading } = await params;
  const item = await getPage(type, value, service, heading);
  if (!item) notFound();

  const { city: cityName, community, county, province } = item.location;
  const locationLabel = combineLocationName(cityName, community, county);
  const renderedHeading = renderPlaceholders(item.service.heading, item.location) || item.service.name;
  const subheading = renderPlaceholders(item.service.subheading, item.location);
  const metaDescription = renderPlaceholders(item.service.metaDescription, item.location);

  // Service structured data (schema.org) - only fields we actually have real
  // values for; no invented ratings/address/phone, matching the same rule
  // the content-generation prompt itself follows.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: item.service?.name,
    ...(metaDescription ? { description: metaDescription } : {}),
    areaServed: {
      '@type': 'Place',
      name: `${locationLabel}, ${province}`,
    },
    ...(item.category?.name ? { category: item.category.name } : {}),
  };

  return (
    <div className="ppage">
      {/* eslint-disable-next-line react/no-danger */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className="ppage-navbar">
        <div className="ppage-navbar-inner">
          <img src="/venture27-logo.png" alt="Venture27" className="ppage-logo" />
          <div className="ppage-nav-links">
            {NAV_ITEMS.map((item) => (
              <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer" className="ppage-nav-link">
                {item.label}
              </a>
            ))}
          </div>
          <a href={`${SITE_URL}/`} target="_blank" rel="noopener noreferrer" className="ppage-cta-button">
            Request An Estimate
          </a>
        </div>
      </nav>

      <main className="ppage-main">
        <div className="ppage-main-col">
          <span className="ppage-back-link">
            <img src="/service-page/icon-back.svg" alt="" width={14} height={14} />
            Back to services
          </span>

          <div className="ppage-eyebrow">{locationLabel}, {province}</div>

          {/* If the generated content already includes its own <h1> (most
              prompts are instructed to), skip rendering a second one here -
              a page should only ever have one <h1>. */}
          {!/<h1[\s>]/i.test(item.content || '') && (
            <>
              <h1 className="ppage-h1">{renderedHeading}</h1>
              {subheading && <p className="ppage-subheading">{subheading}</p>}
            </>
          )}

          <article
            className="ppage-content"
            dangerouslySetInnerHTML={{ __html: item.content || '<p>Content coming soon.</p>' }}
          />

          <footer className="ppage-content-footer">
            {item.service?.name} &middot; {locationLabel}, {province}
          </footer>
        </div>

        {/* Static lead-capture form matching the mockup - not wired to any
            backend yet (this app has no lead/CRM storage), so the submit
            control is a plain non-submitting button rather than a real
            <form action>, consistent with the nav/footer links elsewhere on
            this page also being visual-only until a real destination exists. */}
        <aside className="ppage-form-card">
          <div className="ppage-form-heading">Request Estimate</div>
          <p className="ppage-form-intro">
            Have a specific question or request? Fill out the form below, and we'll get back to you as soon as possible, usually within one business day.
          </p>

          <div className="ppage-form-fields">
            <div className="ppage-form-field">
              <label className="ppage-form-label">Name <span className="ppage-form-required">*</span></label>
              <input type="text" placeholder="Full Name" className="ppage-form-input" />
            </div>
            <div className="ppage-form-field">
              <label className="ppage-form-label">Email <span className="ppage-form-required">*</span></label>
              <input type="email" placeholder="email@domain.com" className="ppage-form-input" />
            </div>
            <div className="ppage-form-field">
              <label className="ppage-form-label">Phone</label>
              <div className="ppage-form-phone">
                <img src="/service-page/icon-flag-us.svg" alt="" width={32} height={24} />
                <span className="ppage-form-phone-code">+1</span>
                <img src="/service-page/icon-caret-down.svg" alt="" width={14} height={14} />
                <input type="tel" placeholder="xxxx-xxxx-xxxx" className="ppage-form-phone-input" />
              </div>
            </div>
            <div className="ppage-form-field">
              <label className="ppage-form-label">Company</label>
              <input type="text" placeholder="Company Name" className="ppage-form-input" />
            </div>
            <div className="ppage-form-field">
              <label className="ppage-form-label">How Can We Help? <span className="ppage-form-required">*</span></label>
              <textarea placeholder="Your message..." className="ppage-form-textarea" rows={4} />
            </div>
          </div>

          <button type="button" className="ppage-form-submit">Request an Estimate</button>
        </aside>
      </main>

      <footer className="ppage-footer">
        <div className="ppage-footer-inner">
          <div className="ppage-footer-col ppage-footer-company">
            <img src="/venture27-logo.png" alt="Venture27" className="ppage-footer-logo" />
            <p className="ppage-footer-about">
              From concept to launch, we design, build, and scale web &amp; mobile apps, custom software, and digital solutions — all under one roof.
            </p>
            <p className="ppage-footer-copyright">Copyright &copy; {new Date().getFullYear()} Venture27</p>
          </div>
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title} className="ppage-footer-col">
              <div className="ppage-footer-title">{col.title}</div>
              {col.links.map((link) => (
                <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" className="ppage-footer-link">
                  {link.label}
                </a>
              ))}
            </div>
          ))}
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        @property --ppage-angle { syntax: '<angle>'; initial-value: 20deg; inherits: false; }
        @property --ppage-c1 { syntax: '<color>'; initial-value: transparent; inherits: false; }
        @property --ppage-c2 { syntax: '<color>'; initial-value: transparent; inherits: false; }

        .ppage { min-height: 100vh; background: #090A0E; color: #FFFFFF; font-family: var(--font-inter), Inter, sans-serif; }

        /* Navbar - hover/CTA styling mirrors the real site's animated
           gradient-border technique exactly (verified from its actual
           embedded <style> block): a 3-layer background (tint + black
           overlay + an angle/color-animated border gradient using
           @property so the custom properties transition smoothly instead
           of snapping), not a JS-driven effect. */
        .ppage-navbar { position: sticky; top: 0; z-index: 10; background: rgba(0,0,0,0.05); backdrop-filter: blur(50px); border-bottom: 1px solid transparent; border-image: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0) 100%) 1; }
        .ppage-navbar-inner { max-width: 1512px; margin: 0 auto; padding: 14px 48px; display: flex; align-items: center; justify-content: space-between; gap: 24px; }
        .ppage-logo { width: 235px; height: 38px; display: block; }
        .ppage-nav-links { display: flex; align-items: center; }
        .ppage-nav-link {
          --ppage-angle: 20deg; --ppage-c1: transparent; --ppage-c2: transparent;
          margin: 0 17px; padding: 10px 16px; border-radius: 10px; font-size: 16px; font-weight: 400;
          color: #99A1AF; text-decoration: none; white-space: nowrap;
          background-color: transparent; border: 1px solid transparent;
          transition: --ppage-angle .6s ease-out, --ppage-c1 .6s ease-out, color .15s;
        }
        .ppage-nav-link:hover {
          --ppage-c1: #ffffff40; --ppage-angle: 90deg;
          color: #FFFFFF;
          background-image: linear-gradient(#FFFFFF0D), linear-gradient(#000000), linear-gradient(var(--ppage-angle), var(--ppage-c1), transparent);
          background-clip: padding-box, padding-box, border-box;
          background-origin: border-box, border-box, border-box;
        }
        .ppage-cta-button {
          --ppage-angle: 20deg; --ppage-c1: #ffffff26; --ppage-c2: #ffffff26;
          flex-shrink: 0; padding: 14px; border-radius: 10px;
          background-color: transparent; border: 1px solid transparent;
          color: #FFFFFF; font-size: 16px; font-weight: 500; text-decoration: none; text-align: center;
          background-image: linear-gradient(#FFFFFF03), linear-gradient(#000000BF), linear-gradient(var(--ppage-angle), var(--ppage-c1), transparent, var(--ppage-c2));
          background-clip: padding-box, padding-box, border-box;
          background-origin: border-box, border-box, border-box;
          transition: --ppage-angle .6s ease-out, --ppage-c1 .6s ease-out, --ppage-c2 .6s ease-out, box-shadow .3s ease-out, transform .3s ease-out;
        }
        .ppage-cta-button:hover {
          --ppage-angle: 160deg; --ppage-c1: #ffffff61; --ppage-c2: #ffffff61;
          color: #FFFFFF;
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(255,255,255,.25);
        }

        /* Main */
        .ppage-main { max-width: 1400px; margin: 0 auto; padding: 48px 24px 80px; display: flex; align-items: flex-start; gap: 24px; }
        .ppage-main-col { flex: 1 1 auto; min-width: 0; max-width: 900px; }
        .ppage-back-link { display: inline-flex; align-items: center; gap: 8px; font-size: 14px; color: #99A1AF; text-decoration: none; margin-bottom: 24px; cursor: default; }
        .ppage-eyebrow { font-size: 12px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; color: #99A1AF; margin-bottom: 12px; }
        .ppage-h1 { font-size: 40px; font-weight: 500; line-height: 1.25; color: #FFFFFF; margin: 0 0 16px; }
        .ppage-subheading { font-size: 18px; font-weight: 500; line-height: 1.5; color: #6A7282; margin: 0 0 40px; max-width: 620px; }

        .ppage-content { font-size: 16px; line-height: 1.6; color: #99A1AF; }
        .ppage-content h1 { font-size: 40px; font-weight: 500; line-height: 1.25; color: #FFFFFF; margin: 0 0 16px; }
        .ppage-content h2 { font-size: 30px; font-weight: 500; line-height: 1.5; color: #FFFFFF; margin: 0; padding: 44px 0 20px; border-top: 1px solid rgba(255,255,255,0.08); }
        .ppage-content h2:first-child { border-top: none; padding-top: 0; }
        .ppage-content h3 { font-size: 18px; font-weight: 500; line-height: 1.4; color: #FFFFFF; margin: 28px 0 12px; }
        .ppage-content p { margin: 0 0 18px; }
        .ppage-content ul { list-style: none; margin: 0 0 18px; padding: 0; }
        .ppage-content li { position: relative; padding-left: 20px; margin-bottom: 10px; }
        .ppage-content li::before { content: ''; position: absolute; left: 0; top: 9px; width: 6px; height: 6px; border-radius: 50%; background: #5BEBCD; }
        .ppage-content strong { color: #FFFFFF; }
        .ppage-content a { color: #5BEBCD; }

        .ppage-content-footer { margin-top: 56px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.08); font-size: 12px; color: #6A7282; }

        /* Request-estimate form card */
        .ppage-form-card { flex: 0 0 458px; width: 458px; max-width: 100%; display: flex; flex-direction: column; gap: 34px; padding: 24px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.05); border-radius: 20px; backdrop-filter: blur(12px); position: sticky; top: 96px; }
        .ppage-form-heading { font-size: 24px; font-weight: 500; color: #FFFFFF; text-align: center; }
        .ppage-form-intro { font-size: 14px; line-height: 1.45; color: #99A1AF; text-align: center; margin: -22px 0 0; }
        .ppage-form-fields { display: flex; flex-direction: column; gap: 18px; }
        .ppage-form-field { display: flex; flex-direction: column; gap: 8px; }
        .ppage-form-label { font-size: 14px; color: #E5E7EB; }
        .ppage-form-required { color: #EF4444; }
        .ppage-form-input, .ppage-form-textarea { font: inherit; font-size: 16px; color: #FFFFFF; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.05); border-radius: 10px; padding: 12px; }
        .ppage-form-input::placeholder, .ppage-form-textarea::placeholder { color: #6A7282; }
        .ppage-form-textarea { resize: vertical; min-height: 90px; }
        .ppage-form-phone { display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.05); border-radius: 10px; padding: 12px; }
        .ppage-form-phone-code { font-size: 16px; color: #6A7282; }
        .ppage-form-phone-input { flex: 1; min-width: 0; font: inherit; font-size: 16px; color: #FFFFFF; background: transparent; border: none; outline: none; }
        .ppage-form-phone-input::placeholder { color: #6A7282; }
        .ppage-form-submit { font: inherit; font-size: 14px; font-weight: 500; color: #FFFFFF; text-align: center; padding: 14px; background: rgba(255,255,255,0.01); border: 1px solid rgba(255,255,255,0.15); border-radius: 10px; cursor: default; }

        @media (max-width: 1100px) {
          .ppage-main { flex-direction: column; }
          .ppage-form-card { position: static; width: 100%; }
        }

        /* Footer */
        .ppage-footer { border-top: 1px solid transparent; border-image: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0) 100%) 1; margin-top: 40px; }
        .ppage-footer-inner { max-width: 1512px; margin: 0 auto; padding: 48px; display: flex; flex-wrap: wrap; gap: 28px; }
        .ppage-footer-col { flex: 1 1 200px; display: flex; flex-direction: column; gap: 14px; }
        .ppage-footer-title { font-size: 14px; font-weight: 600; color: #FFFFFF; }
        .ppage-footer-link { font-size: 14px; color: #99A1AF; text-decoration: none; transition: color 0.3s ease-in; }
        .ppage-footer-link:hover { color: #FFFFFF; }
        .ppage-footer-company { flex: 0 0 340px; max-width: 340px; margin-right: 114px; }
        .ppage-footer-logo { width: 173px; height: 28px; align-self: flex-start; margin-bottom: 4px; }
        .ppage-footer-about { font-size: 14px; line-height: 1.45; color: #99A1AF; margin: 0; }
        .ppage-footer-copyright { font-size: 12px; color: #6A7282; margin: 0; }

        @media (max-width: 900px) {
          .ppage-nav-links { display: none; }
          .ppage-footer-company { margin-right: 0; flex-basis: 100%; }
        }
      ` }} />
    </div>
  );
}

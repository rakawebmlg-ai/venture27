import { NextRequest, NextResponse } from 'next/server';
// Subpath import (not the '@venture27/database' barrel) - proxy.ts runs in
// the Edge Runtime, which can't load PrismaClient (instantiated at module
// scope in the barrel's index.ts).
import { SESSION_COOKIE_NAME, verifySessionToken } from '@venture27/database/lib/session';

// Next.js 16 renamed Middleware to Proxy (same mechanism, new file name/
// export) - see node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md.
// A plain `middleware.ts` file is silently ignored in this version.

// Anything NOT matched here requires a valid session cookie. The public
// programmatic pages (/{type}/services/{value}/{service}/{heading}) and the
// SEO files that reference them (robots.txt, the sitemap index, and each
// sitemap chunk) must stay reachable without login - they're meant to be
// crawled/visited by the public, not just the operator.
const PUBLIC_PROGRAMMATIC_PAGE = /^\/[^/]+\/services\/[^/]+\/[^/]+\/[^/]+\/?$/;

// Everything under apps/frontend/public/ (logos, per-page icons, etc.) is
// static and non-sensitive by nature of living in /public at all - gating
// it would just break images on both /login and the public programmatic
// pages (caught live: /venture27-logo.png was 307-redirecting to /login
// before this, silently breaking the logo everywhere it's used).
const STATIC_ASSET_EXTENSIONS = /\.(png|jpg|jpeg|gif|webp|svg|ico|css|js|woff2?|ttf|map)$/i;

function isPublicPath(pathname: string): boolean {
  if (pathname === '/login') return true;
  if (pathname.startsWith('/api/auth/')) return true;
  if (pathname === '/robots.txt') return true;
  if (pathname === '/sitemap-index.xml') return true;
  if (pathname.startsWith('/sitemaps/')) return true;
  if (STATIC_ASSET_EXTENSIONS.test(pathname)) return true;
  if (PUBLIC_PROGRAMMATIC_PAGE.test(pathname)) return true;
  return false;
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const authed = await verifySessionToken(token);

  if (!authed) {
    // API routes get a JSON 401 (a fetch() call can't follow an HTML
    // redirect meaningfully) - everything else redirects to /login,
    // preserving where the user was headed via ?next=.
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const loginUrl = new URL('/login', req.nextUrl);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Runs on everything except Next's own static/image internals - deliberately
  // INCLUDES /api/* (rather than excluding it like the Next.js docs' own
  // example does) so every existing API route gets covered by this one
  // check instead of needing its own auth check added individually.
  matcher: ['/((?!_next/static|_next/image).*)'],
};

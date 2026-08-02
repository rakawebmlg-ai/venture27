/** @type {import('next').NextConfig} */
const nextConfig = {
  // All backend logic (Prisma queries, BullMQ, SMTP, etc.) now lives in
  // apps/backend as a real Express server - this app no longer has its own
  // app/api/* route handlers. Every /api/* request is transparently proxied
  // there instead. `proxy.ts` still gates access (it matches on the
  // original /api/... path before this rewrite is resolved), and Set-Cookie
  // from the backend's login/logout routes passes through normally since
  // this is a true reverse-proxy rewrite, not a client-side redirect.
  // BACKEND_URL defaults to the same value used everywhere else in this
  // repo (see apps/backend's own PORT default) - both processes always run
  // on the same host (either two localhost dev servers, or side-by-side in
  // the same production container), so this never needs to be a public URL.
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
    return [
      { source: '/api/:path*', destination: `${backendUrl}/api/:path*` },
    ];
  },
};

export default nextConfig;

import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export const SESSION_COOKIE_NAME = 'v27_session';
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// SESSION_SECRET must be set in production (see .env.example) - this
// fallback only exists so local dev doesn't hard-crash before the user has
// configured it, not because it's safe to ship.
const secretKey = process.env.SESSION_SECRET || 'insecure-dev-only-secret-set-SESSION_SECRET-in-env';
const encodedKey = new TextEncoder().encode(secretKey);

// Pure sign/verify - no `cookies()` dependency, so this half is usable from
// both Route Handlers (via next/headers) and proxy.ts (via req.cookies).
export async function signSessionToken(): Promise<string> {
  return new SignJWT({ auth: true })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor((Date.now() + SESSION_DURATION_MS) / 1000))
    .sign(encodedKey);
}

export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    await jwtVerify(token, encodedKey, { algorithms: ['HS256'] });
    return true;
  } catch {
    return false;
  }
}

export async function createSession() {
  const token = await signSessionToken();
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(Date.now() + SESSION_DURATION_MS),
    sameSite: 'lax',
    path: '/',
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

import { SignJWT, jwtVerify } from 'jose';

export const SESSION_COOKIE_NAME = 'v27_session';
export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// SESSION_SECRET must be set in production (see .env.example) - this
// fallback only exists so local dev doesn't hard-crash before it's been
// configured, not because it's safe to ship.
const secretKey = process.env.SESSION_SECRET || 'insecure-dev-only-secret-set-SESSION_SECRET-in-env';
const encodedKey = new TextEncoder().encode(secretKey);

// Framework-agnostic sign/verify - usable from the frontend's proxy.ts
// (auth gate) and the backend's Express auth routes (issues the cookie),
// which is why this lives in the shared package rather than either app.
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

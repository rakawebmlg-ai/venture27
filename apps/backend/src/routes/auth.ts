import { Router } from 'express';
import { SESSION_COOKIE_NAME, SESSION_DURATION_MS, signSessionToken } from '@venture27/database';

const router = Router();

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body ?? {};

    const expectedUsername = process.env.DASHBOARD_USERNAME;
    const expectedPassword = process.env.DASHBOARD_PASSWORD;
    if (!expectedUsername || !expectedPassword) {
      return res.status(500).json({ error: 'DASHBOARD_USERNAME/DASHBOARD_PASSWORD are not set on the server - login is not configured yet.' });
    }

    if (typeof username !== 'string' || username !== expectedUsername || typeof password !== 'string' || password !== expectedPassword) {
      return res.status(401).json({ error: 'Incorrect username or password' });
    }

    const token = await signSessionToken();
    res.cookie(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: SESSION_DURATION_MS,
      sameSite: 'lax',
      path: '/',
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Login failed:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
  res.json({ success: true });
});

export default router;

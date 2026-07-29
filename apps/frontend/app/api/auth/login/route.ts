import { NextResponse } from 'next/server';
import { createSession } from '../../../lib/session';

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    const expectedUsername = process.env.DASHBOARD_USERNAME;
    const expectedPassword = process.env.DASHBOARD_PASSWORD;
    if (!expectedUsername || !expectedPassword) {
      return NextResponse.json(
        { error: 'DASHBOARD_USERNAME/DASHBOARD_PASSWORD are not set on the server - login is not configured yet.' },
        { status: 500 }
      );
    }

    if (typeof username !== 'string' || username !== expectedUsername || typeof password !== 'string' || password !== expectedPassword) {
      return NextResponse.json({ error: 'Incorrect username or password' }, { status: 401 });
    }

    await createSession();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Login failed:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

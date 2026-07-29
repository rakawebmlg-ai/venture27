import { NextResponse } from 'next/server';
import { prisma } from '@venture27/database';

// Lists past/current generation jobs for the History page. Capped at the
// most recent 200 - Job rows accumulate over time and there's no need to
// ship the entire table on every load.
export async function GET() {
  try {
    const jobs = await prisma.job.findMany({
      orderBy: { id: 'desc' },
      take: 200
    });
    return NextResponse.json(jobs);
  } catch (error) {
    console.error('Failed to fetch jobs:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

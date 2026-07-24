import { NextResponse } from 'next/server';
import { prisma } from '@venture27/database';

export async function GET() {
  try {
    const locationsCount = await prisma.location.count();
    const servicesCount = await prisma.service.count();
    const masterDataCount = await prisma.masterData.count();
    const generatedCount = await prisma.masterData.count({ where: { status: 'generated' } });
    
    const lastJob = await prisma.job.findFirst({
      orderBy: { id: 'desc' }
    });

    return NextResponse.json({
      stats: {
        locations: locationsCount,
        coreServices: servicesCount,
        masterDataGenerated: masterDataCount,
        contentGenerated: generatedCount
      },
      lastJob: lastJob || null
    });
  } catch (error) {
    console.error('Failed to fetch overview data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

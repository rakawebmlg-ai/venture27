import { NextResponse } from 'next/server';
import { prisma } from '@venture27/database';
import Papa from 'papaparse';

export async function GET(req: Request) {
  try {
    const data = await prisma.masterData.findMany({
      include: { location: true, service: true, category: true },
      orderBy: { id: 'desc' }
    });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch master data' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { category, locationsCsv, servicesCsv } = await req.json();

    if (!category || !locationsCsv || !servicesCsv) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Parse CSVs
    const parsedLocations = Papa.parse(locationsCsv, { header: true, skipEmptyLines: true }).data as any[];
    const parsedServices = Papa.parse(servicesCsv, { header: true, skipEmptyLines: true }).data as any[];

    // Ensure Category exists
    let cat = await prisma.category.findUnique({ where: { name: category } });
    if (!cat) {
      cat = await prisma.category.create({ data: { name: category } });
    }

    const createdData = [];

    // Combine logic
    for (const loc of parsedLocations) {
      const city = loc.City || loc.city;
      const province = loc.Province || loc.province;
      
      if (!city || !province) continue;

      let location = await prisma.location.findFirst({
        where: { city, province }
      });

      if (!location) {
        location = await prisma.location.create({ data: { city, province } });
      }

      for (const srv of parsedServices) {
        const name = srv['Service Name'] || srv.service_name || srv.name;
        if (!name) continue;

        let service = await prisma.service.findUnique({ where: { name } });
        if (!service) {
          service = await prisma.service.create({
            data: {
              name,
              metaTitle: srv['Meta Title'] || null,
              metaDescription: srv['Meta Description'] || null,
              heading: srv['Heading'] || null,
              subheading: srv['Subheading'] || null
            }
          });
        }

        // Create MasterData if it doesn't exist
        try {
          const md = await prisma.masterData.create({
            data: {
              categoryId: cat.id,
              locationId: location.id,
              serviceId: service.id,
              status: 'pending'
            },
            include: { location: true, service: true, category: true }
          });
          createdData.push(md);
        } catch (e: any) {
          // Ignore unique constraint violations (P2002)
          if (e.code !== 'P2002') console.error(e);
        }
      }
    }

    return NextResponse.json({ success: true, count: createdData.length, data: createdData });
  } catch (error) {
    console.error('Failed to generate master data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

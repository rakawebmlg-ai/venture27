import { NextResponse } from 'next/server';
import { prisma } from '@venture27/database';
import Papa from 'papaparse';

// Replaces {{City}} / {{Province}} placeholders (case-insensitive) with the
// row's actual location values, so each location x service combination shows
// its own rendered meta title/description/heading/subheading.
function renderPlaceholders(text: string | null | undefined, city: string, province: string): string | null {
  if (!text) return text ?? null;
  return text
    .replace(/\{\{\s*city\s*\}\}/gi, city)
    .replace(/\{\{\s*province\s*\}\}/gi, province);
}

export async function GET(req: Request) {
  try {
    const data = await prisma.masterData.findMany({
      include: { location: true, service: true, category: true },
      orderBy: { id: 'desc' }
    });

    const rendered = data.map((item: any) => {
      if (!item.location || !item.service) return item;
      const { city, province } = item.location;
      return {
        ...item,
        service: {
          ...item.service,
          metaTitle: renderPlaceholders(item.service.metaTitle, city, province),
          metaDescription: renderPlaceholders(item.service.metaDescription, city, province),
          heading: renderPlaceholders(item.service.heading, city, province),
          subheading: renderPlaceholders(item.service.subheading, city, province),
        }
      };
    });

    return NextResponse.json(rendered);
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

    // Parse CSVs. transformHeader trims stray whitespace/BOM that Excel-exported
    // CSVs commonly carry, which otherwise makes column lookups below silently fail.
    const csvOptions = {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h: string) => h.replace(/^﻿/, '').trim(),
      transform: (v: string) => (typeof v === 'string' ? v.trim() : v),
    };
    const parsedLocations = Papa.parse(locationsCsv, csvOptions).data as any[];
    const parsedServices = Papa.parse(servicesCsv, csvOptions).data as any[];

    // Ensure Category exists
    let cat = await prisma.category.findUnique({ where: { name: category } });
    if (!cat) {
      cat = await prisma.category.create({ data: { name: category } });
    }

    const createdData = [];
    let skippedLocationRows = 0;
    let skippedExistingCombos = 0;

    const validServices = parsedServices.filter((srv) => srv['Service Name'] || srv.service_name || srv.name);
    const skippedServiceRows = parsedServices.length - validServices.length;

    // Combine logic
    for (const loc of parsedLocations) {
      const city = loc.City || loc.city;
      const province = loc.Province || loc.province;

      if (!city || !province) {
        skippedLocationRows++;
        continue;
      }

      let location = await prisma.location.findFirst({
        where: { city, province }
      });

      if (!location) {
        location = await prisma.location.create({ data: { city, province } });
      }

      for (const srv of validServices) {
        const name = srv['Service Name'] || srv.service_name || srv.name;

        const metaTitle = srv['Meta Title'] || undefined;
        const metaDescription = srv['Meta Description'] || undefined;
        const heading = srv['Heading'] || undefined;
        const subheading = srv['Subheading'] || undefined;

        let service = await prisma.service.findUnique({ where: { name } });
        if (!service) {
          service = await prisma.service.create({
            data: {
              name,
              metaTitle: metaTitle ?? null,
              metaDescription: metaDescription ?? null,
              heading: heading ?? null,
              subheading: subheading ?? null
            }
          });
        } else if (metaTitle || metaDescription || heading || subheading) {
          // Re-uploading a CSV for an existing service refreshes its template
          // instead of silently keeping whatever was stored the first time.
          service = await prisma.service.update({
            where: { id: service.id },
            data: {
              ...(metaTitle && { metaTitle }),
              ...(metaDescription && { metaDescription }),
              ...(heading && { heading }),
              ...(subheading && { subheading }),
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
          // Ignore unique constraint violations (P2002) - combo already exists
          if (e.code === 'P2002') {
            skippedExistingCombos++;
          } else {
            console.error(e);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      count: createdData.length,
      data: createdData,
      skippedLocationRows,
      skippedServiceRows,
      skippedExistingCombos,
    });
  } catch (error) {
    console.error('Failed to generate master data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const idParam = searchParams.get('id');
    const categoryIdParam = searchParams.get('categoryId');

    if (idParam) {
      const id = Number(idParam);
      if (Number.isNaN(id)) {
        return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
      }
      await prisma.masterData.delete({ where: { id } });
      return NextResponse.json({ success: true, count: 1 });
    }

    if (categoryIdParam) {
      const categoryId = Number(categoryIdParam);
      if (Number.isNaN(categoryId)) {
        return NextResponse.json({ error: 'Invalid categoryId' }, { status: 400 });
      }
      const { count } = await prisma.masterData.deleteMany({ where: { categoryId } });
      return NextResponse.json({ success: true, count });
    }

    const body = await req.json().catch(() => null);
    const ids = body?.ids;
    if (Array.isArray(ids) && ids.length > 0) {
      const { count } = await prisma.masterData.deleteMany({ where: { id: { in: ids.map(Number) } } });
      return NextResponse.json({ success: true, count });
    }

    return NextResponse.json({ error: 'Provide id, categoryId, or ids' }, { status: 400 });
  } catch (error) {
    console.error('Failed to delete master data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

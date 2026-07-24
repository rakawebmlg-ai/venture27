import { NextResponse } from 'next/server';
import { prisma } from '@venture27/database';
import { renderPlaceholders } from '../../lib/placeholders';
import { buildSlug } from '../../lib/slug';
import { primaryLocationType } from '../../lib/location';

export async function GET(req: Request) {
  try {
    const data = await prisma.masterData.findMany({
      where: { status: 'generated' },
      include: { location: true, service: true, category: true },
      orderBy: { id: 'desc' }
    });

    const rendered = data.map((item: any) => {
      if (!item.location || !item.service) return item;
      return {
        ...item,
        service: {
          ...item.service,
          metaTitle: renderPlaceholders(item.service.metaTitle, item.location),
          metaDescription: renderPlaceholders(item.service.metaDescription, item.location),
          heading: renderPlaceholders(item.service.heading, item.location),
          subheading: renderPlaceholders(item.service.subheading, item.location),
        }
      };
    });

    return NextResponse.json(rendered);
  } catch (error) {
    console.error('Failed to fetch publishable content:', error);
    return NextResponse.json({ error: 'Failed to fetch publishable content' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { action, ids, categoryId } = await req.json();

    if (action !== 'import' && action !== 'unpublish') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const publishing = action === 'import';

    // 'import' only ever targets already-generated content that isn't published
    // yet; 'unpublish' only ever targets currently-published rows. Either an
    // explicit id list or a whole category can be targeted, but not neither.
    const where: any = {
      status: 'generated',
      published: !publishing,
    };

    if (Array.isArray(ids) && ids.length > 0) {
      where.id = { in: ids.map(Number) };
    } else if (categoryId) {
      where.categoryId = Number(categoryId);
    } else {
      return NextResponse.json({ error: 'Provide ids or categoryId' }, { status: 400 });
    }

    if (!publishing) {
      // Unpublishing doesn't need a per-row slug computation, a plain bulk
      // update is fine (the slug itself is left in place so re-publishing
      // later reuses the same URL instead of generating a new one).
      const { count } = await prisma.masterData.updateMany({
        where,
        data: { published: false, publishedAt: null }
      });
      return NextResponse.json({ success: true, count });
    }

    // Importing (publishing) computes a slug per row from its own
    // location/category/service, so this can't be a single updateMany -
    // each row needs its own `data`.
    const rows = await prisma.masterData.findMany({
      where,
      include: { location: true, service: true, category: true }
    });

    let count = 0;
    for (const row of rows) {
      const located = primaryLocationType(row.location.city, row.location.community, row.location.county);
      if (!located) {
        // Shouldn't happen (a Location always has at least one of the three
        // by the time it's created), but skip rather than crash the batch.
        continue;
      }
      const heading = renderPlaceholders(row.service.heading, row.location) || row.service.name;
      const slug = buildSlug(located.type, located.value, row.service.name, heading);
      try {
        await prisma.masterData.update({
          where: { id: row.id },
          data: { published: true, publishedAt: new Date(), slug }
        });
      } catch (e: any) {
        if (e.code === 'P2002') {
          // Slug collision (e.g. two same-named cities in different
          // provinces) - disambiguate with the row id rather than failing
          // the whole import.
          await prisma.masterData.update({
            where: { id: row.id },
            data: { published: true, publishedAt: new Date(), slug: `${slug}-${row.id}` }
          });
        } else {
          throw e;
        }
      }
      count++;
    }

    return NextResponse.json({ success: true, count });
  } catch (error) {
    console.error('Failed to update publish status:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

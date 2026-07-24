import { NextResponse } from 'next/server';
import { prisma } from '@venture27/database';
import { renderPlaceholders } from '../../lib/placeholders';

export async function GET(req: Request) {
  try {
    const data = await prisma.masterData.findMany({
      where: { status: 'generated' },
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

    const { count } = await prisma.masterData.updateMany({
      where,
      data: {
        published: publishing,
        publishedAt: publishing ? new Date() : null,
      }
    });

    return NextResponse.json({ success: true, count });
  } catch (error) {
    console.error('Failed to update publish status:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

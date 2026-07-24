import { NextResponse } from 'next/server';
import { prisma } from '@venture27/database';

export async function GET(req: Request) {
  try {
    const prompts = await prisma.promptTemplate.findMany({
      orderBy: { updatedAt: 'desc' }
    });
    return NextResponse.json(prompts);
  } catch (error) {
    console.error('Failed to fetch prompt templates:', error);
    return NextResponse.json({ error: 'Failed to fetch prompt templates' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, content } = await req.json();

    if (!name || !name.trim() || !content || !content.trim()) {
      return NextResponse.json({ error: 'Name and content are required' }, { status: 400 });
    }

    // Saving under a name that already exists updates it in place, so
    // re-uploading the same prompt.md just refreshes its saved copy.
    const prompt = await prisma.promptTemplate.upsert({
      where: { name: name.trim() },
      update: { content },
      create: { name: name.trim(), content }
    });

    return NextResponse.json(prompt);
  } catch (error) {
    console.error('Failed to save prompt template:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const idParam = searchParams.get('id');
    const id = Number(idParam);
    if (!idParam || Number.isNaN(id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }

    await prisma.promptTemplate.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete prompt template:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

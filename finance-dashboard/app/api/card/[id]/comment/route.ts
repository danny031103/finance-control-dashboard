import { NextResponse } from 'next/server';
import { addComment } from '@/lib/trello';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { text } = await request.json();
  try {
    await addComment(id, text);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 });
  }
}

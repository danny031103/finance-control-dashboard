import { NextResponse } from 'next/server';
import { updateCard } from '@/lib/trello';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  try {
    await updateCard(id, body);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Failed to update card' }, { status: 500 });
  }
}

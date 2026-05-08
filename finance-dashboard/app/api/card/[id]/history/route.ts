import { NextResponse } from 'next/server';
import { getCardHistory } from '@/lib/trello';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const actions = await getCardHistory(id);
    return NextResponse.json(actions);
  } catch {
    return NextResponse.json({ error: 'Failed to load history' }, { status: 500 });
  }
}

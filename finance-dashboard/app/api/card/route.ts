import { NextResponse } from 'next/server';
import { createCard } from '@/lib/trello';

export async function POST(request: Request) {
  const { listId, name, idMembers, due } = await request.json();
  if (!listId || !name) {
    return NextResponse.json({ error: 'listId and name are required' }, { status: 400 });
  }
  try {
    const card = await createCard(listId, { name, idMembers, due });
    return NextResponse.json(card);
  } catch {
    return NextResponse.json({ error: 'Failed to create card' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import {
  getBoardData,
  getBoardHistory,
  getCachedBoardData,
  computeDaysInColumn,
  type CardAction,
} from '@/lib/trello';

export async function GET() {
  let stale = false;
  let boardData;

  try {
    boardData = await getBoardData();
  } catch {
    const cached = getCachedBoardData();
    if (cached) {
      boardData = cached.data;
      stale = true;
    } else {
      return NextResponse.json({ error: 'Failed to load board data' }, { status: 502 });
    }
  }

  let history: Record<string, CardAction[]> = {};
  try {
    history = await getBoardHistory();
  } catch {
    // daysInColumn falls back to dateLastActivity
  }

  const cards = boardData.cards.map((card) => ({
    ...card,
    daysInColumn: computeDaysInColumn(card, history[card.id] ?? []),
  }));

  return NextResponse.json({ ...boardData, cards, stale });
}

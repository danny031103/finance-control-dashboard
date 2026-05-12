import { NextResponse } from 'next/server';
import { getBoardData } from '@/lib/trello';

const TEAM_LIST_RE = /here.{0,5}team|team.{0,5}schedule|^resources$/i;

export async function GET() {
  const boardData = await getBoardData();

  const teamLists = boardData.lists.filter((l) => TEAM_LIST_RE.test(l.name));
  const teamListIds = new Set(teamLists.map((l) => l.id));

  const cardsByList: Record<string, { id: string; name: string; desc: string; shortUrl: string }[]> = {};
  for (const list of teamLists) {
    cardsByList[list.id] = [];
  }
  for (const card of boardData.cards) {
    if (teamListIds.has(card.idList)) {
      cardsByList[card.idList].push({
        id: card.id,
        name: card.name,
        desc: card.desc ?? '',
        shortUrl: card.shortUrl,
      });
    }
  }

  return NextResponse.json({
    lists: teamLists.map((l) => ({
      id: l.id,
      name: l.name,
      cards: cardsByList[l.id] ?? [],
    })),
  });
}

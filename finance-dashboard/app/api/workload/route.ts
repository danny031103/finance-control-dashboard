import { NextResponse } from 'next/server';
import { getBoardData, getBoardHistory, computeDaysInColumn } from '@/lib/trello';
import { getMemberColor, getInitials } from '@/lib/utils';

export interface StuckCard {
  id: string;
  name: string;
  shortUrl: string;
  columnName: string;
  daysStuck: number;
}

export interface MemberWorkload {
  id: string;
  name: string;
  initials: string;
  color: string;
  totalCards: number;
  columnBreakdown: { columnName: string; count: number }[];
  stuckCards: StuckCard[];
  stuckCount: number;
}

export interface WorkloadData {
  members: MemberWorkload[];
  unassigned: {
    totalCards: number;
    columnBreakdown: { columnName: string; count: number }[];
    stuckCards: StuckCard[];
    stuckCount: number;
  };
}

export async function GET() {
  const [boardData, history] = await Promise.all([getBoardData(), getBoardHistory()]);

  // Build a lookup: listId -> list name
  const listMap = new Map(boardData.lists.map((l) => [l.id, l.name]));

  // Non-work columns (hidden from board)
  const excludedListIds = new Set(
    boardData.lists
      .filter((l) => /team.{0,5}schedule|here.{0,5}team|^resources$/i.test(l.name))
      .map((l) => l.id)
  );
  const doneListIds = new Set(
    boardData.lists.filter((l) => /done|completed|closed/i.test(l.name)).map((l) => l.id)
  );

  // Only cards sitting in these columns can be flagged as "stuck"
  const stuckEligibleListIds = new Set(
    boardData.lists
      .filter((l) => /in.{0,5}progress|up.{0,5}next|pending/i.test(l.name))
      .map((l) => l.id)
  );

  // Filter to active, non-excluded cards
  const activeCards = boardData.cards.filter(
    (c) => !excludedListIds.has(c.idList) && !doneListIds.has(c.idList)
  );

  // Per-member aggregation
  const memberMap = new Map<string, MemberWorkload>(
    boardData.members.map((m) => [
      m.id,
      {
        id: m.id,
        name: m.fullName,
        initials: getInitials(m.fullName),
        color: getMemberColor(m.fullName),
        totalCards: 0,
        columnBreakdown: [],
        stuckCards: [],
        stuckCount: 0,
      },
    ])
  );

  // Intermediate: memberId -> { columnName -> count }
  const memberColumnCounts = new Map<string, Map<string, number>>();
  const unassignedColumnCounts = new Map<string, number>();
  const unassignedStuck: StuckCard[] = [];

  for (const card of activeCards) {
    const columnName = listMap.get(card.idList) ?? card.idList;
    const cardActions = history[card.id] ?? [];
    const days = computeDaysInColumn(card, cardActions);
    const isStuck = days >= 7 && stuckEligibleListIds.has(card.idList);

    const stuckEntry: StuckCard = {
      id: card.id,
      name: card.name,
      shortUrl: card.shortUrl,
      columnName,
      daysStuck: days,
    };

    if (card.idMembers.length === 0) {
      // Unassigned
      unassignedColumnCounts.set(columnName, (unassignedColumnCounts.get(columnName) ?? 0) + 1);
      if (isStuck) unassignedStuck.push(stuckEntry);
    } else {
      for (const memberId of card.idMembers) {
        const member = memberMap.get(memberId);
        if (!member) continue;

        member.totalCards++;

        const cols = memberColumnCounts.get(memberId) ?? new Map<string, number>();
        cols.set(columnName, (cols.get(columnName) ?? 0) + 1);
        memberColumnCounts.set(memberId, cols);

        if (isStuck) {
          // Avoid duplicate stuck entries if a card has multiple members
          if (!member.stuckCards.find((s) => s.id === card.id)) {
            member.stuckCards.push(stuckEntry);
            member.stuckCount++;
          }
        }
      }
    }
  }

  // Finalize column breakdowns
  for (const [memberId, colMap] of memberColumnCounts) {
    const member = memberMap.get(memberId);
    if (!member) continue;
    member.columnBreakdown = Array.from(colMap.entries())
      .map(([columnName, count]) => ({ columnName, count }))
      .sort((a, b) => b.count - a.count);
  }

  // Sort stuck cards by days desc
  for (const member of memberMap.values()) {
    member.stuckCards.sort((a, b) => b.daysStuck - a.daysStuck);
  }
  unassignedStuck.sort((a, b) => b.daysStuck - a.daysStuck);

  // Build response — only include members with at least 1 card, sorted by totalCards desc
  const members = Array.from(memberMap.values())
    .filter((m) => m.totalCards > 0)
    .sort((a, b) => b.totalCards - a.totalCards);

  const unassignedColumnBreakdown = Array.from(unassignedColumnCounts.entries())
    .map(([columnName, count]) => ({ columnName, count }))
    .sort((a, b) => b.count - a.count);

  const result: WorkloadData = {
    members,
    unassigned: {
      totalCards: Array.from(unassignedColumnCounts.values()).reduce((s, n) => s + n, 0),
      columnBreakdown: unassignedColumnBreakdown,
      stuckCards: unassignedStuck,
      stuckCount: unassignedStuck.length,
    },
  };

  return NextResponse.json(result);
}

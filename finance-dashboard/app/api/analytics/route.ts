import { NextResponse } from 'next/server';
import { getBoardData, getBoardHistory, type CardAction } from '@/lib/trello';
import { getMemberColor } from '@/lib/utils';

function isoWeekLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return `Week of ${monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

function last8WeekLabels(): string[] {
  const weeks: string[] = [];
  const now = new Date();
  for (let i = 7; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i * 7);
    weeks.push(isoWeekLabel(d.toISOString()));
  }
  return [...new Set(weeks)];
}

function isCompletedAction(action: CardAction): boolean {
  return (
    action.type === 'updateCard' &&
    !!action.data.listAfter &&
    /done|completed/i.test(action.data.listAfter.name)
  );
}

function withinLast8Weeks(dateStr: string): boolean {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 56);
  return new Date(dateStr) >= cutoff;
}

export async function GET() {
  const [boardData, history] = await Promise.all([getBoardData(), getBoardHistory()]);

  const allActions: (CardAction & { cardId: string })[] = [];
  for (const [cardId, actions] of Object.entries(history)) {
    for (const action of actions) {
      allActions.push({ ...action, cardId });
    }
  }

  const weekLabels = last8WeekLabels();

  // Dataset A: cards completed per week
  const completionsPerWeek: Record<string, number> = {};
  for (const label of weekLabels) completionsPerWeek[label] = 0;

  for (const action of allActions) {
    if (isCompletedAction(action) && withinLast8Weeks(action.date)) {
      const label = isoWeekLabel(action.date);
      if (label in completionsPerWeek) completionsPerWeek[label]++;
    }
  }

  const cardsCompletedPerWeek = weekLabels.map((week) => ({
    week,
    count: completionsPerWeek[week] ?? 0,
  }));

  // Dataset B: average time per column
  const columnDaysTotals: Record<string, number> = {};
  const columnCardCounts: Record<string, number> = {};

  for (const card of boardData.cards) {
    const actions = (history[card.id] ?? [])
      .filter((a) => a.type === 'updateCard' && a.data.listAfter)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const timeline: { listName: string; enteredAt: Date }[] = [];

    for (const action of actions) {
      if (action.data.listBefore) {
        if (timeline.length === 0) {
          timeline.push({ listName: action.data.listBefore.name, enteredAt: new Date(card.dateLastActivity) });
        }
      }
      if (action.data.listAfter) {
        timeline.push({ listName: action.data.listAfter.name, enteredAt: new Date(action.date) });
      }
    }

    for (let i = 0; i < timeline.length; i++) {
      const { listName, enteredAt } = timeline[i];
      if (/team schedules/i.test(listName)) continue;
      const exitAt = i + 1 < timeline.length ? timeline[i + 1].enteredAt : new Date();
      const days = (exitAt.getTime() - enteredAt.getTime()) / (1000 * 60 * 60 * 24);
      if (days < 0) continue;
      columnDaysTotals[listName] = (columnDaysTotals[listName] ?? 0) + days;
      columnCardCounts[listName] = (columnCardCounts[listName] ?? 0) + 1;
    }
  }

  const avgTimePerColumn = Object.entries(columnDaysTotals)
    .map(([list, total]) => ({
      list,
      avgDays: parseFloat((total / (columnCardCounts[list] ?? 1)).toFixed(1)),
    }))
    .sort((a, b) => b.avgDays - a.avgDays);

  // Dataset C: cards completed per person per week
  const perPersonWeekMap: Record<string, Record<string, number>> = {};
  const allMembers = new Set<string>();

  for (const action of allActions) {
    if (isCompletedAction(action) && withinLast8Weeks(action.date)) {
      const label = isoWeekLabel(action.date);
      if (!(label in completionsPerWeek)) continue;
      const person = action.memberCreator.fullName;
      allMembers.add(person);
      if (!perPersonWeekMap[label]) perPersonWeekMap[label] = {};
      perPersonWeekMap[label][person] = (perPersonWeekMap[label][person] ?? 0) + 1;
    }
  }

  const cardsPerPersonPerWeek = weekLabels.map((week) => {
    const entry: Record<string, string | number> = { week };
    for (const person of allMembers) {
      entry[person] = perPersonWeekMap[week]?.[person] ?? 0;
    }
    return entry;
  });

  // Dataset D: active cards by assignee
  const doneListIds = new Set(
    boardData.lists
      .filter((l) => /done|completed/i.test(l.name) || /team schedules/i.test(l.name))
      .map((l) => l.id)
  );

  const assigneeCounts: Record<string, number> = {};
  for (const card of boardData.cards) {
    if (doneListIds.has(card.idList)) continue;
    if (card.idMembers.length === 0) {
      assigneeCounts['Unassigned'] = (assigneeCounts['Unassigned'] ?? 0) + 1;
    } else {
      for (const memberId of card.idMembers) {
        const member = boardData.members.find((m) => m.id === memberId);
        const name = member?.fullName ?? memberId;
        assigneeCounts[name] = (assigneeCounts[name] ?? 0) + 1;
      }
    }
  }

  const activeCardsByAssignee = Object.entries(assigneeCounts).map(([name, count]) => ({
    name,
    count,
    color: getMemberColor(name),
  }));

  // Dataset E: card age distribution
  const buckets: Record<string, number> = {
    '0-7d': 0,
    '8-14d': 0,
    '15-30d': 0,
    '31-60d': 0,
    '60+d': 0,
  };

  const now = Date.now();
  for (const card of boardData.cards) {
    if (doneListIds.has(card.idList)) continue;
    const days = Math.floor((now - new Date(card.dateLastActivity).getTime()) / (1000 * 60 * 60 * 24));
    if (days <= 7) buckets['0-7d']++;
    else if (days <= 14) buckets['8-14d']++;
    else if (days <= 30) buckets['15-30d']++;
    else if (days <= 60) buckets['31-60d']++;
    else buckets['60+d']++;
  }

  const cardAgeDistribution = Object.entries(buckets).map(([bucket, count]) => ({ bucket, count }));

  return NextResponse.json({
    cardsCompletedPerWeek,
    avgTimePerColumn,
    cardsPerPersonPerWeek,
    activeCardsByAssignee,
    cardAgeDistribution,
    members: [...allMembers],
    weekCount: weekLabels.length,
  });
}

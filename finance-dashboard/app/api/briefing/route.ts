import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import {
  getBoardData,
  getBoardHistory,
  computeDaysInColumn,
  type CardAction,
} from '@/lib/trello';

const SYSTEM_PROMPT = `You are a project status assistant. Analyze the board data and generate a structured Monday morning briefing. Use the following format:

## Summary
[2-3 sentence overview of board health]

## At Risk
[Cards overdue or in column 8+ days — bullet list]

## Completed Recently
[Cards moved to done columns in the last 7 days — bullet list]

## In Progress
[Active cards per person, grouped by assignee — bullet list]

## Blocked / Needs Attention
[Cards with no activity in 7+ days outside done columns — bullet list]

Be concise. Base your output only on the data provided.`;

function withinLast7Days(dateStr: string): boolean {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  return new Date(dateStr) >= cutoff;
}

export async function POST() {
  try {
    const [boardData, history] = await Promise.all([getBoardData(), getBoardHistory()]);

    const teamSchedulesIds = new Set(
      boardData.lists
        .filter((l) => /team\s*schedules/i.test(l.name))
        .map((l) => l.id)
    );

    const listMap = new Map(boardData.lists.map((l) => [l.id, l.name]));
    const memberMap = new Map(boardData.members.map((m) => [m.id, m.fullName]));

    let cards = boardData.cards.filter((c) => !teamSchedulesIds.has(c.idList));

    let truncated = false;
    if (cards.length > 50) {
      cards = cards
        .slice()
        .sort(
          (a, b) =>
            new Date(b.dateLastActivity).getTime() - new Date(a.dateLastActivity).getTime()
        )
        .slice(0, 50);
      truncated = true;
    }

    const snapshot = cards.map((card) => {
      const cardActions: CardAction[] = history[card.id] ?? [];

      const recentComments = cardActions
        .filter((a) => a.type === 'commentCard' && withinLast7Days(a.date))
        .map((a) => ({ author: a.memberCreator.fullName, text: a.data.text ?? '' }));

      const totalItems = card.checklists.reduce((s, cl) => s + cl.checkItems.length, 0);
      const doneItems = card.checklists.reduce(
        (s, cl) => s + cl.checkItems.filter((i) => i.state === 'complete').length,
        0
      );

      return {
        title: card.name,
        column: listMap.get(card.idList) ?? card.idList,
        assignees: card.idMembers.map((id) => memberMap.get(id) ?? id),
        daysInColumn: computeDaysInColumn(card, cardActions),
        due: card.due ?? null,
        overdue: card.due ? new Date(card.due) < new Date() && !card.dueComplete : false,
        checklist: totalItems > 0 ? `${doneItems}/${totalItems} items complete` : null,
        recentComments,
      };
    });

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: JSON.stringify(snapshot) }],
    });

    const briefing =
      message.content[0].type === 'text' ? message.content[0].text : '';

    return NextResponse.json({
      briefing,
      generatedAt: new Date().toISOString(),
      truncated,
    });
  } catch (err) {
    console.error('Briefing generation error:', err);
    return NextResponse.json({ error: 'AI generation failed' }, { status: 500 });
  }
}

import Anthropic from '@anthropic-ai/sdk';
import {
  getBoardData,
  getBoardHistory,
  computeDaysInColumn,
  type CardAction,
} from '@/lib/trello';
import { getLabelAssignees } from '@/lib/utils';

function relativeDue(due: string | null, dueComplete: boolean): string | null {
  if (!due) return null;
  if (dueComplete) return 'completed';
  const diff = Math.round((new Date(due).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diff < -1) return `overdue by ${Math.abs(diff)} days`;
  if (diff === -1) return 'overdue by 1 day';
  if (diff === 0) return 'due today';
  if (diff === 1) return 'due tomorrow';
  return `due in ${diff} days`;
}

function withinLast7Days(dateStr: string): boolean {
  return new Date(dateStr) >= new Date(Date.now() - 7 * 86400000);
}

function inRange(dateStr: string, fromDays: number, toDays: number): boolean {
  const t = new Date(dateStr).getTime();
  const now = Date.now();
  return t >= now - toDays * 86400000 && t < now - fromDays * 86400000;
}

function isCompletionAction(action: CardAction): boolean {
  return (
    action.type === 'updateCard' &&
    !!action.data.listAfter &&
    /done|completed/i.test(action.data.listAfter.name)
  );
}

const SYSTEM_PROMPT = `You are a project analyst for a small PepsiCo finance/IT team. Generate a concise Monday morning briefing from the Trello board snapshot. Be specific and direct — use card names and assignee names. Do not pad.

Use exactly these section headers:

## Summary
2–3 sentences on overall board health and momentum. Mention whether completions are trending up or down vs last week.

## At Risk
Cards overdue or stuck in the same column 8+ days. For each: card name, assignee(s), how long stuck or how overdue. If none: "Nothing critical at this time."
IMPORTANT: Skip any card with infoOnly=true — those are reference/resource cards, not tasks.

## Completed This Week
Cards moved to a done/completed column in the last 7 days. For each: card name, who completed it. If none: "No completions recorded this week."

## In Progress
Active work per person, grouped by assignee name. For each person: their cards, current column, checklist progress if any. Skip cards in done columns and cards with infoOnly=true.

## Needs Attention
Cards with no activity in 7+ days that are not in done columns. For each: card name, assignee, days since last move. If none: "All cards have recent activity."
IMPORTANT: Skip any card with infoOnly=true — those are reference/resource cards, not tasks.

## Upcoming Notices
Holidays, time-off, or team notices from the Team Schedules column for the next 30 days. List each with its date if known. If none upcoming: "No upcoming notices this period."

Rules: use names not IDs; reference due dates in human terms; if no assignee say "Unassigned"; use label names for context.`;

export async function POST() {
  try {
    const [boardData, history] = await Promise.all([getBoardData(), getBoardHistory()]);

    const teamSchedulesIds = new Set(
      boardData.lists.filter((l) => /team\s*schedules/i.test(l.name)).map((l) => l.id)
    );
    const infoOnlyIds = new Set(
      boardData.lists
        .filter((l) => /resources|here'?s\s+the\s+team/i.test(l.name))
        .map((l) => l.id)
    );
    const doneListIds = new Set(
      boardData.lists.filter((l) => /done|completed/i.test(l.name)).map((l) => l.id)
    );
    const listMap = new Map(boardData.lists.map((l) => [l.id, l.name]));

    const teamSchedulesCards = boardData.cards
      .filter((c) => teamSchedulesIds.has(c.idList))
      .map((c) => c.name);

    let cards = boardData.cards.filter((c) => !teamSchedulesIds.has(c.idList));

    const allActions = Object.values(history).flat();
    const completedThisWeek = allActions.filter((a) => isCompletionAction(a) && inRange(a.date, 0, 7)).length;
    const completedLastWeek = allActions.filter((a) => isCompletionAction(a) && inRange(a.date, 7, 14)).length;

    let truncated = false;
    if (cards.length > 60) {
      cards = cards
        .slice()
        .sort((a, b) => new Date(b.dateLastActivity).getTime() - new Date(a.dateLastActivity).getTime())
        .slice(0, 60);
      truncated = true;
    }

    const snapshot = cards.map((card) => {
      const cardActions: CardAction[] = history[card.id] ?? [];
      const assignees = getLabelAssignees(card.labels).map((a) => a.name);

      const assigneeNames = new Set(assignees.map((n) => n.toLowerCase()));
      const contextLabels = card.labels
        .filter((l) => !assigneeNames.has(l.name.trim().toLowerCase()))
        .map((l) => l.name)
        .filter(Boolean);

      const recentComments = cardActions
        .filter((a) => a.type === 'commentCard' && withinLast7Days(a.date))
        .slice(0, 3)
        .map((a) => ({ author: a.memberCreator.fullName, text: (a.data.text ?? '').slice(0, 180) }));

      const totalItems = card.checklists.reduce((s, cl) => s + cl.checkItems.length, 0);
      const doneItems = card.checklists.reduce(
        (s, cl) => s + cl.checkItems.filter((i) => i.state === 'complete').length,
        0
      );

      return {
        title: card.name,
        column: listMap.get(card.idList) ?? card.idList,
        isDone: doneListIds.has(card.idList),
        infoOnly: infoOnlyIds.has(card.idList) ? true : undefined,
        assignees: assignees.length > 0 ? assignees : ['Unassigned'],
        labels: contextLabels.length > 0 ? contextLabels : undefined,
        daysInColumn: computeDaysInColumn(card, cardActions),
        due: relativeDue(card.due, card.dueComplete),
        checklist: totalItems > 0 ? `${doneItems}/${totalItems} done` : undefined,
        recentComments: recentComments.length > 0 ? recentComments : undefined,
      };
    });

    const userMessage = [
      `Completion trend: ${completedThisWeek} card(s) completed this week vs ${completedLastWeek} last week.`,
      teamSchedulesCards.length > 0
        ? `Team Schedules (holidays/notices — use for the Upcoming Notices section):\n${teamSchedulesCards.map((n) => `- ${n}`).join('\n')}`
        : 'Team Schedules: (empty)',
      `Board snapshot (${snapshot.length} active cards${truncated ? ', limited to 60 most recent' : ''}):`,
      JSON.stringify(snapshot, null, 2),
    ].join('\n\n');

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const stream = client.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
              controller.enqueue(encoder.encode(chunk.delta.text));
            }
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Truncated': truncated ? 'true' : 'false',
      },
    });
  } catch (err) {
    console.error('Briefing generation error:', err);
    return new Response(JSON.stringify({ error: 'AI generation failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
